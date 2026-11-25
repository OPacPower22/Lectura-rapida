import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { addDocument, listDocuments, savePosition } from '../../lib/storage/library'
import { LibraryPage } from './LibraryPage'

const chapters = [{ title: '', paragraphs: ['uno', 'dos', 'tres', 'cuatro'] }]

beforeEach(async () => {
  await db.delete()
  await db.open()
})
afterEach(() => vi.restoreAllMocks())

describe('LibraryPage', () => {
  it('lista los documentos con su avance y permite eliminar con confirmación', async () => {
    const a = await addDocument({ source: { type: 'libro', title: 'Libro A', author: 'Autora' }, doc: { format: 'epub', lang: 'es', title: 'Libro A', chapters, words: 4 } })
    await addDocument({ source: { type: 'web', title: 'Artículo B' }, doc: { format: 'web', lang: 'es', title: 'Artículo B', chapters, words: 4 } })
    await savePosition(a, { chapter: 0, paragraph: 2 })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<MemoryRouter><LibraryPage /></MemoryRouter>)
    expect(await screen.findByText('Libro A')).toBeInTheDocument()
    expect(screen.getByText('Artículo B')).toBeInTheDocument()
    expect(screen.getByText(/50 %/)).toBeInTheDocument()
    fireEvent.click(within(screen.getByText('Libro A').closest('li')!).getByRole('button', { name: t('library.delete') }))
    await waitFor(async () => expect(await listDocuments()).toHaveLength(1))
    await waitFor(() => expect(screen.queryByText('Libro A')).not.toBeInTheDocument())
  })

  it('muestra cómo empezar cuando está vacía', async () => {
    render(<MemoryRouter><LibraryPage /></MemoryRouter>)
    expect(await screen.findByText(t('library.empty'))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t('library.add') })).toBeInTheDocument()
  })
})
