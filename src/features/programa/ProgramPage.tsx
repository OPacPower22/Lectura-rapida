import { CalendarCheck } from 'lucide-react'
import { PageTitle } from '../../ui/PageTitle'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
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
    <section className="mx-auto max-w-3xl space-y-6">
      <PageTitle Icon={CalendarCheck} marker="program">{t('program.title')}</PageTitle>
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

      <div className="space-y-8">
        {[1, 2, 3, 4].map((week) => (
          <section key={week} aria-labelledby={`week-${week}`} className="space-y-3">
            <h2 id={`week-${week}`} className="text-xl">
              {t('program.weekTitle', { week, theme: t(`program.week.${week}` as 'program.week.1') })}
            </h2>
            <ol className="grid gap-2 sm:grid-cols-2">
              {getDayPlans()
                .filter((p) => Math.ceil(p.day / 7) === week)
                .map((p) => {
                  const status = isDone(p.day) ? 'done' : p.day === current ? 'current' : 'pending'
                  const label = `${t('program.dayTitle', { day: p.day, title: p.title })} · ${t(`program.status.${status}`)}`
                  const badge =
                    status === 'done'
                      ? 'bg-marker-attention'
                      : status === 'current'
                        ? 'bg-cta text-cta-ink ring-2 ring-accent ring-offset-2 ring-offset-surface'
                        : 'border border-line-strong text-muted'
                  const body = (
                    <>
                      <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${badge}`} aria-hidden="true">
                        {status === 'done' ? <Check className="size-4" /> : p.day}
                      </span>
                      <span className="flex flex-col">
                        <span className={`font-semibold leading-snug ${status === 'pending' ? 'text-muted' : ''}`}>{p.title}</span>
                        <span className="text-sm text-muted">
                          {t('program.dayN', { day: p.day })} · {t(`program.status.${status}`)}
                        </span>
                      </span>
                    </>
                  )
                  const tile = `flex items-center gap-3 rounded-lg border p-3 ${status === 'current' ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`
                  return (
                    <li key={p.day}>
                      {status === 'pending' ? (
                        <div className={tile} aria-label={label} role="group">
                          {body}
                        </div>
                      ) : (
                        <Link to={`/programa/dia/${p.day}`} aria-label={label} className={`${tile} transition-colors hover:border-accent`}>
                          {body}
                        </Link>
                      )}
                    </li>
                  )
                })}
            </ol>
          </section>
        ))}
      </div>
    </section>
  )
}
