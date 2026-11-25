import { useState } from 'react'
import { t } from '../../../i18n'
import { setSetting } from '../../../lib/storage/settings'
import { DoneButton, field } from './common'

/** Escribir preguntas antes de leer; se muestran durante la lectura del día. */
export function Questions({ day, count, onDone }: { day: number; count: number; onDone(): void }) {
  const [questions, setQuestions] = useState<string[]>(Array(count).fill(''))
  return (
    <div className="space-y-3">
      <p>{t('questions.intro', { count })}</p>
      {questions.map((v, i) => (
        <label key={i} className="block">
          <span className="mb-1 block text-sm font-medium">{t('questions.label', { n: i + 1 })}</span>
          <input value={v} onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? e.target.value : x)))} className={field} />
        </label>
      ))}
      <DoneButton
        disabled={questions.some((q) => !q.trim())}
        onClick={async () => {
          await setSetting(`program:questions:${day}`, questions.map((q) => q.trim()))
          onDone()
        }}
      />
    </div>
  )
}
