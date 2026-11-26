import { useMemo, useRef, useState } from 'react'
import { usePreferences } from '../../app/preferencesContext'
import { useFocusHeading } from '../../ui/useFocusHeading'
import { t, tPlural } from '../../i18n'
import { PROBE_RANGE_PROGRAMA } from '../../lib/probes'
import { saveSession } from '../../lib/storage/repo'
import type { Clock } from '../../lib/stopwatch'
import { countWords } from '../../lib/text'
import { ResultsCard, type ResultsData } from '../diagnostico/ResultsCard'
import { computeResults } from '../diagnostico/results'
import { ReadingView, type ReadingOutcome } from './ReadingView'
import { RecallStep } from '../diagnostico/RecallStep'

const LANGS = ['es', 'en', 'fr', 'pt', 'it', 'de'] as const

export function PasteReadPage({ now }: { now?: Clock }) {
  const { prefs } = usePreferences()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [lang, setLang] = useState<(typeof LANGS)[number]>('es')
  const [step, setStep] = useState<'edit' | 'reading' | 'results'>('edit')
  const root = useRef<HTMLElement>(null)
  useFocusHeading(step, root)
  const [results, setResults] = useState<ResultsData | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [sessionId, setSessionId] = useState<number | undefined>()

  const words = useMemo(() => countWords(text, lang), [text, lang])

  async function finish(outcome: ReadingOutcome) {
    const data = computeResults(outcome)
    setResults(data)
    setStep('results')
    try {
      const id = await saveSession({
        session: {
          kind: 'libre',
          title: title.trim() || undefined,
          lang,
          startedAt: outcome.startedAt,
          endedAt: outcome.endedAt,
          activeMs: outcome.activeMs,
          words: outcome.words,
          wpm: data.wpm,
        },
        probes: outcome.probes,
      })
      setSessionId(id)
    } catch {
      setSaveError(true)
    }
  }

  const heading = <h1 className="mx-auto max-w-prose text-3xl font-bold">{t('paste.title')}</h1>

  if (step === 'reading') {
    return (
      <div ref={root as React.RefObject<HTMLDivElement>} className="space-y-4">
        {heading}
        <ReadingView
          title={title.trim() || t('paste.untitled')}
          body={text}
          lang={lang}
          probeRange={PROBE_RANGE_PROGRAMA}
          probesEnabled={prefs.probesInFreeReading}
          onFinish={finish}
          now={now}
          allowPacer
        />
      </div>
    )
  }

  if (step === 'results' && results) {
    return (
      <div ref={root as React.RefObject<HTMLDivElement>} className="space-y-6">
        {heading}
        <ResultsCard data={results} saveError={saveError} />
        <RecallStep sessionId={sessionId} lang={lang} compareText={text} />
        <div className="mx-auto max-w-prose">
          <button
            type="button"
            onClick={() => {
              setText('')
              setTitle('')
              setSaveError(false)
              setStep('edit')
            }}
            className="rounded-md border border-line-strong px-5 py-2"
          >
            {t('paste.another')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <section ref={root} className="mx-auto max-w-prose space-y-4">
      <h1 className="text-3xl font-bold">{t('paste.title')}</h1>
      <p>{t('paste.help')}</p>
      <label className="block">
        <span className="mb-1 block font-medium">{t('paste.titleLabel')}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-line-strong p-2"
        />
      </label>
      <label className="block">
        <span className="mb-1 block font-medium">{t('paste.langLabel')}</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as (typeof LANGS)[number])}
          className="rounded border border-line-strong p-2"
        >
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {t(`lang.${l}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block font-medium">{t('paste.textLabel')}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="w-full rounded border border-line-strong p-2"
        />
      </label>
      <p className="text-sm text-muted">{tPlural('paste.words', words)}</p>
      <button
        type="button"
        disabled={words === 0}
        onClick={() => setStep('reading')}
        className="rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-disabled"
      >
        {t('paste.prepare')}
      </button>
    </section>
  )
}
