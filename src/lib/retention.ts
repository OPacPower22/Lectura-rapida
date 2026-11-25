import { getPracticeText } from '../content'
import type { PracticeText, Question } from '../content/types'
import { db } from './storage/db'

export const RETENTION_DELAYS = [1, 7] as const
export const RETENTION_WINDOW_DAYS = 3
export const RETENTION_QUESTIONS = 5
const DAY = 24 * 3600000

export interface PendingRetention {
  sessionId: number
  textId: string
  delayDays: 1 | 7
  dueAt: number
  immediate: number
}

/** Cuestionarios de retención disponibles ahora (diagnóstico y re-tests, a 1 y 7 días). */
export async function pendingRetention(now: number): Promise<PendingRetention[]> {
  const results = await db.quizResults.toArray()
  const done = new Set(results.filter((r) => r.deferred).map((r) => `${r.sessionId}:${r.delayDays}`))
  const pending: PendingRetention[] = []
  for (const r of results) {
    if (r.deferred) continue
    const role = getPracticeText(r.textId)?.role
    if (role !== 'diagnostico' && role !== 'retest') continue
    for (const delayDays of RETENTION_DELAYS) {
      const dueAt = r.at + delayDays * DAY
      if (now < dueAt || now >= dueAt + RETENTION_WINDOW_DAYS * DAY) continue
      if (done.has(`${r.sessionId}:${delayDays}`)) continue
      pending.push({ sessionId: r.sessionId, textId: r.textId, delayDays, dueAt, immediate: immediateOnRetained(r.textId, r.answers, r.total ? r.correct / r.total : 0) })
    }
  }
  return pending.sort((a, b) => a.dueAt - b.dueAt)
}

/** Comprensión inmediata calculada sobre las mismas 5 preguntas que se repiten (comparación justa). */
function immediateOnRetained(textId: string, answers: number[], fallback: number): number {
  const text = getPracticeText(textId)
  if (!text || answers.length !== text.questions.length) return fallback
  const retained = retentionQuestions(text)
  const correct = retained.filter((q) => answers[text.questions.indexOf(q)] === q.answerIndex).length
  return retained.length ? correct / retained.length : fallback
}

/** Las 5 primeras preguntas por id (las mismas en cada comprobación). */
export function retentionQuestions(text: PracticeText): Question[] {
  return [...text.questions].sort((a, b) => a.id.localeCompare(b.id)).slice(0, RETENTION_QUESTIONS)
}

/** Guarda la retención una sola vez por (sesión, plazo); si ya existe, devuelve la registrada. */
export async function saveRetention(sessionId: number, textId: string, delayDays: 1 | 7, answers: number[]): Promise<number> {
  const text = getPracticeText(textId)
  const questions = text ? retentionQuestions(text) : []
  const correct = answers.filter((a, i) => questions[i] && a === questions[i].answerIndex).length
  return db.transaction('rw', db.quizResults, async () => {
    const existing = await db.quizResults
      .where('sessionId')
      .equals(sessionId)
      .filter((q) => q.deferred && q.delayDays === delayDays)
      .first()
    if (existing) return existing.total ? existing.correct / existing.total : 0
    await db.quizResults.add({ sessionId, textId, answers, correct, total: questions.length, deferred: true, delayDays, at: Date.now() })
    return questions.length ? correct / questions.length : 0
  })
}
