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
    expect(db.verno).toBe(3)
    expect(await db.readingSessions.count()).toBe(1)
    expect(await db.probes.count()).toBe(2)
    expect(await db.quizResults.count()).toBe(1)
  })

  it('v2 → v3 conserva documentos, notas y glosario', async () => {
    const v2 = new Dexie('lectura-rapida')
    v2.version(1).stores({
      readingSessions: '++id, kind, textId, lang, startedAt',
      probes: '++id, sessionId',
      quizResults: '++id, sessionId, textId',
      settings: 'key',
    })
    v2.version(2).stores({
      readingSessions: '++id, kind, textId, lang, startedAt, documentId, sourceId',
      sources: '++id, type, createdAt',
      documents: '++id, sourceId, lastOpenedAt',
      notes: '++id, sourceId, documentId, kind, createdAt',
      glossary: '++id, lang, term, sourceId',
    })
    await v2.open()
    await v2.table('sources').add({ type: 'libro', title: 'L', createdAt: 1 })
    await v2.table('notes').add({ sourceId: 1, kind: 'idea', text: 'x', lang: 'es', createdAt: 1 })
    await v2.table('glossary').add({ term: 't', lang: 'es', definition: 'd', createdAt: 1 })
    v2.close()
    await db.open()
    expect(db.verno).toBe(3)
    expect(await db.sources.count()).toBe(1)
    expect(await db.notes.count()).toBe(1)
    expect(await db.glossary.count()).toBe(1)
    const cards = await db.cards.toArray()
    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({ kind: 'glosario', front: 't', glossaryId: 1 })
  })
})
