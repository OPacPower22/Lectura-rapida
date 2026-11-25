import { getPracticeText } from '../content'
import { db } from './storage/db'
import { saveSession } from './storage/repo'
import { pendingRetention, retentionQuestions, saveRetention } from './retention'

const H = 3600000
const D = 24 * H
const t0 = Date.UTC(2026, 0, 1)

async function quizAt(at: number, textId = 'diag-expositivo') {
  return saveSession({
    session: { kind: 'diagnostico', textId, textKind: 'expositivo', lang: 'es', startedAt: at - 60000, endedAt: at, activeMs: 60000, words: 700, wpm: 700 },
    probes: [],
    quiz: { textId, answers: [0, 0, 0, 0, 0, 0, 0, 0, 0], correct: 7, total: 9, deferred: false, at },
  })
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('retención diferida', () => {
  it('se ofrece a las 24 h y a los 7 días, solo dentro de su ventana de 3 días', async () => {
    await quizAt(t0)
    expect(await pendingRetention(t0 + 23 * H)).toEqual([])
    expect((await pendingRetention(t0 + 25 * H)).map((p) => p.delayDays)).toEqual([1])
    expect(await pendingRetention(t0 + 5 * D)).toEqual([])
    expect((await pendingRetention(t0 + 7 * D + H)).map((p) => p.delayDays)).toEqual([7])
    expect(await pendingRetention(t0 + 11 * D)).toEqual([])
  })

  it('no se responde dos veces', async () => {
    const sessionId = await quizAt(t0)
    await saveRetention(sessionId, 'diag-expositivo', 1, [0, 0, 0, 0, 0])
    expect(await pendingRetention(t0 + 25 * H)).toEqual([])
    const all = await db.quizResults.toArray()
    expect(all.filter((q) => q.deferred)).toMatchObject([{ delayDays: 1, total: 5 }])
  })

  it('solo para diagnósticos y re-tests', async () => {
    await quizAt(t0, 'practica-1')
    expect(await pendingRetention(t0 + 25 * H)).toEqual([])
  })

  it('usa las 5 primeras preguntas por id', () => {
    const text = getPracticeText('diag-expositivo')!
    const ids = retentionQuestions(text).map((q) => q.id)
    expect(ids).toEqual([...text.questions].map((q) => q.id).sort().slice(0, 5))
  })

  it('guardar dos veces la misma retención solo registra una', async () => {
    const sessionId = await quizAt(t0)
    await Promise.all([saveRetention(sessionId, 'diag-expositivo', 1, [0, 0, 0, 0, 0]), saveRetention(sessionId, 'diag-expositivo', 1, [0, 0, 0, 0, 0])])
    expect((await db.quizResults.toArray()).filter((q) => q.deferred)).toHaveLength(1)
  })

  it('la comprensión inmediata se compara con las mismas 5 preguntas', async () => {
    const text = getPracticeText('diag-expositivo')!
    const retained = new Set(retentionQuestions(text).map((q) => q.id))
    // Respuestas: correctas solo en las preguntas que NO se repiten → inmediata sobre las 5 = 0 %
    const answers = text.questions.map((q) => (retained.has(q.id) ? (q.answerIndex + 1) % 4 : q.answerIndex))
    await saveSession({
      session: { kind: 'diagnostico', textId: 'diag-expositivo', textKind: 'expositivo', lang: 'es', startedAt: t0 - 60000, endedAt: t0, activeMs: 60000, words: 700, wpm: 700 },
      probes: [],
      quiz: { textId: 'diag-expositivo', answers, correct: answers.filter((a, i) => a === text.questions[i].answerIndex).length, total: text.questions.length, deferred: false, at: t0 },
    })
    const [pending] = await pendingRetention(t0 + 25 * H)
    expect(pending.immediate).toBe(0)
  })
})
