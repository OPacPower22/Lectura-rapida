import { db, type ProgramDay, type ProgramStep } from './db'

export async function getProgramDays(): Promise<ProgramDay[]> {
  return db.programDays.orderBy('day').toArray()
}

/** Marca el inicio de un día del programa. Si ya existe, lo devuelve sin cambios. */
export async function startDay(day: number): Promise<ProgramDay> {
  return db.transaction('rw', db.programDays, async () => {
    const existing = await db.programDays.get(day)
    if (existing) return existing
    const created: ProgramDay = { day, startedAt: Date.now(), steps: {} }
    await db.programDays.put(created)
    return created
  })
}

export async function completeStep(day: number, step: ProgramStep): Promise<ProgramDay> {
  return db.transaction('rw', db.programDays, async () => {
    const current = (await db.programDays.get(day)) ?? { day, startedAt: Date.now(), steps: {} }
    const updated: ProgramDay = { ...current, steps: { ...current.steps, [step]: current.steps[step] ?? Date.now() } }
    await db.programDays.put(updated)
    return updated
  })
}

export async function completeDay(day: number): Promise<void> {
  await db.programDays.update(day, { completedAt: Date.now() })
}
