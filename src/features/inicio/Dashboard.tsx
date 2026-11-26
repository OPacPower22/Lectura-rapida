import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../i18n'
import { BACKUP_LAST_KEY, backupDue, hasUserData } from '../../lib/backup'
import { currentDay } from '../../lib/program'
import { dashboardStats, TEXT_KINDS, type DashboardStats } from '../../lib/stats'
import { listAttentionSessions } from '../../lib/storage/attention'
import { countDue } from '../../lib/storage/cards'
import { getProgramDays } from '../../lib/storage/program'
import { listQuizResults, listSessions } from '../../lib/storage/repo'
import { getSetting } from '../../lib/storage/settings'
import { card } from '../../ui/styles'
import { Sparkline } from '../progreso/charts/Sparkline'
import { RetentionCheck } from '../retencion/RetentionCheck'

interface State {
  stats: DashboardStats
  hasData: boolean
  due: number
  day: number | 'mantenimiento'
  backup: boolean
}

const pct = (v: number | null) => (v === null ? '—' : t('results.percent', { value: Math.round(v * 100) }))
const activity = 'flex flex-col rounded-lg border border-line bg-surface p-4 hover:border-accent focus-visible:border-accent'

function Activity({ to, title, help }: { to: string; title: string; help: string }) {
  return (
    <Link to={to} className={activity}>
      <span className="text-lg font-semibold">{title}</span>
      <span className="text-sm text-muted">{help}</span>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
    </div>
  )
}

/** Tablero de inicio: qué toca hoy, actividades y estadísticas guardadas (sin rachas que castiguen). */
export function Dashboard() {
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    const now = Date.now()
    Promise.all([
      listSessions(),
      listAttentionSessions(),
      listQuizResults(),
      countDue(new Date(now)),
      getProgramDays(),
      getSetting<number>(BACKUP_LAST_KEY),
      hasUserData(),
    ])
      .then(([sessions, attention, quizzes, due, days, lastBackup, data]) =>
        setState({
          stats: dashboardStats({ sessions, attention, quizzes }, now),
          hasData: sessions.length > 0 || attention.length > 0,
          due,
          day: currentDay(days),
          backup: backupDue(now, lastBackup, data),
        }),
      )
      .catch(() =>
        setState({
          stats: dashboardStats({ sessions: [], attention: [], quizzes: [] }, now),
          hasData: false,
          due: 0,
          day: 1,
          backup: false,
        }),
      )
  }, [])

  if (!state) return null
  const { stats, hasData, due, day, backup } = state
  const programLabel = day === 'mantenimiento' ? t('dashboard.maintenance') : t('dashboard.programDay', { day })

  return (
    <div className="space-y-8">
      <section aria-labelledby="today" className="space-y-3">
        <h2 id="today" className="text-xl font-semibold">{t('dashboard.today')}</h2>
        {!hasData && (
          <div className="rounded-lg border-2 border-accent bg-accent-soft p-4">
            <Link to="/diagnostico" className="text-xl font-semibold text-accent-ink underline">
              {t('home.diagnosticCta')}
            </Link>
            <p className="mt-1 text-muted">{t('home.diagnosticHelp')}</p>
          </div>
        )}
        <RetentionCheck />
        {backup && (
          <p role="status" className="rounded border border-warn-line bg-warn-bg p-3 text-warn-ink">
            {t('backup.due')}{' '}
            <Link to="/ajustes" className="font-medium underline">
              {t('backup.goToSettings')}
            </Link>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link to={day === 'mantenimiento' ? '/programa' : `/programa/dia/${day}`} className="rounded-md bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover">
            {programLabel}
          </Link>
          {due > 0 && (
            <Link to="/repasar" className="rounded-md border border-line-strong px-4 py-2 hover:bg-hover">
              {t('dashboard.act.review', { count: due })}
            </Link>
          )}
        </div>
      </section>

      <section aria-labelledby="acts" className="space-y-3">
        <h2 id="acts" className="text-xl font-semibold">{t('dashboard.activities')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Activity to="/programa" title={t('dashboard.act.program')} help={programLabel} />
          <Activity to="/diagnostico" title={t('dashboard.act.speed')} help={t('dashboard.act.speedHelp')} />
          <Activity to="/practica" title={t('dashboard.act.practice')} help={t('dashboard.act.practiceHelp')} />
          <Activity to="/repasar" title={t('dashboard.act.review', { count: due })} help={t('dashboard.act.reviewHelp')} />
          <Activity to="/atencion" title={t('dashboard.act.attention')} help={t('dashboard.act.attentionHelp')} />
          <Activity to="/biblioteca" title={t('dashboard.act.library')} help={t('dashboard.act.libraryHelp')} />
          <Activity to="/biblioteca/fisico" title={t('dashboard.act.physical')} help={t('dashboard.act.physicalHelp')} />
          <Activity to="/leer" title={t('dashboard.act.paste')} help={t('dashboard.act.pasteHelp')} />
          <Activity to="/glosario" title={t('dashboard.act.glossary')} help={t('dashboard.act.glossaryHelp')} />
          <Activity to="/cuaderno" title={t('dashboard.act.notebook')} help={t('dashboard.act.notebookHelp')} />
          <Activity to="/proyectos" title={t('dashboard.act.projects')} help={t('dashboard.act.projectsHelp')} />
          <Activity to="/progreso" title={t('dashboard.act.progress')} help={t('dashboard.act.progressHelp')} />
        </div>
      </section>

      <section aria-labelledby="stats" className="space-y-3">
        <h2 id="stats" className="text-xl font-semibold">{t('dashboard.stats')}</h2>
        {!hasData ? (
          <p className={card}>{t('dashboard.noData')}</p>
        ) : (
          <div className="space-y-3">
            <dl className={`${card} grid grid-cols-3 gap-4`}>
              {TEXT_KINDS.map((k) => (
                <Stat key={k} label={t(`textKind.${k}`)} value={stats.lastPpm[k] === null ? '—' : `${stats.lastPpm[k]} ppm`} />
              ))}
            </dl>
            <p className="text-sm text-muted">{t('dashboard.ppmNote')}</p>
            <dl className={`${card} grid grid-cols-2 gap-4 sm:grid-cols-3`}>
              <Stat label={t('dashboard.comprehension')} value={pct(stats.avgComprehension)} />
              <Stat label={t('progress.retention.d1')} value={pct(stats.retention.d1)} />
              <Stat label={t('progress.retention.d7')} value={pct(stats.retention.d7)} />
              <Stat label={t('history.wandering')} value={pct(stats.wandering)} />
              <Stat label={t('dashboard.practiceDays')} value={t('dashboard.days7', { days: stats.practiceDays7 })} />
              <Stat label={t('dashboard.minutesWeek')} value={`${stats.minutesWeek} min`} />
            </dl>
            {stats.ileSeries.length >= 2 && (
              <div className={`${card} flex flex-wrap items-center gap-4`}>
                <div>
                  <p className="text-sm text-muted">{t('dashboard.ile')}</p>
                  <p className="text-2xl font-semibold">{stats.ileSeries.at(-1)!.ile}</p>
                </div>
                <Sparkline points={stats.ileSeries.map((p) => p.ile)} label={t('dashboard.ileTrend', { n: stats.ileSeries.length })} />
              </div>
            )}
            <Link to="/progreso" className="inline-block text-accent-ink underline">
              {t('dashboard.seeProgress')}
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
