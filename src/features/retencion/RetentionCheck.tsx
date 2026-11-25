import { useEffect, useState } from 'react'
import { getPracticeText } from '../../content'
import { t } from '../../i18n'
import { pendingRetention, retentionQuestions, saveRetention, type PendingRetention } from '../../lib/retention'
import { Quiz } from '../diagnostico/Quiz'

/** Aviso y cuestionario de retención diferida (24 h y 7 días). No muestra nada si no hay pendientes. */
export function RetentionCheck() {
  const [pending, setPending] = useState<PendingRetention[]>([])
  const [active, setActive] = useState<PendingRetention | null>(null)
  const [result, setResult] = useState<{ retained: number; immediate: number } | null>(null)

  useEffect(() => {
    pendingRetention(Date.now()).then(setPending).catch(() => setPending([]))
  }, [result])

  if (result) {
    return (
      <section className="rounded-lg border border-accent bg-accent-soft p-4 text-accent-ink" role="status">
        <p className="font-medium">{t('retention.result', result)}</p>
        <button type="button" className="mt-2 underline" onClick={() => setResult(null)}>
          {t('docreader.close')}
        </button>
      </section>
    )
  }

  if (active) {
    const text = getPracticeText(active.textId)
    if (!text) return null
    return (
      <section className="space-y-3 rounded-lg border border-line bg-surface p-4">
        <h2 className="text-xl font-semibold">{t('retention.title', { title: text.title })}</h2>
        <p className="text-sm text-muted">{t('retention.help')}</p>
        <Quiz
          questions={retentionQuestions(text)}
          onSubmit={async (answers) => {
            const retained = await saveRetention(active.sessionId, active.textId, active.delayDays, answers)
            setActive(null)
            setResult({ retained: Math.round(retained * 100), immediate: Math.round(active.immediate * 100) })
          }}
        />
      </section>
    )
  }

  if (pending.length === 0) return null
  return (
    <section className="space-y-2 rounded-lg border border-accent bg-accent-soft p-4 text-accent-ink">
      {pending.map((p) => (
        <button key={`${p.sessionId}-${p.delayDays}`} type="button" onClick={() => setActive(p)} className="block text-left font-medium underline">
          {t('retention.start')} · {getPracticeText(p.textId)?.title} ({t(p.delayDays === 1 ? 'retention.after1' : 'retention.after7')})
        </button>
      ))}
    </section>
  )
}
