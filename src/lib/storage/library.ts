import { db, type DocPosition, type Source, type StoredDocument } from './db'

export async function addSource(source: Omit<Source, 'id' | 'createdAt'>): Promise<number> {
  return (await db.sources.add({ ...source, createdAt: Date.now() })) as number
}

export async function addDocument(input: {
  source: Omit<Source, 'id' | 'createdAt'>
  doc: Omit<StoredDocument, 'id' | 'sourceId' | 'createdAt' | 'lastOpenedAt' | 'position'>
}): Promise<number> {
  return db.transaction('rw', db.sources, db.documents, async () => {
    const sourceId = await addSource(input.source)
    const now = Date.now()
    return (await db.documents.add({
      ...input.doc,
      sourceId,
      position: { chapter: 0, paragraph: 0 },
      createdAt: now,
      lastOpenedAt: now,
    })) as number
  })
}

export async function listDocuments(): Promise<{ doc: StoredDocument; source: Source }[]> {
  const docs = await db.documents.orderBy('lastOpenedAt').reverse().toArray()
  const sources = await db.sources.bulkGet(docs.map((d) => d.sourceId))
  return docs.map((doc, i) => ({ doc, source: sources[i]! }))
}

export async function getDocument(id: number): Promise<{ doc: StoredDocument; source: Source } | undefined> {
  const doc = await db.documents.get(id)
  if (!doc) return undefined
  const source = await db.sources.get(doc.sourceId)
  return source ? { doc, source } : undefined
}

export async function savePosition(id: number, position: DocPosition): Promise<void> {
  await db.documents.update(id, { position, lastOpenedAt: Date.now() })
}

/**
 * Borra el documento, sus notas y su fuente. Las notas que usa algún proyecto de escritura se conservan
 * (sin enlace al texto) junto con su fuente, para que el proyecto siga citándolas. Las sesiones de
 * lectura se conservan en el historial.
 */
export async function deleteDocument(id: number): Promise<void> {
  await db.transaction('rw', [db.documents, db.notes, db.sources, db.projects], async () => {
    const doc = await db.documents.get(id)
    if (!doc) return
    const inProjects = new Set(
      (await db.projects.toArray()).flatMap((p) => p.sections.flatMap((s) => s.items.flatMap((i) => (i.type === 'note' ? [i.noteId] : [])))),
    )
    const notes = await db.notes.where('documentId').equals(id).toArray()
    const keep = notes.filter((n) => inProjects.has(n.id!))
    await db.notes.bulkDelete(notes.filter((n) => !inProjects.has(n.id!)).map((n) => n.id!))
    for (const n of keep) {
      const { documentId: _doc, anchor: _anchor, ...rest } = n
      await db.notes.put(rest)
    }
    await db.documents.delete(id)
    const others = await db.documents.where('sourceId').equals(doc.sourceId).count()
    if (others === 0 && keep.length === 0) await db.sources.delete(doc.sourceId)
  })
}

/** Libros físicos: fuentes de tipo libro sin documento digital asociado. */
export async function listPhysicalBooks(): Promise<Source[]> {
  const books = await db.sources.where('type').equals('libro').toArray()
  const withDocs = new Set((await db.documents.toArray()).map((d) => d.sourceId))
  return books.filter((b) => !withDocs.has(b.id!)).sort((a, b) => b.createdAt - a.createdAt)
}

export async function listSources(): Promise<Source[]> {
  return (await db.sources.toArray()).sort((a, b) => b.createdAt - a.createdAt)
}

export async function updateSource(id: number, patch: Partial<Omit<Source, 'id' | 'createdAt'>>): Promise<void> {
  await db.sources.update(id, patch)
}
