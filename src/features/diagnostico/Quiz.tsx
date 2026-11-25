import { useState } from 'react'
import type { Question } from '../../content/types'
import { t } from '../../i18n'

export function Quiz({ questions, onSubmit }: { questions: Question[]; onSubmit: (answers: number[]) => void | Promise<void> }) {
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => questions.map(() => undefined))
  const complete = answers.every((a) => a !== undefined)
  const [submitting, setSubmitting] = useState(false)

  return (
    <form
      className="mx-auto max-w-prose space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!complete || submitting) return
        setSubmitting(true)
        Promise.resolve(onSubmit(answers as number[])).finally(() => setSubmitting(false))
      }}
    >
      <h2 className="text-2xl font-semibold">{t('quiz.title')}</h2>
      {questions.map((q, qi) => (
        <fieldset key={q.id} className="space-y-2">
          <legend className="mb-2 font-medium">
            {qi + 1}. {q.prompt}
          </legend>
          {q.options.map((option, oi) => (
            <label key={oi} className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 hover:bg-hover">
              <input
                type="radio"
                name={q.id}
                value={oi}
                checked={answers[qi] === oi}
                onChange={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                className="mt-1"
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <button
        type="submit"
        disabled={!complete || submitting}
        className="rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-disabled"
      >
        {t('quiz.submit')}
      </button>
    </form>
  )
}
