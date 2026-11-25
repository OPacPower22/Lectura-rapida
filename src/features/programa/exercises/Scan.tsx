import { useState } from 'react'
import { getPracticeText } from '../../../content'
import { t } from '../../../i18n'
import { splitParagraphs } from '../../../lib/text'
import { Quiz } from '../../diagnostico/Quiz'
import { DoneButton, primary } from './common'
import { scanQuestions } from './scanQuestions'


/** Escaneo: ver las preguntas, luego buscar las respuestas en el texto con cronómetro. */
export function Scan({ textId, onDone }: { textId: string; onDone(): void }) {
  const text = getPracticeText(textId)!
  const questions = scanQuestions(text)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [result, setResult] = useState<{ correct: number; seconds: number } | null>(null)

  if (result) {
    return (
      <div className="space-y-3">
        <p className="text-lg font-medium">{t('scan.result', { correct: result.correct, total: questions.length, seconds: result.seconds })}</p>
        <DoneButton onClick={onDone} />
      </div>
    )
  }
  if (startedAt === null) {
    return (
      <div className="space-y-3">
        <p>{t('scan.intro')}</p>
        <ol className="list-decimal space-y-1 pl-6">
          {questions.map((q) => (
            <li key={q.id}>{q.prompt}</li>
          ))}
        </ol>
        <button type="button" className={primary} onClick={() => setStartedAt(Date.now())}>
          {t('scan.start')}
        </button>
      </div>
    )
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article lang={text.lang} className="max-h-[60vh] space-y-3 overflow-auto rounded border border-line p-3 leading-relaxed">
        <h3 className="text-lg font-semibold">{text.title}</h3>
        {splitParagraphs(text.body).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>
      <Quiz
        questions={questions}
        onSubmit={(answers) =>
          setResult({
            correct: answers.filter((a, i) => a === questions[i].answerIndex).length,
            seconds: Math.round((Date.now() - startedAt) / 1000),
          })
        }
      />
    </div>
  )
}
