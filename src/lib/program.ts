import { PROGRAM_DAYS, type DayPlan } from '../content/programa'
import type { ProgramDay, ProgramStep, ReadingSession } from './storage/db'

/** Día que toca: el primero sin completar; tras el 28, mantenimiento. Avanza por días completados. */
export function currentDay(days: ProgramDay[]): number | 'mantenimiento' {
  const completed = new Set(days.filter((d) => d.completedAt).map((d) => d.day))
  for (let day = 1; day <= PROGRAM_DAYS; day++) if (!completed.has(day)) return day
  return 'mantenimiento'
}

export function stepsFor(plan: DayPlan): ProgramStep[] {
  return plan.exercise.type === 'ninguno' ? ['lesson', 'reading'] : ['lesson', 'exercise', 'reading']
}

export function isDayComplete(plan: DayPlan, progress: ProgramDay): boolean {
  return stepsFor(plan).every((step) => progress.steps[step] !== undefined)
}

const OWN_KINDS: ReadingSession['kind'][] = ['documento', 'fisico', 'libre']

/** Lectura propia hecha: una sesión de documento, libro físico o texto pegado tras empezar el día. */
export function ownReadingDone(progress: ProgramDay, sessions: ReadingSession[], minMinutes?: number): boolean {
  return sessions.some(
    (s) =>
      OWN_KINDS.includes(s.kind) &&
      s.startedAt >= progress.startedAt &&
      (minMinutes === undefined || s.activeMs >= minMinutes * 60000),
  )
}

export function maintenancePlan(dueCards: number): { review: boolean; attentionMinutes: 5; reading: 'propio' } {
  return { review: dueCards > 0, attentionMinutes: 5, reading: 'propio' }
}
