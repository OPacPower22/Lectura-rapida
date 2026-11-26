import { useState, type ReactNode } from 'react'
import type { PracticeText } from '../../content/types'
import { t } from '../../i18n'
import { PROBE_RANGE_DIAGNOSTICO, PROBE_RANGE_PROGRAMA } from '../../lib/probes'
import { saveSession } from '../../lib/storage/repo'
import type { Clock } from '../../lib/stopwatch'
import { LeaveGuard } from '../lector/LeaveGuard'
import { ReadingView, type ReadingOutcome } from '../lector/ReadingView'
import { Quiz } from './Quiz'
import { RecallStep } from './RecallStep'
import { ResultsCard, type ResultsData } from './ResultsCard'
import { computeResults } from './results'

type Step = 'purpose' | 'reading' | 'quiz' | 'results'

export type TestRole = 'diagnostico' | 'retest' | 'practica'

interface Props {
  text: PracticeText
  role: TestRole
  /** Marcapasos sugerido (solo práctica con marcapasos). */
  pacerWpm?: number
  now?: Clock
  /** Preguntas propias escritas antes de leer (se muestran durante la lectura). */
  ownQuestions?: string[]
  onDone?(r: { sessionId?: number; comp: number }): void
  footer?: ReactNode
}

const primary = 'rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:bg-disabled'

/** Lectura medida de un texto de la app: propósito → lectura → cuestionario → resultados → recuerdo libre. */
export function TextTestFlow({ text, role, pacerWpm, now, ownQuestions, onDone, footer }: Props) {
  const [step, setStep] = useState<Step>('purpose')
  const [purpose, setPurpose] = useState('')
  const [outcome, setOutcome] = useState<ReadingOutcome | null>(null)
  const [results, setResults] = useState<ResultsData | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [sessionId, setSessionId] = useState<number | undefined>()
  const [comp, setComp] = useState(0)

  async function submitQuiz(answers: number[]) {
    if (!outcome) return
    const correct = answers.filter((a, i) => a === text.questions[i].answerIndex).length
    const total = text.questions.length
    const data = computeResults(outcome, { correct, total })
    setResults(data)
    setComp(correct / total)
    setStep('results')
    try {
      const id = await saveSession({
        session: {
          kind: role,
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
      setSessionId(id)
    } catch {
      setSaveError(true)
    }
  }

  if (step === 'purpose') {
    return (
      <section className="mx-auto max-w-prose space-y-4">
        <h2 className="text-2xl font-semibold">{t('diag.purposeTitle')}</h2>
        <p className="text-xl font-medium">«{text.title}»</p>
        <p>{t('diag.purposeHelp')}</p>
        <label className="block">
          <span className="mb-1 block font-medium">{t('diag.purposeLabel')}</span>
          <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} className="w-full rounded border border-line-strong bg-surface p-2" />
        </label>
        <button type="button" className={primary} onClick={() => setStep('reading')}>
          {t('diag.continue')}
        </button>
      </section>
    )
  }

  if (step === 'reading') {
    return (
      <div className="space-y-4">
        {ownQuestions && ownQuestions.length > 0 && (
          <ul className="mx-auto max-w-prose list-disc rounded border border-line bg-accent-soft py-2 pl-8 pr-3 text-accent-ink">
            {ownQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        )}
        {pacerWpm !== undefined && <p className="mx-auto max-w-prose text-sm text-muted">{t('flow.pacerSuggested', { wpm: pacerWpm })}</p>}
        <ReadingView
          title={text.title}
          body={text.body}
          lang={text.lang}
          probeRange={role === 'practica' ? PROBE_RANGE_PROGRAMA : PROBE_RANGE_DIAGNOSTICO}
          now={now}
          allowPacer={role === 'practica'}
          initialPacerWpm={pacerWpm}
          onFinish={(o) => {
            setOutcome(o)
            setStep('quiz')
          }}
        />
      </div>
    )
  }

  if (step === 'quiz') {
    return (
      <>
        <LeaveGuard active />
        <Quiz questions={text.questions} onSubmit={submitQuiz} />
      </>
    )
  }

  return (
    <div className="space-y-6">
      {results && <ResultsCard data={results} saveError={saveError} purpose={purpose.trim() || undefined} />}
      <RecallStep sessionId={sessionId} lang={text.lang} compareText={text.body} questions={ownQuestions} />
      {footer}
      {onDone && (
        <div className="mx-auto max-w-prose">
          <button
            type="button"
            className={primary}
            onClick={async () => {
              onDone({ sessionId, comp })
            }}
          >
            {t('flow.continue')}
          </button>
        </div>
      )}
    </div>
  )
}
