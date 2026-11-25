import { useEffect, useState } from 'react'
import { t } from '../../../i18n'
import { DoneButton, primary } from './common'

/** Explicar en voz alta con temporizador y autoevaluación. */
export function Explain({ seconds, onDone }: { seconds: number; onDone(): void }) {
  const [phase, setPhase] = useState<'intro' | 'talk' | 'check' | 'done'>('intro')
  const [left, setLeft] = useState(seconds)

  useEffect(() => {
    if (phase !== 'talk') return
    const id = setInterval(() => setLeft((l) => (l <= 1 ? (setPhase('check'), 0) : l - 1)), 1000)
    return () => clearInterval(id)
  }, [phase])

  if (phase === 'intro') {
    return (
      <div className="space-y-3">
        <p>{t('explain.intro', { seconds })}</p>
        <button type="button" className={primary} onClick={() => setPhase('talk')}>
          {t('explain.start')}
        </button>
      </div>
    )
  }
  if (phase === 'talk') {
    return (
      <div className="space-y-3 text-center">
        <p className="text-4xl font-semibold tabular-nums">{t('explain.left', { seconds: left })}</p>
        <button type="button" className="rounded-md border border-line-strong px-4 py-2" onClick={() => setPhase('check')}>
          {t('reader.finish')}
        </button>
      </div>
    )
  }
  if (phase === 'check') {
    return (
      <div className="space-y-3">
        <p className="font-medium">{t('explain.check')}</p>
        <div className="flex gap-2">
          {(['explain.yes', 'explain.partly', 'explain.no'] as const).map((k) => (
            <button key={k} type="button" className="rounded-md border border-line-strong px-4 py-2" onClick={() => setPhase('done')}>
              {t(k)}
            </button>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <p>{t('explain.tip')}</p>
      <DoneButton onClick={onDone} />
    </div>
  )
}
