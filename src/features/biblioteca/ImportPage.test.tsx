import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { t } from '../../i18n'
import { ImportError } from '../../lib/formats/types'
import { db } from '../../lib/storage/db'
import { listDocuments } from '../../lib/storage/library'
import { ImportPage } from './ImportPage'

vi.mock('../../lib/formats/pdf', () => ({
  importPdf: async () => {
    throw new ImportError('no-text')
  },
}))

const paragraph = (n: number) =>
  `<p>Párrafo ${n} del artículo compartido, con texto suficiente para que el extractor lo considere el contenido principal de la página.</p>`
const articleHtml = `<html><body><nav>Menú</nav><article><h1>Artículo pegado</h1>${[1, 2, 3, 4, 5].map(paragraph).join('')}</article></body></html>`

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/biblioteca/importar" element={<ImportPage />} />
        <Route path="/biblioteca/:id" element={<p>Lector abierto</p>} />
        <Route path="/biblioteca/fisico" element={<p>Modo libro físico</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('ImportPage', () => {
  it('pegar HTML de un artículo crea un documento web y abre el lector', async () => {
    renderAt('/biblioteca/importar')
    fireEvent.click(screen.getByRole('tab', { name: t('import.tab.paste') }))
    const area = screen.getByLabelText(t('import.pasteLabel'))
    fireEvent.paste(area, {
      clipboardData: { getData: (type: string) => (type === 'text/html' ? articleHtml : 'texto plano') },
    })
    fireEvent.click(screen.getByRole('button', { name: t('import.process') }))
    expect(await screen.findByDisplayValue(/Artículo pegado/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('import.save') }))
    expect(await screen.findByText('Lector abierto')).toBeInTheDocument()
    const [entry] = await listDocuments()
    expect(entry.doc.format).toBe('web')
    expect(entry.doc.chapters.flatMap((c) => c.paragraphs).join(' ')).not.toContain('Menú')
  })

  it('un PDF escaneado muestra el error y ofrece el modo libro físico', async () => {
    renderAt('/biblioteca/importar')
    const file = new File([new Uint8Array([37, 80, 68, 70])], 'escaneado.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText(t('import.fileLabel')), { target: { files: [file] } })
    expect(await screen.findByText(t('import.error.no-text'))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('import.usePhysical') }))
    expect(await screen.findByText('Modo libro físico')).toBeInTheDocument()
    expect(await listDocuments()).toEqual([])
  })

  it('con datos de «Compartir» prepara el pegado con la URL como fuente', async () => {
    renderAt('/biblioteca/importar?title=Nota&url=https%3A%2F%2Fejemplo.org%2Fa')
    expect(screen.getByRole('tab', { name: t('import.tab.paste') })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/https:\/\/ejemplo\.org\/a/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(t('import.pasteLabel')), { target: { value: 'Texto copiado del artículo.' } })
    fireEvent.click(screen.getByRole('button', { name: t('import.process') }))
    fireEvent.click(await screen.findByRole('button', { name: t('import.save') }))
    await waitFor(async () => {
      const [entry] = await listDocuments()
      expect(entry.source).toMatchObject({ type: 'web', url: 'https://ejemplo.org/a', title: 'Nota' })
    })
  })
})
