import { db, type AttentionSession } from './db'

export async function saveAttentionSession(session: Omit<AttentionSession, 'id'>): Promise<number> {
  return (await db.attentionSessions.add(session)) as number
}

export async function listAttentionSessions(): Promise<AttentionSession[]> {
  return db.attentionSessions.orderBy('startedAt').reverse().toArray()
}
