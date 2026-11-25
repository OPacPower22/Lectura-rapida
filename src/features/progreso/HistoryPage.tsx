import { useEffect, useState } from 'react'
import { t } from '../../i18n'
import { comprehension, ile, mindWanderingRate } from '../../lib/metrics'
import { listSessions, type SessionSummary } from '../../lib/storage/repo'

const DASH = '—'
const pct = (v: number) => t('results.percent', { value: Math.round(v * 100) })
const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })

function Row({ summary }: { summary: SessionSummary }) {
  const { session, quiz, probes } = summary
  const comp = quiz && quiz.total > 0 ? comprehension(quiz.correct, quiz.total) : null
  const wandering = mindWanderingRate(probes.map((p) => p.answer))
  return (
    <tr className="border-b border-line">
      <td className="py-2 pr-3">{dateFormat.format(session.startedAt)}</td>
      <td className="pr-3">
        {t(`history.kind.${session.kind}`)}
        {session.textKind && ` · ${t(`textKind.${session.textKind}`)}`}
        {session.title && <span className="block text-muted">{session.title}</span>}
      </td>
      <td className="pr-3">{session.lang}</td>
      <td className="pr-3">{session.wpm ?? DASH}</td>
      <td className="pr-3">{comp === null ? DASH : pct(comp)}</td>
      <td className="pr-3">{comp === null || session.wpm === null ? DASH : ile(session.wpm, comp)}</td>
      <td>{wandering === null ? DASH : pct(wandering)}</td>
    </tr>
  )
}

export function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch(() => setLoadError(true))
  }, [])

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-3xl font-bold">{t('history.title')}</h1>
      {loadError && (
        <p role="alert" className="rounded border border-err-line bg-err-bg p-3 text-err-ink">
          {t('history.loadError')}
        </p>
      )}
      {sessions !== null && sessions.length === 0 && <p>{t('history.empty')}</p>}
      {sessions !== null && sessions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="py-2 pr-3">{t('history.date')}</th>
                <th className="pr-3">{t('history.kind')}</th>
                <th className="pr-3">{t('history.lang')}</th>
                <th className="pr-3">{t('history.wpm')}</th>
                <th className="pr-3">{t('history.comprehension')}</th>
                <th className="pr-3">{t('history.ile')}</th>
                <th>{t('history.wandering')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <Row key={s.session.id} summary={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
