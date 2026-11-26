import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { currentLang, t } from '../../i18n'
import { sessionsToCsv } from '../../lib/csv'
import { downloadBlob } from '../../lib/download'
import { retentionSummary, TEXT_KINDS, weeklySeries, type StatsInput } from '../../lib/stats'
import { listAttentionSessions } from '../../lib/storage/attention'
import { listQuizResults, listSessions } from '../../lib/storage/repo'
import { card, outlineButton, primaryButton } from '../../ui/styles'
import { Tabs } from '../../ui/Tabs'
import { BarChart } from './charts/BarChart'
import { LineChart } from './charts/LineChart'
import { HistoryPage } from './HistoryPage'

const WEEKS = 12
const WEEK_MS = 7 * 86_400_000

function weekLabel(week: string): string {
  const [y, m, d] = week.split('-').map(Number)
  return new Intl.DateTimeFormat(currentLang(), { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d))
}

const pct = (v: number | null) => (v === null ? '—' : t('results.percent', { value: Math.round(v * 100) }))

function Summary({ input, now }: { input: StatsInput; now: number }) {
  const rows = weeklySeries(input, now - (WEEKS - 1) * WEEK_MS, now)
  const ppmSeries = TEXT_KINDS.map((k, i) => ({
    name: t(`textKind.${k}`),
    color: (i + 1) as 1 | 2 | 3,
    points: rows.map((r) => ({ x: r.week, y: r.ppm[k] })),
  })).filter((s) => s.points.some((p) => p.y !== null))
  const compSeries = [
    { name: t('history.comprehension'), color: 1 as const, points: rows.map((r) => ({ x: r.week, y: r.comprehension === null ? null : r.comprehension * 100 })) },
    { name: t('history.wandering'), color: 2 as const, points: rows.map((r) => ({ x: r.week, y: r.wandering === null ? null : r.wandering * 100 })) },
  ].filter((s) => s.points.some((p) => p.y !== null))
  const retention = retentionSummary(input.quizzes)

  const exportCsv = () =>
    downloadBlob(new Blob([sessionsToCsv(input.sessions)], { type: 'text/csv;charset=utf-8' }), 'lectura-rapida-sesiones.csv')

  return (
    <div className="space-y-6">
      <p className="text-muted">{t('progress.range', { weeks: WEEKS })}</p>
      {ppmSeries.length ? (
        <LineChart title={t('progress.chart.ppm')} unit="ppm" series={ppmSeries} xFormat={weekLabel} />
      ) : (
        <p className={card}>{t('progress.noPpm')}</p>
      )}
      {compSeries.length > 0 && (
        <LineChart title={t('progress.chart.comprehension')} unit="%" series={compSeries} xFormat={weekLabel} yMax={100} />
      )}
      <BarChart title={t('progress.chart.minutes')} unit="min" bars={rows.map((r) => ({ x: r.week, y: r.minutes }))} xFormat={weekLabel} />
      <section aria-labelledby="ret-title" className={card}>
        <h2 id="ret-title" className="mb-2 font-semibold">{t('progress.retention.title')}</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted">{t('progress.retention.d1')}</dt>
            <dd className="text-2xl font-semibold">{pct(retention.d1)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{t('progress.retention.d7')}</dt>
            <dd className="text-2xl font-semibold">{pct(retention.d7)}</dd>
          </div>
        </dl>
        {retention.d1 === null && retention.d7 === null && <p className="mt-2 text-sm text-muted">{t('progress.retention.none')}</p>}
      </section>
      <button type="button" className={outlineButton} onClick={exportCsv} disabled={!input.sessions.length}>
        {t('progress.exportCsv')}
      </button>
    </div>
  )
}

export function ProgressPage() {
  const [input, setInput] = useState<StatsInput | null>(null)
  const [now, setNow] = useState(0)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([listSessions(), listAttentionSessions(), listQuizResults()])
      .then(([sessions, attention, quizzes]) => {
        setNow(Date.now())
        setInput({ sessions, attention, quizzes })
      })
      .catch(() => setError(true))
  }, [])

  const empty = input !== null && input.sessions.length === 0 && input.attention.length === 0

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-3xl font-bold">{t('history.title')}</h1>
      {error && (
        <p role="alert" className="rounded border border-err-line bg-err-bg p-3 text-err-ink">
          {t('history.loadError')}
        </p>
      )}
      {empty && (
        <div className="space-y-3">
          <p>{t('progress.empty')}</p>
          <Link to="/diagnostico" className={`inline-block ${primaryButton}`}>
            {t('dashboard.startDiagnostic')}
          </Link>
        </div>
      )}
      {input !== null && !empty && (
        <Tabs
          label={t('history.title')}
          tabs={[
            { id: 'resumen', label: t('progress.tab.summary'), panel: <Summary input={input} now={now} /> },
            { id: 'historial', label: t('progress.tab.history'), panel: <HistoryPage embedded /> },
          ]}
        />
      )}
    </section>
  )
}
