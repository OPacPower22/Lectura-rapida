import { useState } from 'react'
import { Link } from 'react-router-dom'
import { diagnosticTextFor } from '../../content'
import type { TextKind } from '../../content/types'
import { t } from '../../i18n'
import { PROBE_RANGE_DIAGNOSTICO } from '../../lib/probes'
import { saveSession } from '../../lib/storage/repo'
import type { Clock } from '../../lib/stopwatch'
import { ReadingView, type ReadingOutcome } from '../lector/ReadingView'
import { Quiz } from './Quiz'
import { ResultsCard, type ResultsData } from './ResultsCard'
import { computeResults } from './results'

type Step = 'intro' | 'purpose' | 'reading' | 'quiz' | 'results'

const KINDS: TextKind[] = ['narrativo', 'expositivo', 'denso']

const primaryButton =
  'rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover'

export function DiagnosticPage({ now }: { now?: Clock }) {
  const [step, setStep] = useState<Step>('intro')
  const [kind, setKind] = useState<TextKind>('expositivo')
  const [purpose, setPurpose] = useState('')
  const [outcome, setOutcome] = useState<ReadingOutcome | null>(null)
  const [results, setResults] = useState<ResultsData | null>(null)
  const [saveError, setSaveError] = useState(false)

  const text = diagnosticTextFor(kind)

  async function submitQuiz(answers: number[]) {
    if (!outcome) return
    const correct = answers.filter((a, i) => a === text.questions[i].answerIndex).length
    const total = text.questions.length
    const data = computeResults(outcome, { correct, total })
    setResults(data)
    setStep('results')
    try {
      await saveSession({
        session: {
          kind: 'diagnostico',
          textId: text.id,
          purpose: purpose.trim() || undefined,
          textKind: text.kind,
          lang: text.lang,
          startedAt: outcome.startedAt,
          endedAt: outcome.endedAt,
          activeMs: outcome.activeMs,
          words: outcome.words,
          wpm: data.wpm,
        },
        probes: outcome.probes,
        quiz: { textId: text.id, answers, correct, total, deferred: false, at: Date.now() },
      })
    } catch {
      setSaveError(true)
    }
  }

  function restart() {
    setStep('intro')
    setPurpose('')
    setOutcome(null)
    setResults(null)
    setSaveError(false)
  }

  if (step === 'intro') {
    return (
      <section className="mx-auto max-w-prose space-y-4">
        <h1 className="text-3xl font-bold">{t('diag.title')}</h1>
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
        <button type="button" className={primaryButton} onClick={() => setStep('purpose')}>
          {t('diag.continue')}
        </button>
      </section>
    )
  }

  if (step === 'purpose') {
    return (
      <section className="mx-auto max-w-prose space-y-4">
        <h1 className="text-2xl font-semibold">{t('diag.purposeTitle')}</h1>
        <p className="text-xl font-medium">«{text.title}»</p>
        <p>{t('diag.purposeHelp')}</p>
        <label className="block">
          <span className="mb-1 block font-medium">{t('diag.purposeLabel')}</span>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={2}
            className="w-full rounded border border-line-strong p-2"
          />
        </label>
        <button type="button" className={primaryButton} onClick={() => setStep('reading')}>
          {t('diag.continue')}
        </button>
      </section>
    )
  }

  if (step === 'reading') {
    return (
      <ReadingView
        title={text.title}
        body={text.body}
        lang={text.lang}
        probeRange={PROBE_RANGE_DIAGNOSTICO}
        now={now}
        onFinish={(o) => {
          setOutcome(o)
          setStep('quiz')
        }}
      />
    )
  }

  if (step === 'quiz') {
    return <Quiz questions={text.questions} onSubmit={submitQuiz} />
  }

  return (
    <div className="space-y-6">
      {results && <ResultsCard data={results} saveError={saveError} purpose={purpose.trim() || undefined} />}
      <div className="mx-auto flex max-w-prose flex-wrap gap-3">
        <Link to="/progreso" className={primaryButton}>
          {t('diag.toProgress')}
        </Link>
        <button type="button" onClick={restart} className="rounded-md border border-line-strong px-5 py-2">
          {t('diag.again')}
        </button>
      </div>
    </div>
  )
}
