import dias from './dias.json'

export type ExerciseSpec =
  | { type: 'atencion'; minutes: 2 | 5 | 10 }
  | { type: 'enfoque' }
  | { type: 'hojeo'; textId: string; seconds: number }
  | { type: 'preguntas'; count: number }
  | { type: 'escaneo'; textId: string }
  | { type: 'mapa' }
  | { type: 'explicar'; seconds: number }
  | { type: 'fichas'; count: number }
  | { type: 'repaso' }
  | { type: 'esquema' }
  | { type: 'ninguno' }

export type ReadingSpec =
  | { type: 'diagnostico' }
  | { type: 'texto'; textId: string; pacer?: boolean }
  | { type: 'retest'; textId: string }
  | { type: 'propio'; pacer?: boolean; minMinutes?: number }

export interface DayPlan {
  day: number
  title: string
  exercise: ExerciseSpec
  reading: ReadingSpec
  /** El ejercicio trabaja sobre lo leído (mapa, fichas): va después de la lectura. */
  exerciseAfterReading?: boolean
}

const plans = dias as DayPlan[]

export const PROGRAM_DAYS = 28

export function getDayPlans(): DayPlan[] {
  return plans
}

export function getDayPlan(day: number): DayPlan {
  const plan = plans.find((p) => p.day === day)
  if (!plan) throw new Error(`No hay plan para el día ${day}`)
  return plan
}
