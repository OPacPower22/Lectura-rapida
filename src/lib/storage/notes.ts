import { db, type Note } from './db'

export async function addNote(note: Omit<Note, 'id' | 'createdAt'>): Promise<number> {
  return (await db.notes.add({ ...note, createdAt: Date.now() })) as number
}

function readingOrder(a: Note, b: Note): number {
  if (a.anchor && b.anchor) {
    return (
      a.anchor.chapter - b.anchor.chapter ||
      a.anchor.paragraph - b.anchor.paragraph ||
      a.anchor.start - b.anchor.start ||
      a.createdAt - b.createdAt
    )
  }
  if (a.page !== undefined && b.page !== undefined) return a.page - b.page || a.createdAt - b.createdAt
  return a.createdAt - b.createdAt
}

export async function listNotes(filter: { documentId: number } | { sourceId: number }): Promise<Note[]> {
  const notes =
    'documentId' in filter
      ? await db.notes.where('documentId').equals(filter.documentId).toArray()
      : await db.notes.where('sourceId').equals(filter.sourceId).toArray()
  return notes.sort(readingOrder)
}

export async function updateNoteText(id: number, text: string): Promise<void> {
  await db.notes.update(id, { text })
}

export async function deleteNote(id: number): Promise<void> {
  await db.notes.delete(id)
}
