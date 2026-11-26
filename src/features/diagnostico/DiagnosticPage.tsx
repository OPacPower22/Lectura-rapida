import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { diagnosticTextFor } from '../../content'
import type { TextKind } from '../../content/types'
import { t } from '../../i18n'
import type { Clock } from '../../lib/stopwatch'
import { useFocusHeading } from '../../ui/useFocusHeading'
import { TextTestFlow } from './TextTestFlow'

const KINDS: TextKind[] = ['narrativo', 'expositivo', 'denso']

const primaryButton = 'rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover'

/** Diagnóstico: elegir tipo de texto y lectura medida. `onDone` lo usa el programa (día 1). */
export function DiagnosticPage({ now, onDone }: { now?: Clock; onDone?(): void }) {
  const [started, setStarted] = useState(false)
  const [kind, setKind] = useState<TextKind>('expositivo')
  const [round, setRound] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  useFocusHeading(`${started}-${round}`, root)

  if (!started) {
    return (
      <div ref={root}>
        <section className="mx-auto max-w-prose space-y-4">
          {onDone ? <h2 className="text-2xl font-semibold">{t('diag.title')}</h2> : <h1 className="text-3xl font-bold">{t('diag.title')}</h1>}
          <p>{t('diag.intro')}</p>
          <fieldset className="space-y-1">
            <legend className="mb-1 font-medium">{t('diag.kindLegend')}</legend>
            {KINDS.map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} />
                {t(`diag.kind.${k}`)}
              </label>
            ))}
          </fieldset>
          <button type="button" className={primaryButton} onClick={() => setStarted(true)}>
            {t('diag.continue')}
          </button>
        </section>
      </div>
    )
  }

  return (
    <div ref={root} className="space-y-4">
      {/* Fuera del programa la página conserva su encabezado principal en todos los pasos. */}
      {!onDone && <h1 className="mx-auto max-w-prose text-3xl font-bold">{t('diag.title')}</h1>}
      <TextTestFlow
        key={round}
        text={diagnosticTextFor(kind)}
        role="diagnostico"
        now={now}
        onDone={onDone}
        footer={
          !onDone && (
            <div className="mx-auto flex max-w-prose flex-wrap gap-3">
              <Link to="/progreso" className={primaryButton}>
                {t('diag.toProgress')}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStarted(false)
                  setRound((r) => r + 1)
                }}
                className="rounded-md border border-line-strong px-5 py-2"
              >
                {t('diag.again')}
              </button>
            </div>
          )
        }
      />
    </div>
  )
}
