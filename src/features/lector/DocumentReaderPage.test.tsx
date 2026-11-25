import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { listGlossary } from '../../lib/storage/glossary'
import { addDocument, getDocument, savePosition } from '../../lib/storage/library'
import { listNotes } from '../../lib/storage/notes'
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

async function setup(position = { chapter: 1, paragraph: 2 }) {
  const id = await addDocument({
    source: { type: 'libro', title: 'Libro de prueba' },
    doc: { format: 'epub', lang: 'es', title: 'Libro de prueba', chapters, words: 40 },
  })
  await savePosition(id, position)
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
})
