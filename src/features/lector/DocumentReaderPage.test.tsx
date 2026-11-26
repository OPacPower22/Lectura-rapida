import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { listGlossary } from '../../lib/storage/glossary'
import { listCards } from '../../lib/storage/cards'
import { addDocument, getDocument, savePosition } from '../../lib/storage/library'
import { saveSession } from '../../lib/storage/repo'
import { addNote, listNotes } from '../../lib/storage/notes'
import { listSessions } from '../../lib/storage/repo'
import { countWords } from '../../lib/text'
import { DocumentReaderPage } from './DocumentReaderPage'

const chapters = [
  { title: 'Uno', paragraphs: ['Primer capítulo.'] },
  {
    title: 'Dos',
    paragraphs: [
      'La sacada es un salto rápido del ojo. Ocurre varias veces por segundo.',
      'Párrafo uno del capítulo dos.',
      'Párrafo dos con algunas palabras más.',
      'Párrafo tres breve.',
      'Párrafo cuatro final del capítulo.',
    ],
  },
  { title: 'Tres', paragraphs: ['Último capítulo.'] },
]

let now = 0
const scrolled: Element[] = []

async function setup(position = { chapter: 1, paragraph: 2 }, before?: (id: number) => Promise<void>) {
  const id = await addDocument({
    source: { type: 'libro', title: 'Libro de prueba' },
    doc: { format: 'epub', lang: 'es', title: 'Libro de prueba', chapters, words: 40 },
  })
  await savePosition(id, position)
  await before?.(id)
  render(
    <MemoryRouter initialEntries={[`/biblioteca/${id}`]}>
      <Routes>
        <Route path="/biblioteca/:id" element={<DocumentReaderPage now={() => now} />} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { name: 'Dos' })
  return id
}

function select(paragraph: Element, text: string) {
  const node = paragraph.firstChild as Text
  const start = node.data.indexOf(text)
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, start + text.length)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
  fireEvent.mouseUp(paragraph)
}

beforeEach(async () => {
  now = 0
  scrolled.length = 0
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this)
  }
  await db.delete()
  await db.open()
})

describe('DocumentReaderPage', () => {
  it('abre en la posición guardada', async () => {
    await setup()
    const p2 = document.querySelector('[data-paragraph="2"]')!
    expect(p2.textContent).toContain('Párrafo dos')
    await waitFor(() => expect(scrolled).toContain(p2))
  })

  it('mide la sesión con las palabras del párrafo inicial al último confirmado', async () => {
    const id = await setup()
    fireEvent.click(screen.getByRole('button', { name: t('docreader.start') }))
    now = 60000
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    const confirm = screen.getByRole('region', { name: t('docreader.endTitle') })
    expect(within(confirm).getByText(/Párrafo dos con algunas/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('docreader.nextParagraph') }))
    fireEvent.click(screen.getByRole('button', { name: t('docreader.nextParagraph') }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('docreader.confirmEnd') }))
    })
    const expected = chapters[1].paragraphs.slice(2, 5).reduce((s, p) => s + countWords(p, 'es'), 0)
    await waitFor(async () => {
      const [row] = await listSessions()
      expect(row.session).toMatchObject({ kind: 'documento', documentId: id, words: expected, wpm: expected })
    })
    expect((await getDocument(id))?.doc.position).toEqual({ chapter: 1, paragraph: 4 })
  })

  it('subraya una selección y la guarda como nota', async () => {
    const id = await setup()
    select(document.querySelector('[data-paragraph="0"]')!, 'salto rápido del ojo')
    fireEvent.click(await screen.findByRole('button', { name: t('annot.highlight') }))
    await waitFor(async () => {
      const [note] = await listNotes({ documentId: id })
      expect(note).toMatchObject({ kind: 'subrayado', quote: 'salto rápido del ojo', anchor: { chapter: 1, paragraph: 0 } })
    })
    expect(await screen.findByText('salto rápido del ojo', { selector: 'mark' })).toBeInTheDocument()
  })

  it('añade una palabra al glosario con su oración de contexto', async () => {
    await setup()
    select(document.querySelector('[data-paragraph="0"]')!, 'sacada')
    fireEvent.click(await screen.findByRole('button', { name: t('annot.glossary') }))
    fireEvent.change(screen.getByLabelText(t('annot.definition')), { target: { value: 'movimiento rápido del ojo' } })
    fireEvent.click(screen.getByRole('button', { name: t('annot.save') }))
    await waitFor(async () => {
      const [entry] = await listGlossary('es')
      expect(entry).toMatchObject({ term: 'sacada', definition: 'movimiento rápido del ojo', context: 'La sacada es un salto rápido del ojo.' })
    })
  })

  it('avisa si la selección cruza párrafos', async () => {
    await setup()
    const a = document.querySelector('[data-paragraph="0"]')!.firstChild!
    const b = document.querySelector('[data-paragraph="1"]')!.firstChild!
    const range = document.createRange()
    range.setStart(a, 3)
    range.setEnd(b, 3)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)
    fireEvent.mouseUp(document.querySelector('[data-paragraph="1"]')!)
    expect(await screen.findByText(t('annot.crossParagraph'))).toBeInTheDocument()
  })

  it('no sobrescribe la posición si se sale antes de que cargue el documento', async () => {
    const id = await addDocument({
      source: { type: 'libro', title: 'Libro' },
      doc: { format: 'epub', lang: 'es', title: 'Libro', chapters, words: 40 },
    })
    await savePosition(id, { chapter: 1, paragraph: 3 })
    const { unmount } = render(
      <MemoryRouter initialEntries={[`/biblioteca/${id}`]}>
        <Routes>
          <Route path="/biblioteca/:id" element={<DocumentReaderPage now={() => now} />} />
        </Routes>
      </MemoryRouter>,
    )
    unmount()
    await new Promise((r) => setTimeout(r, 50))
    expect((await getDocument(id))?.doc.position).toEqual({ chapter: 1, paragraph: 3 })
  })

  it('guarda el primer párrafo visible al ocultar la página', async () => {
    const id = await setup({ chapter: 1, paragraph: 0 })
    await act(async () => {}) // efectos pendientes registrados antes de ocultar
    const original = Element.prototype.getBoundingClientRect
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const index = (this as HTMLElement).dataset?.paragraph
      const top = index === undefined ? 0 : Number(index) * 100 - 250
      return { top, bottom: top + 90, left: 0, right: 0, width: 0, height: 90, x: 0, y: top, toJSON() {} } as DOMRect
    }
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    Element.prototype.getBoundingClientRect = original
    await waitFor(async () => expect((await getDocument(id))?.doc.position).toEqual({ chapter: 1, paragraph: 3 }), { timeout: 3000 })
  })

  it('durante una sesión, «Ir al texto» no cambia de capítulo', async () => {
    await setup(undefined, async (id) => {
      const { doc } = (await getDocument(id))!
      await addNote({ sourceId: doc.sourceId, documentId: id, anchor: { chapter: 0, paragraph: 0, start: 0, end: 7 }, kind: 'idea', text: 'otra', lang: 'es' })
    })
    fireEvent.click(screen.getByRole('button', { name: t('docreader.start') }))
    await screen.findByText('otra')
    for (const button of screen.queryAllByRole('button', { name: t('notes.goTo') })) fireEvent.click(button)
    expect(screen.getByRole('heading', { name: 'Dos' })).toBeInTheDocument()
  })

  it('crea una ficha desde una selección con la cita como respuesta', async () => {
    await setup()
    select(document.querySelector('[data-paragraph="0"]')!, 'salto rápido del ojo')
    fireEvent.click(await screen.findByRole('button', { name: t('annot.card') }))
    fireEvent.change(screen.getByLabelText(t('cards.front')), { target: { value: '¿Qué es una sacada?' } })
    fireEvent.click(screen.getByRole('button', { name: t('annot.save') }))
    await waitFor(async () => {
      const [card] = await listCards()
      expect(card).toMatchObject({ kind: 'ficha', front: '¿Qué es una sacada?', back: 'salto rápido del ojo' })
    })
  })

  it('al hacer clic en el texto sin seleccionar, se cierra la barra de anotación', async () => {
    await setup()
    const p0 = document.querySelector('[data-paragraph="0"]')!
    select(p0, 'salto rápido')
    expect(await screen.findByRole('region', { name: t('annot.region') })).toBeInTheDocument()
    const range = document.createRange()
    range.setStart(p0.firstChild!, 2)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)
    fireEvent.mouseUp(p0)
    await waitFor(() => expect(screen.queryByRole('region', { name: t('annot.region') })).not.toBeInTheDocument())
  })

  it('sugiere la velocidad del marcapasos según tus lecturas con buena comprensión', async () => {
    for (const [i, at] of [1000, 2000].entries()) {
      await saveSession({
        session: { kind: 'practica', textId: `p-${i}`, textKind: 'expositivo', lang: 'es', startedAt: at, endedAt: at, activeMs: 60000, words: 300, wpm: 300 },
        probes: [],
        quiz: { textId: `p-${i}`, answers: [], correct: 5, total: 5, deferred: false, at },
      })
    }
    await setup()
    fireEvent.click(screen.getByRole('button', { name: t('docreader.start') }))
    fireEvent.click(await screen.findByRole('checkbox', { name: t('pacer.enable') }))
    expect(await screen.findByDisplayValue('320')).toBeInTheDocument()
  })
})
