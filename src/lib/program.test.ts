import { getPracticeText } from '../content'
import { getDayPlans, getDayPlan } from '../content/programa'
import type { ProgramDay, ReadingSession } from './storage/db'
import { currentDay, isDayComplete, maintenancePlan, ownReadingDone, stepsFor } from './program'

const done = (day: number): ProgramDay => ({ day, startedAt: 1, steps: { lesson: 1, exercise: 1, reading: 1 }, completedAt: 2 })
const session = (over: Partial<ReadingSession>): ReadingSession => ({
  kind: 'libre', lang: 'es', startedAt: 100, endedAt: 200, activeMs: 600000, words: 1000, wpm: 100, ...over,
})

describe('plan de días', () => {
  it('28 días con textos existentes y re-tests en 7, 14, 21 y 28', () => {
    const plans = getDayPlans()
    expect(plans.map((p) => p.day)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1))
    for (const p of plans) {
      if ('textId' in p.reading) expect(getPracticeText(p.reading.textId), `día ${p.day}`).toBeDefined()
      if ('textId' in p.exercise) expect(getPracticeText(p.exercise.textId), `día ${p.day}`).toBeDefined()
      expect(p.title.length).toBeGreaterThan(2)
    }
    expect(plans.filter((p) => p.reading.type === 'retest').map((p) => p.day)).toEqual([7, 14, 21, 28])
    expect(getDayPlan(1).reading.type).toBe('diagnostico')
    expect(getDayPlan(27).reading).toMatchObject({ type: 'propio', minMinutes: 30 })
  })
})

describe('motor del programa', () => {
  it('currentDay avanza por días completados', () => {
    expect(currentDay([])).toBe(1)
    expect(currentDay([done(1), done(2), done(3)])).toBe(4)
    expect(currentDay([done(1), { day: 2, startedAt: 5, steps: { lesson: 6 } }])).toBe(2)
    expect(currentDay(Array.from({ length: 28 }, (_, i) => done(i + 1)))).toBe('mantenimiento')
  })

  it('stepsFor omite el ejercicio cuando no hay', () => {
    expect(stepsFor(getDayPlan(1))).toEqual(['lesson', 'reading'])
    expect(stepsFor(getDayPlan(2))).toEqual(['lesson', 'exercise', 'reading'])
  })

  it('isDayComplete exige todos los pasos', () => {
    const plan = getDayPlan(2)
    expect(isDayComplete(plan, { day: 2, startedAt: 1, steps: { lesson: 1, exercise: 1 } })).toBe(false)
    expect(isDayComplete(plan, { day: 2, startedAt: 1, steps: { lesson: 1, exercise: 1, reading: 1 } })).toBe(true)
  })

  it('ownReadingDone exige una sesión propia posterior al inicio del día', () => {
    const day: ProgramDay = { day: 8, startedAt: 1000, steps: {} }
    expect(ownReadingDone(day, [session({ startedAt: 500 })])).toBe(false)
    expect(ownReadingDone(day, [session({ startedAt: 1500 })])).toBe(true)
    expect(ownReadingDone(day, [session({ startedAt: 1500, kind: 'diagnostico' })])).toBe(false)
    expect(ownReadingDone(day, [session({ startedAt: 1500, kind: 'documento', activeMs: 10 * 60000 })], 30)).toBe(false)
    expect(ownReadingDone(day, [session({ startedAt: 1500, kind: 'fisico', activeMs: 31 * 60000 })], 30)).toBe(true)
  })

  it('el mantenimiento propone repaso solo si hay fichas', () => {
    expect(maintenancePlan(3)).toEqual({ review: true, attentionMinutes: 5, reading: 'propio' })
    expect(maintenancePlan(0).review).toBe(false)
  })
})
