import { db, type GlossaryEntry } from './db'

export async function addGlossaryEntry(entry: Omit<GlossaryEntry, 'id' | 'createdAt'>): Promise<number> {
  return (await db.glossary.add({ ...entry, createdAt: Date.now() })) as number
}

export async function listGlossary(lang?: string): Promise<GlossaryEntry[]> {
  const entries = lang ? await db.glossary.where('lang').equals(lang).toArray() : await db.glossary.toArray()
  return entries.sort(
    (a, b) => a.lang.localeCompare(b.lang) || a.term.localeCompare(b.term, a.lang, { sensitivity: 'base' }),
  )
}

export async function updateGlossaryEntry(
  id: number,
  patch: Partial<Pick<GlossaryEntry, 'definition' | 'translation' | 'context'>>,
): Promise<void> {
  await db.glossary.update(id, patch)
}

export async function deleteGlossaryEntry(id: number): Promise<void> {
  await db.glossary.delete(id)
}
