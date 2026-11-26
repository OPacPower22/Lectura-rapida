import { useEffect, useMemo, useRef, useState } from 'react'
import { t } from '../../i18n'
import type { ProbeAnswer } from '../../lib/metrics'
import type { ProbeRange } from '../../lib/probes'
import type { Clock } from '../../lib/stopwatch'
import { countWords, splitParagraphs } from '../../lib/text'
import { LeaveGuard } from './LeaveGuard'
import { PacedParagraph, PacerControls, PacerNote } from './Pacer'
import { ProbeDialog } from './ProbeDialog'
import { ReadingToolbar } from './ReadingToolbar'
import { usePreferences } from '../../app/preferencesContext'
import { FONT_SIZES, useFocusAfterProbe } from './readerUtils'
import { usePacer } from './usePacer'
import { useReadingSession } from './useReadingSession'

export interface ReadingOutcome {
  startedAt: number
  endedAt: number
  activeMs: number
  words: number
  probes: { at: number; answer: ProbeAnswer }[]
}

interface Props {
  title: string
  body: string
  lang: string
  probeRange: ProbeRange
  onFinish: (outcome: ReadingOutcome) => void
  now?: Clock
  rng?: () => number
  /** Ofrece el marcapasos opcional (no en el diagnóstico, que mide la línea base). */
  allowPacer?: boolean
  /** Velocidad sugerida del marcapasos; si se indica, empieza activado. */
  initialPacerWpm?: number
  /** Sondeos de atención (por defecto, sí). */
  probesEnabled?: boolean
}

export function ReadingView({ title, body, lang, probeRange, onFinish, now, rng, allowPacer, initialPacerWpm, probesEnabled = true }: Props) {
  const session = useReadingSession({ probeRange, now, rng, probesEnabled })
  const { prefs } = usePreferences()
  const [fontOverride, setFontOverride] = useState<number | null>(null)
  const fontIndex = fontOverride ?? prefs.fontIndex
  const distractedButton = useRef<HTMLButtonElement>(null)
  const paragraphs = useMemo(() => splitParagraphs(body), [body])
  useFocusAfterProbe(session.probeOpen, distractedButton)
  const [pacerOn, setPacerOn] = useState(initialPacerWpm !== undefined)
  const [pacerWpm, setPacerWpm] = useState(initialPacerWpm ?? 250)
  const pacer = usePacer({
    enabled: pacerOn && session.status === 'reading',
    wpm: pacerWpm,
    paragraphs,
    startParagraph: 0,
    elapsedMs: session.elapsedMs,
  })
  const pacedRef = useRef<HTMLParagraphElement | null>(null)
  useEffect(() => {
    pacedRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  }, [pacer?.paragraph])

  function finish() {
    const outcome = session.finish()
    onFinish({ ...outcome, words: countWords(body, lang) })
  }

  if (session.status !== 'reading') {
    return (
      <section className="mx-auto max-w-prose space-y-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p>{t('reader.instructions')}</p>
        <button
          type="button"
          onClick={session.start}
          className="rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover"
        >
          {t('reader.start')}
        </button>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-prose">
      <LeaveGuard active />
      <div inert={session.probeOpen || undefined}>
        <ReadingToolbar
          ref={distractedButton}
          onFont={(d) => setFontOverride(Math.min(FONT_SIZES.length - 1, Math.max(0, fontIndex + d)))}
          onDistracted={session.markDistracted}
          onFinish={finish}
          extra={
            allowPacer ? <PacerControls enabled={pacerOn} wpm={pacerWpm} onEnabled={setPacerOn} onWpm={setPacerWpm} /> : undefined
          }
        />
        {pacerOn && <PacerNote />}
        <article lang={lang} style={{ fontSize: FONT_SIZES[fontIndex] }} className={`space-y-4 ${prefs.lineHeight === 'amplio' ? 'leading-loose' : 'leading-relaxed'}`}>
          <h2 className="text-[1.3em] font-semibold">{title}</h2>
          {paragraphs.map((p, i) =>
            pacer?.paragraph === i ? (
              <p key={i} ref={pacedRef}>
                <PacedParagraph text={p} word={pacer.word} />
              </p>
            ) : (
              <p key={i}>{p}</p>
            ),
          )}
        </article>
      </div>
      {session.probeOpen && (
        <ProbeDialog
          onAnswer={session.answerProbe}
        />
      )}
    </section>
  )
}

