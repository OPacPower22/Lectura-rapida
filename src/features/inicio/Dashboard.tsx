import { useEffect, useState } from 'react'
import {
  BookA,
  BookOpen,
  BookOpenText,
  CalendarCheck,
  ChartNoAxesCombined,
  ClipboardPaste,
  Gauge,
  Layers,
  LibraryBig,
  NotebookPen,
  PenLine,
  Wind,
  type LucideIcon,
} from 'lucide-react'
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
import { ReadingStrip } from './ReadingStrip'
import { MARKER_BG, type Marker } from '../../ui/markers'

interface State {
  stats: DashboardStats
  hasData: boolean
  due: number
  day: number | 'mantenimiento'
  backup: 'never' | 'due' | null
  loadError?: boolean
}

const pct = (v: number | null) => (v === null ? '—' : t('results.percent', { value: Math.round(v * 100) }))

function Activity({ to, title, help, marker, Icon }: { to: string; title: string; help: string; marker: Marker; Icon: LucideIcon }) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-accent">
      <span className={`marker-chip ${MARKER_BG[marker]}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col">
        <span className="font-semibold leading-snug group-hover:text-accent-ink">{title}</span>
        <span className="text-sm text-muted">{help}</span>
      </span>
    </Link>
  )
}

function Stat({ label, value, marker = 'progress' }: { label: string; value: string; marker?: Marker }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <span className={`mb-2 block h-1.5 w-8 rounded-full ${MARKER_BG[marker]}`} aria-hidden="true" />
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums">{value}</dd>
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
          backup: backupDue(now, lastBackup, data) ? (lastBackup === undefined ? 'never' : 'due') : null,
        }),
      )
      .catch(() =>
        setState({
          stats: dashboardStats({ sessions: [], attention: [], quizzes: [] }, now),
          hasData: false,
          due: 0,
          day: 1,
          backup: null,
          loadError: true,
        }),
      )
  }, [])

  if (!state) return null
  const { stats, hasData, due, day, backup, loadError } = state
  const programLabel = day === 'mantenimiento' ? t('dashboard.maintenance') : t('dashboard.programDay', { day })

  const programLink = day === 'mantenimiento' ? '/programa' : `/programa/dia/${day}`
  const heroButton = 'inline-flex items-center gap-2 rounded-md px-5 py-3 font-semibold'

  return (
    <div className="space-y-10">
      <section aria-labelledby="hero-title" className="hero overflow-hidden rounded-2xl px-6 py-8 sm:px-10 sm:py-12">
        <div className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
          <div className="space-y-5">
            <h1 id="hero-title" className="text-4xl leading-tight sm:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="max-w-prose text-lg text-hero-muted">{t('home.lead')}</p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {!hasData && !loadError ? (
                <>
                  <Link to="/diagnostico" className={`cta ${heroButton}`}>
                    <Gauge className="size-5" aria-hidden="true" />
                    {t('home.diagnosticCta')}
                  </Link>
                  <p className="text-hero-muted">{t('home.diagnosticHelp')}</p>
                </>
              ) : (
                <>
                  <Link to={programLink} className={`cta ${heroButton}`}>
                    <CalendarCheck className="size-5" aria-hidden="true" />
                    {programLabel}
                  </Link>
                  <Link to="/practica" className={`${heroButton} border border-hero-muted text-hero-ink hover:bg-white/10`}>
                    <BookOpenText className="size-5" aria-hidden="true" />
                    {t('dashboard.act.practice')}
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <ReadingStrip />
          </div>
        </div>
      </section>

      <section aria-labelledby="today" className="space-y-3">
        <h2 id="today" className="text-2xl">{t('dashboard.today')}</h2>
        {loadError && (
          <p role="alert" className="rounded-lg border border-err-line bg-err-bg p-3 text-err-ink">
            {t('dashboard.loadError')}
          </p>
        )}
        <RetentionCheck />
        {backup && (
          <p role="status" className="rounded-lg border border-warn-line bg-warn-bg p-3 text-warn-ink">
            {t(backup === 'never' ? 'backup.never' : 'backup.due')}{' '}
            <Link to="/ajustes" className="font-semibold underline">
              {t('backup.goToSettings')}
            </Link>
          </p>
        )}
        {due > 0 ? (
          <Link to="/repasar" className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-semibold text-on-accent hover:bg-accent-hover">
            <Layers className="size-4" aria-hidden="true" />
            {t('dashboard.act.review', { count: due })}
          </Link>
        ) : (
          <p className="text-muted">{t('dashboard.todayClear')}</p>
        )}
      </section>

      <section aria-labelledby="acts" className="space-y-4">
        <h2 id="acts" className="text-2xl">{t('dashboard.activities')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Activity to="/programa" marker="program" Icon={CalendarCheck} title={t('dashboard.act.program')} help={programLabel} />
          <Activity to="/diagnostico" marker="read" Icon={Gauge} title={t('dashboard.act.speed')} help={t('dashboard.act.speedHelp')} />
          <Activity to="/practica" marker="read" Icon={BookOpenText} title={t('dashboard.act.practice')} help={t('dashboard.act.practiceHelp')} />
          <Activity to="/repasar" marker="memory" Icon={Layers} title={t('dashboard.act.review', { count: due })} help={t('dashboard.act.reviewHelp')} />
          <Activity to="/atencion" marker="attention" Icon={Wind} title={t('dashboard.act.attention')} help={t('dashboard.act.attentionHelp')} />
          <Activity to="/biblioteca" marker="read" Icon={LibraryBig} title={t('dashboard.act.library')} help={t('dashboard.act.libraryHelp')} />
          <Activity to="/biblioteca/fisico" marker="read" Icon={BookOpen} title={t('dashboard.act.physical')} help={t('dashboard.act.physicalHelp')} />
          <Activity to="/leer" marker="read" Icon={ClipboardPaste} title={t('dashboard.act.paste')} help={t('dashboard.act.pasteHelp')} />
          <Activity to="/glosario" marker="memory" Icon={BookA} title={t('dashboard.act.glossary')} help={t('dashboard.act.glossaryHelp')} />
          <Activity to="/cuaderno" marker="writing" Icon={NotebookPen} title={t('dashboard.act.notebook')} help={t('dashboard.act.notebookHelp')} />
          <Activity to="/proyectos" marker="writing" Icon={PenLine} title={t('dashboard.act.projects')} help={t('dashboard.act.projectsHelp')} />
          <Activity to="/progreso" marker="progress" Icon={ChartNoAxesCombined} title={t('dashboard.act.progress')} help={t('dashboard.act.progressHelp')} />
        </div>
      </section>

      <section aria-labelledby="stats" className="space-y-4">
        <h2 id="stats" className="text-2xl">{t('dashboard.stats')}</h2>
        {!hasData ? (
          <p className={card}>{t('dashboard.noData')}</p>
        ) : (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TEXT_KINDS.map((k) => (
                <Stat key={k} marker="read" label={t(`textKind.${k}`)} value={stats.lastPpm[k] === null ? '—' : t('results.wpm', { wpm: stats.lastPpm[k]! })} />
              ))}
            </dl>
            <p className="text-sm text-muted">{t('dashboard.ppmNote')}</p>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat marker="read" label={t('dashboard.comprehension')} value={pct(stats.avgComprehension)} />
              <Stat marker="memory" label={t('progress.retention.d1')} value={pct(stats.retention.d1)} />
              <Stat marker="memory" label={t('progress.retention.d7')} value={pct(stats.retention.d7)} />
              <Stat marker="attention" label={t('history.wandering')} value={pct(stats.wandering)} />
              <Stat marker="progress" label={t('dashboard.practiceDays')} value={t('dashboard.days7', { days: stats.practiceDays7 })} />
              <Stat marker="progress" label={t('dashboard.minutesWeek')} value={t('interval.min', { count: stats.minutesWeek })} />
            </dl>
            {stats.ileSeries.length >= 2 && (
              <div className={`${card} flex flex-wrap items-center justify-between gap-4`}>
                <div>
                  <p className="text-sm text-muted">{t('dashboard.ile')}</p>
                  <p className="text-3xl font-bold tabular-nums">{stats.ileSeries.at(-1)!.ile}</p>
                </div>
                <Sparkline points={stats.ileSeries.map((p) => p.ile)} label={t('dashboard.ileTrend', { n: stats.ileSeries.length })} />
              </div>
            )}
            <Link to="/progreso" className="inline-flex items-center gap-2 font-semibold text-accent-ink underline underline-offset-4">
              <ChartNoAxesCombined className="size-4" aria-hidden="true" />
              {t('dashboard.seeProgress')}
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
