import { useMemo, useRef, useState } from 'react'
import { t } from '../../i18n'
import type { ProbeAnswer } from '../../lib/metrics'
import type { ProbeRange } from '../../lib/probes'
import type { Clock } from '../../lib/stopwatch'
import { countWords, splitParagraphs } from '../../lib/text'
import { ProbeDialog } from './ProbeDialog'
import { ReadingToolbar } from './ReadingToolbar'
import { FONT_SIZES, useFocusAfterProbe } from './readerUtils'
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
}

export function ReadingView({ title, body, lang, probeRange, onFinish, now, rng }: Props) {
  const session = useReadingSession({ probeRange, now, rng })
  const [fontIndex, setFontIndex] = useState(1)
  const distractedButton = useRef<HTMLButtonElement>(null)
  const paragraphs = useMemo(() => splitParagraphs(body), [body])
  useFocusAfterProbe(session.probeOpen, distractedButton)

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
      <div inert={session.probeOpen || undefined}>
        <ReadingToolbar
          ref={distractedButton}
          onFont={(d) => setFontIndex((i) => Math.min(FONT_SIZES.length - 1, Math.max(0, i + d)))}
          onDistracted={session.markDistracted}
          onFinish={finish}
        />
        <article lang={lang} style={{ fontSize: FONT_SIZES[fontIndex] }} className="space-y-4 leading-relaxed">
          <h2 className="text-[1.3em] font-semibold">{title}</h2>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
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

