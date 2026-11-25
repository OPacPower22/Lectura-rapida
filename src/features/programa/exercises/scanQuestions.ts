import type { PracticeText, Question } from '../../../content/types'

/** Tres preguntas literales del texto para el ejercicio de escaneo. */
export function scanQuestions(text: PracticeText): Question[] {
  return text.questions.filter((q) => q.type === 'literal').slice(0, 3)
}
