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

/** Borra el documento, sus notas y su fuente. Las sesiones de lectura se conservan en el historial. */
export async function deleteDocument(id: number): Promise<void> {
  await db.transaction('rw', db.documents, db.notes, db.sources, async () => {
    const doc = await db.documents.get(id)
    if (!doc) return
    await db.notes.where('documentId').equals(id).delete()
    await db.documents.delete(id)
    const others = await db.documents.where('sourceId').equals(doc.sourceId).count()
    if (others === 0) await db.sources.delete(doc.sourceId)
  })
}
