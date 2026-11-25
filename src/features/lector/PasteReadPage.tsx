import { useState } from 'react'
import { t } from '../../i18n'
import { PROBE_RANGE_PROGRAMA } from '../../lib/probes'
import { saveSession } from '../../lib/storage/repo'
import type { Clock } from '../../lib/stopwatch'
import { countWords } from '../../lib/text'
import { ResultsCard, type ResultsData } from '../diagnostico/ResultsCard'
import { computeResults } from '../diagnostico/results'
import { ReadingView, type ReadingOutcome } from './ReadingView'

const LANGS = ['es', 'en', 'fr', 'pt', 'it', 'de'] as const

export function PasteReadPage({ now }: { now?: Clock }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [lang, setLang] = useState<(typeof LANGS)[number]>('es')
  const [step, setStep] = useState<'edit' | 'reading' | 'results'>('edit')
  const [results, setResults] = useState<ResultsData | null>(null)
  const [saveError, setSaveError] = useState(false)

  const words = countWords(text, lang)

  async function finish(outcome: ReadingOutcome) {
    const data = computeResults(outcome)
    setResults(data)
    setStep('results')
    try {
      await saveSession({
        session: {
          kind: 'libre',
          lang,
          startedAt: outcome.startedAt,
          endedAt: outcome.endedAt,
          activeMs: outcome.activeMs,
          words: outcome.words,
          wpm: data.wpm,
        },
        probes: outcome.probes,
      })
    } catch {
      setSaveError(true)
    }
  }

  if (step === 'reading') {
    return (
      <ReadingView
        title={title.trim() || t('paste.untitled')}
        body={text}
        lang={lang}
        probeRange={PROBE_RANGE_PROGRAMA}
        onFinish={finish}
        now={now}
      />
    )
  }

  if (step === 'results' && results) {
    return (
      <div className="space-y-6">
        <ResultsCard data={results} saveError={saveError} />
        <div className="mx-auto max-w-prose">
          <button
            type="button"
            onClick={() => {
              setText('')
              setTitle('')
              setSaveError(false)
              setStep('edit')
            }}
            className="rounded-md border border-stone-300 px-5 py-2"
          >
            {t('paste.another')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-prose space-y-4">
      <h1 className="text-3xl font-bold">{t('paste.title')}</h1>
      <p>{t('paste.help')}</p>
      <label className="block">
        <span className="mb-1 block font-medium">{t('paste.titleLabel')}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-stone-300 p-2"
        />
      </label>
      <label className="block">
        <span className="mb-1 block font-medium">{t('paste.langLabel')}</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as (typeof LANGS)[number])}
          className="rounded border border-stone-300 p-2"
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
          className="w-full rounded border border-stone-300 p-2"
        />
      </label>
      <p className="text-sm text-stone-600">{t('paste.words', { count: words })}</p>
      <button
        type="button"
        disabled={words === 0}
        onClick={() => setStep('reading')}
        className="rounded-md bg-blue-700 px-5 py-2 font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        {t('paste.prepare')}
      </button>
    </section>
  )
}
