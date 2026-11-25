import { db } from './db'
import { completeDay, completeStep, getProgramDays, startDay } from './program'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('progreso del programa', () => {
  it('startDay es idempotente', async () => {
    const a = await startDay(1)
    await new Promise((r) => setTimeout(r, 5))
    const b = await startDay(1)
    expect(b.startedAt).toBe(a.startedAt)
  })

  it('completeStep guarda la marca y conserva los demás pasos', async () => {
    await startDay(2)
    await completeStep(2, 'lesson')
    const day = await completeStep(2, 'exercise')
    expect(day.steps.lesson).toBeGreaterThan(0)
    expect(day.steps.exercise).toBeGreaterThan(0)
    expect(day.completedAt).toBeUndefined()
    await completeDay(2)
    const [stored] = await getProgramDays()
    expect(stored.completedAt).toBeGreaterThan(0)
  })
})
