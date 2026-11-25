import type { TextKind } from '../lib/storage/db'

export type { TextKind }

export type QuestionType = 'literal' | 'inferencial' | 'idea-central'

export interface Question {
  id: string
  type: QuestionType
  prompt: string
  options: [string, string, string, string]
  answerIndex: 0 | 1 | 2 | 3
}

export type TextRole = 'diagnostico' | 'retest' | 'practica'

export interface PracticeText {
  id: string
  role: TextRole
  lang: string
  title: string
  kind: TextKind
  body: string
  source: string
  questions: Question[]
}
