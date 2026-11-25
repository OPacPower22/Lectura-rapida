import { PROGRAM_DAYS, type DayPlan } from '../content/programa'
import type { ProgramDay, ProgramStep, ReadingSession } from './storage/db'

/** Día que toca: el primero sin completar; tras el 28, mantenimiento. Avanza por días completados. */
export function currentDay(days: ProgramDay[]): number | 'mantenimiento' {
  const completed = new Set(days.filter((d) => d.completedAt).map((d) => d.day))
  for (let day = 1; day <= PROGRAM_DAYS; day++) if (!completed.has(day)) return day
  return 'mantenimiento'
}

export function stepsFor(plan: DayPlan): ProgramStep[] {
  if (plan.exercise.type === 'ninguno') return ['lesson', 'reading']
  return plan.exerciseAfterReading ? ['lesson', 'reading', 'exercise'] : ['lesson', 'exercise', 'reading']
}

export function isDayComplete(plan: DayPlan, progress: ProgramDay): boolean {
  return stepsFor(plan).every((step) => progress.steps[step] !== undefined)
}

const OWN_KINDS: ReadingSession['kind'][] = ['documento', 'fisico', 'libre']

/**
 * Lectura propia hecha: al menos una sesión de documento, libro físico o texto pegado tras empezar el día.
 * Con `minMinutes`, cuenta la suma del tiempo activo de esas sesiones (se admiten varios bloques).
 */
export function ownReadingDone(progress: ProgramDay, sessions: ReadingSession[], minMinutes?: number): boolean {
  const own = sessions.filter((s) => OWN_KINDS.includes(s.kind) && s.startedAt >= progress.startedAt)
  if (own.length === 0) return false
  if (minMinutes === undefined) return true
  return own.reduce((sum, s) => sum + s.activeMs, 0) >= minMinutes * 60000
}

export function maintenancePlan(dueCards: number): { review: boolean; attentionMinutes: 5; reading: 'propio' } {
  return { review: dueCards > 0, attentionMinutes: 5, reading: 'propio' }
}
