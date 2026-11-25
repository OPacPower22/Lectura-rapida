import { Dexie } from 'dexie'
import { db } from './db'

beforeEach(async () => {
  db.close()
  await Dexie.delete('lectura-rapida')
})

describe('migración v1 → v2', () => {
  it('conserva sesiones, sondeos y cuestionarios', async () => {
    const v1 = new Dexie('lectura-rapida')
    v1.version(1).stores({
      readingSessions: '++id, kind, textId, lang, startedAt',
      probes: '++id, sessionId',
      quizResults: '++id, sessionId, textId',
      settings: 'key',
    })
    await v1.open()
    const sessionId = await v1.table('readingSessions').add({
      kind: 'diagnostico', lang: 'es', startedAt: 1, endedAt: 2, activeMs: 60000, words: 200, wpm: 200,
    })
    await v1.table('probes').bulkAdd([
      { sessionId, at: 1, answer: 'texto' },
      { sessionId, at: 2, answer: 'otra-cosa' },
    ])
    await v1.table('quizResults').add({ sessionId, textId: 'x', answers: [], correct: 1, total: 2, deferred: false, at: 3 })
    v1.close()

    await db.open()
    expect(db.verno).toBe(2)
    expect(await db.readingSessions.count()).toBe(1)
    expect(await db.probes.count()).toBe(2)
    expect(await db.quizResults.count()).toBe(1)
  })
})
