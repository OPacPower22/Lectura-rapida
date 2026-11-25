import { db, type ProbeRecord, type QuizResult, type ReadingSession } from './db'

export interface SessionSummary {
  session: ReadingSession
  quiz?: QuizResult
  probes: ProbeRecord[]
}

export async function saveSession(input: {
  session: Omit<ReadingSession, 'id'>
  probes: Omit<ProbeRecord, 'id' | 'sessionId'>[]
  quiz?: Omit<QuizResult, 'id' | 'sessionId'>
}): Promise<number> {
  return db.transaction('rw', db.readingSessions, db.probes, db.quizResults, async () => {
    const sessionId = (await db.readingSessions.add({ ...input.session })) as number
    await db.probes.bulkAdd(input.probes.map((p) => ({ ...p, sessionId })))
    if (input.quiz) await db.quizResults.add({ ...input.quiz, sessionId })
    return sessionId
  })
}

export async function listSessions(): Promise<SessionSummary[]> {
  const sessions = await db.readingSessions.orderBy('startedAt').reverse().toArray()
  const ids = sessions.map((s) => s.id!)
  const [probes, quizzes] = await Promise.all([
    db.probes.where('sessionId').anyOf(ids).toArray(),
    db.quizResults.where('sessionId').anyOf(ids).toArray(),
  ])
  return sessions.map((session) => ({
    session,
    probes: probes.filter((p) => p.sessionId === session.id),
    quiz: quizzes.find((q) => q.sessionId === session.id && !q.deferred),
  }))
}

export async function updateSessionRecall(sessionId: number, recall: string): Promise<void> {
  await db.readingSessions.update(sessionId, { recall })
}
