import { Dexie, type EntityTable } from 'dexie'
import type { ProbeAnswer } from '../metrics'

export type TextKind = 'narrativo' | 'expositivo' | 'denso'

export interface ReadingSession {
  id?: number
  kind: 'diagnostico' | 'libre'
  textId?: string
  textKind?: TextKind
  lang: string
  startedAt: number
  endedAt: number
  activeMs: number
  words: number
  wpm: number | null
}

export interface ProbeRecord {
  id?: number
  sessionId: number
  at: number
  answer: ProbeAnswer
}

export interface QuizResult {
  id?: number
  sessionId: number
  textId: string
  answers: number[]
  correct: number
  total: number
  deferred: boolean
  at: number
}

export interface Setting {
  key: string
  value: unknown
}

export const db = new Dexie('lectura-rapida') as Dexie & {
  readingSessions: EntityTable<ReadingSession, 'id'>
  probes: EntityTable<ProbeRecord, 'id'>
  quizResults: EntityTable<QuizResult, 'id'>
  settings: EntityTable<Setting, 'key'>
}

db.version(1).stores({
  readingSessions: '++id, kind, textId, lang, startedAt',
  probes: '++id, sessionId',
  quizResults: '++id, sessionId, textId',
  settings: 'key',
})
