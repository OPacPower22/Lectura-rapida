import { db } from './db'
import { listAttentionSessions, saveAttentionSession } from './attention'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('sesiones de atención', () => {
  it('lista de la más reciente a la más antigua', async () => {
    await saveAttentionSession({ startedAt: 1, durationMs: 120000, plannedMinutes: 2, returns: 3 })
    await saveAttentionSession({ startedAt: 5, durationMs: 300000, plannedMinutes: 5, returns: 1 })
    expect((await listAttentionSessions()).map((s) => s.startedAt)).toEqual([5, 1])
  })
})
