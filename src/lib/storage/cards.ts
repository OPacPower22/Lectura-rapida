import type { Grade } from '../srs'
import { newCardState, review } from '../srs'
import { db, type StoredCard } from './db'

export async function addCard(c: { kind: 'ficha'; front: string; back: string; lang: string; sourceId?: number }): Promise<number> {
  const now = new Date()
  return (await db.cards.add({ ...c, fsrs: newCardState(now), createdAt: now.getTime() })) as number
}

export async function dueCards(now: Date, limit = 200): Promise<StoredCard[]> {
  return db.cards.where('fsrs.due').belowOrEqual(now).limit(limit).sortBy('fsrs.due')
}

export async function countDue(now: Date): Promise<number> {
  return db.cards.where('fsrs.due').belowOrEqual(now).count()
}

export async function nextDue(): Promise<Date | undefined> {
  return (await db.cards.orderBy('fsrs.due').first())?.fsrs.due
}

export async function gradeCard(id: number, grade: Grade, now: Date): Promise<void> {
  await db.transaction('rw', db.cards, async () => {
    const card = await db.cards.get(id)
    if (card) await db.cards.update(id, { fsrs: review(card.fsrs, grade, now) })
  })
}

export async function updateCard(id: number, patch: { front?: string; back?: string }): Promise<void> {
  await db.cards.update(id, patch)
}

export async function deleteCard(id: number): Promise<void> {
  await db.cards.delete(id)
}

export async function listCards(): Promise<StoredCard[]> {
  return db.cards.orderBy('fsrs.due').toArray()
}
