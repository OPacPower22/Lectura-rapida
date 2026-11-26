import { db, type Note, type NoteKind } from './db'

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

/** Minúsculas y sin diacríticos, para buscar sin distinguir acentos. */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()
}

export interface NoteFilter {
  sourceId?: number
  kind?: NoteKind
  tag?: string
  query?: string
}

/** Todas las notas, de la más reciente a la más antigua, con filtros opcionales. */
export async function listAllNotes(filter: NoteFilter = {}): Promise<Note[]> {
  const all = filter.tag
    ? await db.notes.where('tags').equals(filter.tag).toArray()
    : await db.notes.toArray()
  const q = filter.query?.trim() ? fold(filter.query.trim()) : ''
  return all
    .filter((n) => filter.sourceId === undefined || n.sourceId === filter.sourceId)
    .filter((n) => filter.kind === undefined || n.kind === filter.kind)
    .filter((n) => !q || fold(`${n.quote ?? ''} ${n.text}`).includes(q))
    .sort((a, b) => b.createdAt - a.createdAt || (b.id ?? 0) - (a.id ?? 0))
}

export async function updateNote(
  id: number,
  patch: Partial<Pick<Note, 'text' | 'kind' | 'tags' | 'page'>>,
): Promise<void> {
  await db.notes.update(id, patch)
}

export async function listTags(): Promise<string[]> {
  const tags = (await db.notes.orderBy('tags').uniqueKeys()) as string[]
  return tags.sort((a, b) => a.localeCompare(b, 'es'))
}
