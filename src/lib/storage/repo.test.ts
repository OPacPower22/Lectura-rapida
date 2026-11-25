import { db, type QuizResult, type ReadingSession } from './db'
import { listSessions, saveSession } from './repo'

const baseSession: Omit<ReadingSession, 'id'> = {
  kind: 'diagnostico',
  textId: 'diag-expositivo',
  textKind: 'expositivo',
  lang: 'es',
  startedAt: 1000,
  endedAt: 200000,
  activeMs: 180000,
  words: 600,
  wpm: 200,
}

const quiz: Omit<QuizResult, 'id' | 'sessionId'> = {
  textId: 'diag-expositivo',
  answers: [0, 1, 2, 3],
  correct: 3,
  total: 4,
  deferred: false,
  at: 200001,
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('saveSession / listSessions', () => {
  it('guarda sesión, sondeos y cuestionario juntos', async () => {
    const id = await saveSession({ session: baseSession, probes: [{ at: 1, answer: 'texto' }], quiz })
    const [row] = await listSessions()
    expect(row.session.id).toBe(id)
    expect(row.probes).toHaveLength(1)
    expect(row.probes[0].sessionId).toBe(id)
    expect(row.quiz?.correct).toBe(3)
  })

  it('lista de la más reciente a la más antigua', async () => {
    await saveSession({ session: baseSession, probes: [] })
    await saveSession({ session: { ...baseSession, startedAt: 5000 }, probes: [] })
    const rows = await listSessions()
    expect(rows.map((r) => r.session.startedAt)).toEqual([5000, 1000])
  })

  it('una sesión libre no tiene cuestionario', async () => {
    await saveSession({ session: { ...baseSession, kind: 'libre', textId: undefined }, probes: [] })
    const [row] = await listSessions()
    expect(row.quiz).toBeUndefined()
  })
})
