import { db } from './db'
import { addNote, deleteNote, listAllNotes, listNotes, listTags, updateNote, updateNoteText } from './notes'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('notas', () => {
  it('ordena por posición de lectura', async () => {
    const base = { sourceId: 1, documentId: 1, kind: 'subrayado' as const, text: '', lang: 'es' }
    await addNote({ ...base, anchor: { chapter: 1, paragraph: 0, start: 0, end: 3 } })
    await addNote({ ...base, anchor: { chapter: 0, paragraph: 2, start: 5, end: 9 } })
    await addNote({ ...base, anchor: { chapter: 0, paragraph: 2, start: 1, end: 3 } })
    const notes = await listNotes({ documentId: 1 })
    expect(notes.map((n) => [n.anchor!.chapter, n.anchor!.paragraph, n.anchor!.start])).toEqual([
      [0, 2, 1],
      [0, 2, 5],
      [1, 0, 0],
    ])
  })

  it('ordena por página las notas de libro físico', async () => {
    await addNote({ sourceId: 7, page: 30, kind: 'idea', text: 'b', lang: 'es' })
    await addNote({ sourceId: 7, page: 12, kind: 'cita', text: 'a', lang: 'es' })
    expect((await listNotes({ sourceId: 7 })).map((n) => n.page)).toEqual([12, 30])
  })

  it('edita y borra', async () => {
    const id = await addNote({ sourceId: 1, kind: 'idea', text: 'antes', lang: 'es' })
    await updateNoteText(id, 'después')
    expect((await listNotes({ sourceId: 1 }))[0].text).toBe('después')
    await deleteNote(id)
    expect(await listNotes({ sourceId: 1 })).toEqual([])
  })

  it('lista todas, filtra por etiqueta, fuente y tipo, y busca sin acentos', async () => {
    const a = await addNote({ sourceId: 1, kind: 'idea', text: 'La Atención sostenida', lang: 'es' })
    await addNote({ sourceId: 2, kind: 'cita', quote: 'Lectura atenta', text: '', lang: 'es', tags: ['tesis'] })
    await addNote({ sourceId: 2, kind: 'idea', text: 'Otra cosa', lang: 'es', tags: ['tesis', 'Método'] })
    expect((await listAllNotes({ query: 'atencion' })).map((n) => n.id)).toEqual([a])
    expect((await listAllNotes({ query: 'ATENTA' })).length).toBe(1)
    expect((await listAllNotes({ tag: 'tesis' })).length).toBe(2)
    expect((await listAllNotes({ sourceId: 2, kind: 'idea' })).map((n) => n.text)).toEqual(['Otra cosa'])
    expect(await listTags()).toEqual(['Método', 'tesis'])
  })

  it('ordena todas las notas de la más reciente a la más antigua', async () => {
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    await addNote({ sourceId: 1, kind: 'idea', text: 'primera', lang: 'es' })
    now.mockReturnValue(2000)
    await addNote({ sourceId: 1, kind: 'idea', text: 'segunda', lang: 'es' })
    now.mockRestore()
    expect((await listAllNotes()).map((n) => n.text)).toEqual(['segunda', 'primera'])
  })

  it('updateNote cambia texto, tipo, etiquetas y página', async () => {
    const id = await addNote({ sourceId: 1, kind: 'idea', text: 'x', lang: 'es' })
    await updateNote(id, { text: 'y', kind: 'parafrasis', tags: ['a'], page: 4 })
    expect((await listAllNotes())[0]).toMatchObject({ text: 'y', kind: 'parafrasis', tags: ['a'], page: 4 })
  })
})
