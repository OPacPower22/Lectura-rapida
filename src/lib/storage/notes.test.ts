import { db } from './db'
import { addNote, deleteNote, listNotes, updateNoteText } from './notes'

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
})
