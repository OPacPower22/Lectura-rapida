import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { addSource } from '../../lib/storage/library'
import { listNotes } from '../../lib/storage/notes'
import { listSessions } from '../../lib/storage/repo'
import { PhysicalSessionPage } from './PhysicalSessionPage'

let now = 0

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/biblioteca/fisico']}>
      <Routes>
        <Route path="/biblioteca/fisico" element={<PhysicalSessionPage now={() => now} />} />
      </Routes>
    </MemoryRouter>,
  )
}

const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

async function startNewBook(lang?: string) {
  renderPage()
  fireEvent.click(await screen.findByRole('radio', { name: t('physical.newBook') }))
  change(t('physical.bookTitle'), 'Libro de papel')
  change(t('physical.bookAuthor'), 'Autor Clásico')
  fireEvent.click(screen.getByRole('button', { name: t('diag.continue') }))
  fireEvent.change(await screen.findByLabelText(t('physical.startPage')), { target: { value: '10' } })
  if (lang) change(t('physical.bookLang'), lang)
  fireEvent.click(await screen.findByRole('button', { name: t('diag.continue') }))
  for (const n of [1, 2, 3]) change(t('physical.wordsInLine', { n }), '10')
  change(t('physical.linesPerPage'), '30')
  expect(screen.getByText(t('physical.wppResult', { wpp: 300 }))).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: t('diag.continue') }))
  fireEvent.click(await screen.findByRole('button', { name: t('reader.start') }))
}

beforeEach(async () => {
  now = 0
  await db.delete()
  await db.open()
})

describe('PhysicalSessionPage', () => {
  it('mide una sesión de libro físico con páginas y palabras estimadas', async () => {
    await startNewBook()
    now = 600000
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    change(t('physical.endPage'), '19')
    change(t('physical.recall'), 'Ideas que recuerdo.')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('physical.save') }))
    })
    expect(await screen.findByText('300 ppm')).toBeInTheDocument()
    const [row] = await listSessions()
    expect(row.session).toMatchObject({
      kind: 'fisico',
      title: 'Libro de papel',
      pages: { from: 10, to: 19 },
      words: 3000,
      wpm: 300,
      recall: 'Ideas que recuerdo.',
    })
  })

  it('guarda notas rápidas con su página', async () => {
    await startNewBook()
    fireEvent.click(screen.getByRole('button', { name: t('physical.quickNote') }))
    change(t('annot.text'), 'Idea importante')
    change(t('physical.notePage'), '12')
    fireEvent.click(screen.getByRole('button', { name: t('annot.save') }))
    await waitFor(async () => {
      const source = (await db.sources.toArray())[0]
      expect(await listNotes({ sourceId: source.id! })).toMatchObject([{ page: 12, text: 'Idea importante', kind: 'idea' }])
    })
  })

  it('no guarda si la página final es menor que la inicial', async () => {
    await startNewBook()
    now = 600000
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    change(t('physical.endPage'), '9')
    fireEvent.click(screen.getByRole('button', { name: t('physical.save') }))
    expect(await screen.findByText(t('physical.endBeforeStart'))).toBeInTheDocument()
    expect(await listSessions()).toEqual([])
  })

  it('reutiliza un libro existente y su estimación de palabras por página', async () => {
    const id = await addSource({ type: 'libro', title: 'Libro guardado' })
    await db.settings.put({ key: `wpp:${id}`, value: 250 })
    renderPage()
    fireEvent.click(await screen.findByRole('radio', { name: 'Libro guardado' }))
    fireEvent.click(screen.getByRole('button', { name: t('diag.continue') }))
    fireEvent.change(await screen.findByLabelText(t('physical.startPage')), { target: { value: '1' } })
    fireEvent.click(await screen.findByRole('button', { name: t('diag.continue') }))
    expect(screen.getByRole('button', { name: t('reader.start') })).toBeInTheDocument()
  })

  it('sigue contando con la pantalla bloqueada (el teléfono queda a un lado)', async () => {
    await startNewBook()
    now = 30000
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    now = 600000
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    change(t('physical.endPage'), '19')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('physical.save') }))
    })
    const [row] = await listSessions()
    expect(row.session).toMatchObject({ activeMs: 600000, wpm: 300 })
  })

  it('registra el idioma del libro en la sesión y en las notas', async () => {
    await startNewBook('en')
    fireEvent.click(screen.getByRole('button', { name: t('physical.quickNote') }))
    change(t('annot.text'), 'Key idea')
    fireEvent.click(screen.getByRole('button', { name: t('annot.save') }))
    now = 600000
    await waitFor(async () => expect(await db.notes.count()).toBe(1))
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    change(t('physical.endPage'), '19')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('physical.save') }))
    })
    const [row] = await listSessions()
    expect(row.session.lang).toBe('en')
    expect((await db.notes.toArray())[0].lang).toBe('en')
  })

  it('pide revisar una sesión poco creíble y permite guardarla igual', async () => {
    await startNewBook()
    now = 600000
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    change(t('physical.endPage'), '190')
    fireEvent.click(screen.getByRole('button', { name: t('physical.save') }))
    expect(await screen.findByText(t('physical.implausible', { pages: 181, wpm: 5430 }))).toBeInTheDocument()
    expect(await listSessions()).toEqual([])
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('physical.saveAnyway') }))
    })
    expect((await listSessions())[0].session.pages).toEqual({ from: 10, to: 190 })
  })

  it('permite volver a estimar las palabras por página de un libro', async () => {
    const id = await addSource({ type: 'libro', title: 'Libro guardado' })
    await db.settings.put({ key: `wpp:${id}`, value: 250 })
    renderPage()
    fireEvent.click(await screen.findByRole('radio', { name: 'Libro guardado' }))
    fireEvent.click(screen.getByRole('button', { name: t('diag.continue') }))
    fireEvent.change(await screen.findByLabelText(t('physical.startPage')), { target: { value: '1' } })
    fireEvent.click(await screen.findByRole('button', { name: t('diag.continue') }))
    fireEvent.click(screen.getByRole('button', { name: t('physical.reestimate') }))
    expect(screen.getByLabelText(t('physical.linesPerPage'))).toBeInTheDocument()
  })
})
