import { useEffect, useRef, useState } from 'react'
import { t } from '../../i18n'
import { playChime } from '../../lib/sound'
import type { Clock } from '../../lib/stopwatch'

interface Props {
  minutes: 2 | 5 | 10
  now?: Clock
  onDone(result: { durationMs: number; returns: number }): void
}

function format(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Sesión guiada de atención a la respiración con contador de regresos. */
export function BreathingSession({ minutes, now = () => performance.now(), onDone }: Props) {
  const total = minutes * 60000
  const [start] = useState(() => now())
  const [elapsed, setElapsed] = useState(0)
  const [returns, setReturns] = useState(0)
  const done = useRef(false)
  const returnsRef = useRef(0)

  const finish = (durationMs: number) => {
    if (done.current) return
    done.current = true
    onDone({ durationMs, returns: returnsRef.current })
  }

  useEffect(() => {
    const id = setInterval(() => {
      const e = now() - start
      setElapsed(e)
      if (e >= total && !done.current) {
        playChime()
        finish(total)
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intervalo único por sesión
  }, [])

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-48 w-48 items-center justify-center" aria-hidden="true">
        <div className="breathe h-40 w-40 rounded-full bg-accent-soft" />
      </div>
      <p className="text-muted">
        {t('attention.inhale')} 4 s · {t('attention.exhale')} 6 s
      </p>
      <p className="text-3xl font-semibold tabular-nums">{t('attention.remaining', { time: format(total - elapsed) })}</p>
      <p aria-live="polite">{t('attention.returns', { count: returns })}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            returnsRef.current += 1
            setReturns(returnsRef.current)
          }}
          className="rounded-md bg-accent px-5 py-3 font-medium text-on-accent hover:bg-accent-hover"
        >
          {t('attention.returned')}
        </button>
        <button type="button" onClick={() => finish(Math.min(total, now() - start))} className="rounded-md border border-line-strong px-4 py-3">
          {t('attention.finishEarly')}
        </button>
      </div>
    </div>
  )
}
