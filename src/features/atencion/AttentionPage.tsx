import { useEffect, useState } from 'react'
import { t } from '../../i18n'
import { listAttentionSessions, saveAttentionSession } from '../../lib/storage/attention'
import type { AttentionSession } from '../../lib/storage/db'
import type { Clock } from '../../lib/stopwatch'
import { BreathingSession } from './BreathingSession'

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })
const OPTIONS = [2, 5, 10] as const

/** Módulo de atención; `embedded` + `minutes` lo usa el programa. */
export function AttentionPage({
  now,
  embedded,
  minutes: fixed,
  onDone,
}: {
  now?: Clock
  embedded?: boolean
  minutes?: 2 | 5 | 10
  onDone?(): void
}) {
  const [minutes, setMinutes] = useState<2 | 5 | 10 | null>(fixed ?? null)
  const [result, setResult] = useState<{ durationMs: number; returns: number } | null>(null)
  const [history, setHistory] = useState<AttentionSession[]>([])

  useEffect(() => {
    if (!embedded) listAttentionSessions().then(setHistory).catch(() => setHistory([]))
  }, [embedded, result])

  async function finish(r: { durationMs: number; returns: number }) {
    setResult(r)
    await saveAttentionSession({ startedAt: Date.now() - r.durationMs, durationMs: r.durationMs, plannedMinutes: minutes!, returns: r.returns }).catch(() => {})
    onDone?.()
  }

  return (
    <section className="mx-auto max-w-prose space-y-5">
      {!embedded && <h1 className="text-3xl font-bold">{t('attention.title')}</h1>}
      <p>{t('attention.intro')}</p>
      {result ? (
        <div className="space-y-3">
          <p className="text-lg font-medium">
            {t('attention.summary', { minutes: Math.max(1, Math.round(result.durationMs / 60000)), returns: result.returns })}
          </p>
          {!embedded && (
            <button
              type="button"
              className="rounded-md border border-line-strong px-4 py-2"
              onClick={() => {
                setResult(null)
                setMinutes(null)
              }}
            >
              {t('attention.again')}
            </button>
          )}
        </div>
      ) : minutes ? (
        <BreathingSession minutes={minutes} now={now} onDone={finish} />
      ) : (
        <div className="space-y-2">
          <p className="font-medium">{t('attention.choose')}</p>
          <div className="flex gap-2">
            {OPTIONS.map((m) => (
              <button key={m} type="button" onClick={() => setMinutes(m)} className="rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover">
                {t('attention.minutes', { minutes: m })}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-sm text-muted">{t('attention.evidence')}</p>
      {!embedded && history.length > 0 && (
        <div>
          <h2 className="mb-2 text-xl font-semibold">{t('attention.history')}</h2>
          <ul className="space-y-1 text-sm">
            {history.slice(0, 10).map((s) => (
              <li key={s.id}>
                {dateFormat.format(s.startedAt)} · {t('attention.summary', { minutes: Math.max(1, Math.round(s.durationMs / 60000)), returns: s.returns })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
