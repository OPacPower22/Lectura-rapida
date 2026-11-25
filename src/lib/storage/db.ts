import { Dexie, type EntityTable } from 'dexie'
import type { Card } from 'ts-fsrs'
import type { ProbeAnswer } from '../metrics'

export type TextKind = 'narrativo' | 'expositivo' | 'denso'

export interface ReadingSession {
  id?: number
  kind: 'diagnostico' | 'libre' | 'documento' | 'fisico'
  textId?: string
  title?: string
  purpose?: string
  recall?: string
  documentId?: number
  sourceId?: number
  pages?: { from: number; to: number }
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
  /** Solo en resultados diferidos: días tras el cuestionario original. */
  delayDays?: 1 | 7
  at: number
}

export interface Setting {
  key: string
  value: unknown
}

export type SourceType = 'libro' | 'articulo' | 'web' | 'documento'

export interface Source {
  id?: number
  type: SourceType
  title: string
  author?: string
  year?: string
  publisher?: string
  url?: string
  createdAt: number
}

export type DocumentFormat = 'pdf' | 'epub' | 'web' | 'texto'

export interface Chapter {
  title: string
  paragraphs: string[]
  /** Página de cada párrafo (solo PDF). */
  pages?: number[]
}

export interface DocPosition {
  chapter: number
  paragraph: number
}

export interface StoredDocument {
  id?: number
  sourceId: number
  format: DocumentFormat
  lang: string
  title: string
  chapters: Chapter[]
  words: number
  file?: Blob
  position: DocPosition
  createdAt: number
  lastOpenedAt: number
}

export interface TextAnchor {
  chapter: number
  paragraph: number
  start: number
  end: number
}

export type NoteKind = 'subrayado' | 'cita' | 'parafrasis' | 'idea'

export interface Note {
  id?: number
  sourceId: number
  documentId?: number
  anchor?: TextAnchor
  page?: number
  kind: NoteKind
  quote?: string
  text: string
  lang: string
  createdAt: number
}

export interface GlossaryEntry {
  id?: number
  term: string
  lang: string
  definition: string
  translation?: string
  context?: string
  sourceId?: number
  createdAt: number
}

export interface StoredCard {
  id?: number
  kind: 'ficha' | 'glosario'
  front: string
  back: string
  lang: string
  sourceId?: number
  glossaryId?: number
  fsrs: Card
  createdAt: number
}

export type ProgramStep = 'lesson' | 'exercise' | 'reading'

export interface ProgramDay {
  day: number
  startedAt: number
  steps: Partial<Record<ProgramStep, number>>
  completedAt?: number
}

export interface AttentionSession {
  id?: number
  startedAt: number
  durationMs: number
  plannedMinutes: number
  returns: number
}

export const db = new Dexie('lectura-rapida') as Dexie & {
  readingSessions: EntityTable<ReadingSession, 'id'>
  probes: EntityTable<ProbeRecord, 'id'>
  quizResults: EntityTable<QuizResult, 'id'>
  settings: EntityTable<Setting, 'key'>
  sources: EntityTable<Source, 'id'>
  documents: EntityTable<StoredDocument, 'id'>
  notes: EntityTable<Note, 'id'>
  glossary: EntityTable<GlossaryEntry, 'id'>
  cards: EntityTable<StoredCard, 'id'>
  programDays: EntityTable<ProgramDay, 'day'>
  attentionSessions: EntityTable<AttentionSession, 'id'>
}

db.version(1).stores({
  readingSessions: '++id, kind, textId, lang, startedAt',
  probes: '++id, sessionId',
  quizResults: '++id, sessionId, textId',
  settings: 'key',
})

// v2 (fase 2): campos opcionales nuevos en las sesiones y tablas de biblioteca. No requiere upgrade().
db.version(2).stores({
  readingSessions: '++id, kind, textId, lang, startedAt, documentId, sourceId',
  sources: '++id, type, createdAt',
  documents: '++id, sourceId, lastOpenedAt',
  notes: '++id, sourceId, documentId, kind, createdAt',
  glossary: '++id, lang, term, sourceId',
})

// v3 (fase 3): fichas con repetición espaciada, progreso del programa y sesiones de atención.
db.version(3).stores({
  cards: '++id, kind, glossaryId, sourceId, fsrs.due',
  programDays: 'day',
  attentionSessions: '++id, startedAt',
})
