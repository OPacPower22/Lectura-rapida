import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDayPlans } from '../../content/programa'
import { t } from '../../i18n'
import { currentDay, maintenancePlan } from '../../lib/program'
import { countDue } from '../../lib/storage/cards'
import type { ProgramDay } from '../../lib/storage/db'
import { getProgramDays } from '../../lib/storage/program'
import { RetentionCheck } from '../retencion/RetentionCheck'
import { primary } from './exercises/common'

export function ProgramPage() {
  const [days, setDays] = useState<ProgramDay[] | null>(null)
  const [due, setDue] = useState(0)

  useEffect(() => {
    getProgramDays().then(setDays).catch(() => setDays([]))
    countDue(new Date()).then(setDue).catch(() => setDue(0))
  }, [])

  if (!days) return null
  const current = currentDay(days)
  const started = (d: number) => days.some((x) => x.day === d)
  const isDone = (d: number) => days.some((x) => x.day === d && x.completedAt)

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-3xl font-bold">{t('program.title')}</h1>
      <p>{t('program.intro')}</p>
      <RetentionCheck />

      {current === 'mantenimiento' ? (
        <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
          <h2 className="text-xl font-semibold">{t('program.maintenance.title')}</h2>
          <p>{t('program.allDone')}</p>
          <ul className="space-y-2">
            <li>
              {maintenancePlan(due).review ? (
                <Link to="/repasar" className="text-accent-ink underline">
                  {t('program.maintenance.review', { count: due })}
                </Link>
              ) : (
                t('program.maintenance.noReview')
              )}
            </li>
            <li>
              <Link to="/atencion" className="text-accent-ink underline">
                {t('program.maintenance.attention')}
              </Link>
            </li>
            <li>
              <Link to="/biblioteca" className="text-accent-ink underline">
                {t('program.maintenance.reading')}
              </Link>
            </li>
          </ul>
        </div>
      ) : (
        <Link to={`/programa/dia/${current}`} className={`${primary} inline-block`}>
          {started(current) ? t('program.continue', { day: current }) : t('program.start', { day: current })}
        </Link>
      )}

      <ol className="grid gap-2 sm:grid-cols-2">
        {getDayPlans().map((p) => {
          const status = isDone(p.day) ? 'done' : p.day === current ? 'current' : 'pending'
          const label = `${t('program.dayTitle', { day: p.day, title: p.title })} · ${t(`program.status.${status}`)}`
          return (
            <li key={p.day} className={`rounded border px-3 py-2 ${status === 'current' ? 'border-accent' : 'border-line'} ${status === 'done' ? 'text-muted' : ''}`}>
              {status === 'pending' ? label : <Link to={`/programa/dia/${p.day}`} className="underline-offset-2 hover:underline">{label}</Link>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
