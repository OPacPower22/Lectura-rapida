import { newCardState } from '../srs'
import { db, type GlossaryEntry } from './db'

/** Reverso de la ficha de una entrada de glosario. */
function cardBack(e: Pick<GlossaryEntry, 'definition' | 'translation' | 'context'>): string {
  return [e.definition, e.translation && `(${e.translation})`, e.context && `«${e.context}»`].filter(Boolean).join('\n')
}

export async function addGlossaryEntry(entry: Omit<GlossaryEntry, 'id' | 'createdAt'>): Promise<number> {
  return db.transaction('rw', db.glossary, db.cards, async () => {
    const now = new Date()
    const id = (await db.glossary.add({ ...entry, createdAt: now.getTime() })) as number
    await db.cards.add({
      kind: 'glosario',
      glossaryId: id,
      front: entry.term,
      back: cardBack(entry),
      lang: entry.lang,
      sourceId: entry.sourceId,
      fsrs: newCardState(now),
      createdAt: now.getTime(),
    })
    return id
  })
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
  await db.transaction('rw', db.glossary, db.cards, async () => {
    await db.glossary.update(id, patch)
    const entry = await db.glossary.get(id)
    if (entry) await db.cards.where('glossaryId').equals(id).modify({ back: cardBack(entry) })
  })
}

export async function deleteGlossaryEntry(id: number): Promise<void> {
  await db.transaction('rw', db.glossary, db.cards, async () => {
    await db.cards.where('glossaryId').equals(id).delete()
    await db.glossary.delete(id)
  })
}
