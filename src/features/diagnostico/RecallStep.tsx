import { useState } from 'react'
import { t } from '../../i18n'
import { addCard } from '../../lib/storage/cards'
import { updateSessionRecall, updateSessionRecallGrade } from '../../lib/storage/repo'
import { splitParagraphs } from '../../lib/text'
import { CardForm } from '../retencion/CardForm'

type Grade = 'alto' | 'medio' | 'bajo'

/**
 * Recuerdo libre tras leer: escribir sin mirar, comparar con el texto y autoevaluarse
 * (spec §7.6; el resultado se guarda como autoevaluado). Ficha opcional.
 */
export function RecallStep({ sessionId, lang, compareText, questions }: { sessionId?: number; lang: string; compareText?: string; questions?: string[] }) {
  const [recall, setRecall] = useState('')
  const [comparing, setComparing] = useState(false)
  const [grade, setGrade] = useState<Grade | null>(null)
  const [cardOpen, setCardOpen] = useState(false)
  const [cardSaved, setCardSaved] = useState(false)
  const canSave = !!recall.trim() && sessionId !== undefined

  return (
    <section className="mx-auto max-w-prose space-y-3 rounded-lg border border-line bg-surface p-4">
      <h2 className="text-xl font-semibold">{t('recall.title')}</h2>
      <p className="text-sm text-muted">{t('recall.help')}</p>
      {questions && questions.length > 0 && (
        <div className="rounded border border-line bg-accent-soft p-3 text-accent-ink">
          <p className="font-medium">{t('recall.questions')}</p>
          <ul className="list-disc pl-6">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
      <label className="block">
        <span className="mb-1 block font-medium">{t('recall.label')}</span>
        <textarea value={recall} onChange={(e) => setRecall(e.target.value)} rows={4} readOnly={comparing} className="w-full rounded border border-line-strong bg-surface p-2" />
      </label>
      {!comparing && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-line-strong px-4 py-2 disabled:opacity-50"
            disabled={!canSave}
            onClick={async () => {
              await updateSessionRecall(sessionId!, recall.trim())
              setComparing(true)
            }}
          >
            {compareText ? t('recall.compare') : t('recall.save')}
          </button>
          <button type="button" className="rounded-md border border-line-strong px-4 py-2" onClick={() => setCardOpen((o) => !o)}>
            {t('recall.card')}
          </button>
        </div>
      )}
      {comparing && !compareText && <p role="status">{t('recall.saved')}</p>}
      {comparing && compareText && (
        <div className="space-y-3">
          <p className="font-medium">{t('recall.compareHelp')}</p>
          <div lang={lang} className="max-h-64 space-y-2 overflow-auto rounded border border-line p-3 text-sm leading-relaxed">
            {splitParagraphs(compareText).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {grade ? (
            <p role="status">{t('recall.selfAssessed')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(['alto', 'medio', 'bajo'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  className="rounded-md border border-line-strong px-4 py-2"
                  onClick={async () => {
                    await updateSessionRecallGrade(sessionId!, g)
                    setGrade(g)
                  }}
                >
                  {t(`recall.grade.${g}`)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {cardOpen && (
        <CardForm
          onSave={async (front, back) => {
            await addCard({ kind: 'ficha', front, back, lang })
            setCardOpen(false)
            setCardSaved(true)
          }}
          onCancel={() => setCardOpen(false)}
        />
      )}
      {cardSaved && <p role="status">{t('recall.cardSaved')}</p>}
    </section>
  )
}
