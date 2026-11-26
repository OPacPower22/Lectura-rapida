import { db } from './db'
import { addDocument, addSource, deleteDocument, getDocument, listDocuments, listSources, savePosition, updateSource } from './library'
import { addNote, listNotes } from './notes'

const doc = {
  format: 'texto' as const,
  lang: 'es',
  title: 'Documento',
  chapters: [{ title: '', paragraphs: ['uno dos', 'tres'] }],
  words: 3,
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('biblioteca', () => {
  it('crea documento y fuente con posición inicial', async () => {
    const id = await addDocument({ source: { type: 'documento', title: 'Documento' }, doc })
    const found = await getDocument(id)
    expect(found?.doc.position).toEqual({ chapter: 0, paragraph: 0 })
    expect(found?.source.title).toBe('Documento')
  })

  it('savePosition actualiza posición y lo marca como el más reciente', async () => {
    const a = await addDocument({ source: { type: 'documento', title: 'A' }, doc })
    const b = await addDocument({ source: { type: 'documento', title: 'B' }, doc })
    await new Promise((r) => setTimeout(r, 5))
    await savePosition(a, { chapter: 0, paragraph: 1 })
    const list = await listDocuments()
    expect(list.map((d) => d.doc.id)).toEqual([a, b])
    expect(list[0].doc.position).toEqual({ chapter: 0, paragraph: 1 })
  })

  it('deleteDocument borra documento, notas y fuente, pero no las sesiones', async () => {
    const id = await addDocument({ source: { type: 'documento', title: 'A' }, doc })
    const { doc: stored } = (await getDocument(id))!
    await addNote({ sourceId: stored.sourceId, documentId: id, kind: 'idea', text: 'x', lang: 'es' })
    await db.readingSessions.add({
      kind: 'documento', documentId: id, lang: 'es', startedAt: 1, endedAt: 2, activeMs: 6000, words: 3, wpm: 30,
    })
    await deleteDocument(id)
    expect(await getDocument(id)).toBeUndefined()
    expect(await db.notes.count()).toBe(0)
    expect(await db.sources.count()).toBe(0)
    expect(await db.readingSessions.count()).toBe(1)
  })

  it('addSource crea fuentes sin documento (libros físicos)', async () => {
    const id = await addSource({ type: 'libro', title: 'Físico', author: 'A' })
    expect((await db.sources.get(id))?.type).toBe('libro')
    expect(await listNotes({ sourceId: id })).toEqual([])
  })

  it('lista fuentes y updateSource persiste el año', async () => {
    const id = await addSource({ type: 'libro', title: 'Libro' })
    await updateSource(id, { year: '2020', author: 'Pérez, A.' })
    expect((await listSources())[0]).toMatchObject({ title: 'Libro', year: '2020', author: 'Pérez, A.' })
  })
})
