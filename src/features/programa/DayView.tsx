import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDayPlan, PROGRAM_DAYS } from '../../content/programa'
import { t } from '../../i18n'
import { currentDay, isDayComplete, stepsFor } from '../../lib/program'
import type { ProgramDay, ProgramStep } from '../../lib/storage/db'
import { completeDay, completeStep, getProgramDays, startDay } from '../../lib/storage/program'
import type { Clock } from '../../lib/stopwatch'
import { ExerciseStep } from './ExerciseStep'
import { primary } from './exercises/common'
import { LessonStep } from './LessonStep'
import { ReadingStep } from './ReadingStep'

const MINUTES: Record<ProgramStep, number> = { lesson: 3, exercise: 5, reading: 12 }

export function DayView({ now }: { now?: Clock }) {
  const day = Number(useParams().day)
  const [progress, setProgress] = useState<ProgramDay | null>(null)
  const [locked, setLocked] = useState<number | null>(null)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const days = await getProgramDays()
      const current = currentDay(days)
      const existing = days.find((d) => d.day === day)
      if (current !== 'mantenimiento' && day > current) {
        if (active) setLocked(current)
        return
      }
      const p = existing ?? (await startDay(day))
      if (active) {
        setProgress(p)
        setCompleted(!!p.completedAt)
      }
    })().catch(() => {})
    return () => {
      active = false
    }
  }, [day])

  const done = useCallback(
    async (step: ProgramStep) => {
      const updated = await completeStep(day, step)
      setProgress(updated)
      if (isDayComplete(getDayPlan(day), updated)) {
        await completeDay(day)
        setCompleted(true)
      }
    },
    [day],
  )

  if (!Number.isInteger(day) || day < 1 || day > PROGRAM_DAYS) return null
  if (locked !== null) {
    return (
      <section className="mx-auto max-w-prose space-y-3">
        <p>{t('program.locked', { day: locked })}</p>
        <Link to="/programa" className="text-accent-ink underline">
          {t('program.toProgram')}
        </Link>
      </section>
    )
  }
  if (!progress) return null

  const plan = getDayPlan(day)
  const steps = stepsFor(plan)
  const active = steps.find((s) => progress.steps[s] === undefined)

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">{t('program.dayTitle', { day, title: plan.title })}</h1>
      <ol className="flex flex-wrap gap-2 text-sm">
        {steps.map((s) => (
          <li
            key={s}
            className={`rounded-full border px-3 py-1 ${progress.steps[s] !== undefined ? 'border-accent text-accent-ink' : s === active ? 'border-accent bg-accent text-on-accent' : 'border-line-strong text-muted'}`}
          >
            {progress.steps[s] !== undefined
              ? t('program.stepDone', { step: t(`program.step.${s}`) })
              : t('program.stepMinutes', { step: t(`program.step.${s}`), minutes: MINUTES[s] })}
          </li>
        ))}
      </ol>

      {completed || !active ? (
        <div className="space-y-3 rounded-lg border border-accent bg-accent-soft p-4 text-accent-ink">
          <p className="text-xl font-semibold">{t('program.dayCompleted', { day })}</p>
          {day < PROGRAM_DAYS ? (
            <Link to={`/programa/dia/${day + 1}`} className={primary}>
              {t('program.next', { day: day + 1 })}
            </Link>
          ) : (
            <p>{t('program.allDone')}</p>
          )}
        </div>
      ) : active === 'lesson' ? (
        <LessonStep day={day} onDone={() => done('lesson')} />
      ) : active === 'exercise' ? (
        <ExerciseStep day={day} spec={plan.exercise} now={now} onDone={() => done('exercise')} />
      ) : (
        <ReadingStep day={day} progress={progress} spec={plan.reading} now={now} onDone={() => done('reading')} />
      )}
    </section>
  )
}
