import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { listSessions } from '../../lib/storage/repo'
import { PasteReadPage } from './PasteReadPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('PasteReadPage', () => {
  it('no deja empezar con texto vacío o solo espacios', () => {
    render(<PasteReadPage />)
    const prepare = screen.getByRole('button', { name: t('paste.prepare') })
    expect(prepare).toBeDisabled()
    fireEvent.change(screen.getByLabelText(t('paste.textLabel')), { target: { value: '   \n ' } })
    expect(prepare).toBeDisabled()
    fireEvent.change(screen.getByLabelText(t('paste.textLabel')), { target: { value: 'hola mundo' } })
    expect(prepare).toBeEnabled()
  })

  it('guarda la sesión libre con el idioma elegido y sin cuestionario', async () => {
    let now = 0
    render(<PasteReadPage now={() => now} />)
    fireEvent.change(screen.getByLabelText(t('paste.textLabel')), {
      target: { value: 'word '.repeat(100) },
    })
    fireEvent.change(screen.getByLabelText(t('paste.langLabel')), { target: { value: 'en' } })
    fireEvent.change(screen.getByLabelText(t('paste.titleLabel')), { target: { value: 'Mi artículo' } })
    fireEvent.click(screen.getByRole('button', { name: t('paste.prepare') }))
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    now = 60000
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    expect(await screen.findByText('100 ppm')).toBeInTheDocument()
    await waitFor(async () => {
      const [row] = await listSessions()
      expect(row.session).toMatchObject({ kind: 'libre', lang: 'en', words: 100, wpm: 100, title: 'Mi artículo' })
      expect(row.quiz).toBeUndefined()
    })
  })
})
