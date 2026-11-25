import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { t } from '../../i18n'
import type { ProbeAnswer } from '../../lib/metrics'
import { nextProbeDelayMs, type ProbeRange } from '../../lib/probes'
import { createStopwatch, type Clock, type Stopwatch } from '../../lib/stopwatch'
import { countWords, splitParagraphs } from '../../lib/text'
import { ProbeDialog } from './ProbeDialog'

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

const FONT_SIZES = [16, 18, 20, 22, 24, 28]

export function ReadingView({ title, body, lang, probeRange, onFinish, now, rng }: Props) {
  const [reading, setReading] = useState(false)
  const [probeOpen, setProbeOpen] = useState(false)
  const [fontIndex, setFontIndex] = useState(1)

  const stopwatch = useRef<Stopwatch | null>(null)
  const probes = useRef<ReadingOutcome['probes']>([])
  const startedAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const probeOpenRef = useRef(false)

  const paragraphs = useMemo(() => splitParagraphs(body), [body])

  const clearProbeTimer = () => clearTimeout(timer.current)

  const scheduleProbe = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      stopwatch.current?.pause()
      probeOpenRef.current = true
      setProbeOpen(true)
    }, nextProbeDelayMs(probeRange, rng))
  }, [probeRange, rng])

  useEffect(() => {
    if (!reading) return
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopwatch.current?.pause()
        clearProbeTimer()
      } else if (!probeOpenRef.current) {
        stopwatch.current?.resume()
        scheduleProbe()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearProbeTimer()
    }
  }, [reading, scheduleProbe])

  function start() {
    stopwatch.current = createStopwatch(now)
    stopwatch.current.start()
    probes.current = []
    startedAt.current = Date.now()
    setReading(true)
    scheduleProbe()
  }

  function answerProbe(answer: Exclude<ProbeAnswer, 'auto'>) {
    probes.current.push({ at: Date.now(), answer })
    probeOpenRef.current = false
    setProbeOpen(false)
    stopwatch.current?.resume()
    scheduleProbe()
  }

  function markDistracted() {
    probes.current.push({ at: Date.now(), answer: 'auto' })
  }

  function finish() {
    clearProbeTimer()
    const sw = stopwatch.current!
    sw.pause()
    setReading(false)
    onFinish({
      startedAt: startedAt.current,
      endedAt: Date.now(),
      activeMs: sw.elapsedMs(),
      words: countWords(body, lang),
      probes: [...probes.current],
    })
  }

  if (!reading) {
    return (
      <section className="mx-auto max-w-prose space-y-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p>{t('reader.instructions')}</p>
        <button
          type="button"
          onClick={start}
          className="rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover"
        >
          {t('reader.start')}
        </button>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-prose">
      <div className="sticky top-0 z-[1] mb-4 flex flex-wrap items-center gap-2 border-b border-line bg-page/95 py-2">
        <button
          type="button"
          onClick={() => setFontIndex((i) => Math.max(0, i - 1))}
          aria-label={t('reader.fontSmaller')}
          className="rounded border border-line-strong px-3 py-1"
        >
          A−
        </button>
        <button
          type="button"
          onClick={() => setFontIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
          aria-label={t('reader.fontLarger')}
          className="rounded border border-line-strong px-3 py-1"
        >
          A+
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={markDistracted}
          className="rounded border border-warn-strong px-3 py-1 text-warn-ink"
        >
          {t('reader.distracted')}
        </button>
        <button
          type="button"
          onClick={finish}
          className="rounded bg-accent px-4 py-1 font-medium text-on-accent hover:bg-accent-hover"
        >
          {t('reader.finish')}
        </button>
      </div>
      <article lang={lang} style={{ fontSize: FONT_SIZES[fontIndex] }} className="space-y-4 leading-relaxed">
        <h2 className="text-[1.3em] font-semibold">{title}</h2>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>
      {probeOpen && <ProbeDialog onAnswer={answerProbe} />}
    </section>
  )
}
