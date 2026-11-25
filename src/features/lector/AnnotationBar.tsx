import { useState } from 'react'
import { t } from '../../i18n'
import type { NoteKind } from '../../lib/storage/db'
import { CardForm } from '../retencion/CardForm'

type Mode = 'menu' | 'note' | 'glossary' | 'card'

interface Props {
  quote: string
  onHighlight(): void
  onNote(kind: Exclude<NoteKind, 'subrayado'>, text: string): void
  onGlossary(entry: { term: string; definition: string; translation?: string }): void
  onCard(front: string, back: string): void
  onCancel(): void
}

const action = 'rounded border border-line-strong bg-surface px-3 py-2 hover:bg-hover'
const primary = 'rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover'
const field = 'w-full rounded border border-line-strong bg-surface p-2'

/** Barra fija inferior para anotar la selección actual. */
export function AnnotationBar({ quote, onHighlight, onNote, onGlossary, onCard, onCancel }: Props) {
  const [mode, setMode] = useState<Mode>('menu')
  const [kind, setKind] = useState<Exclude<NoteKind, 'subrayado'>>('idea')
  const [text, setText] = useState('')
  const [term, setTerm] = useState(quote)
  const [definition, setDefinition] = useState('')
  const [translation, setTranslation] = useState('')

  return (
    <div role="region" aria-label={t('annot.region')} className="fixed inset-x-0 bottom-0 z-20 max-h-[70vh] overflow-auto border-t border-line bg-surface p-3 shadow-lg">
      <div className="mx-auto max-w-prose space-y-2">
        <p className="truncate text-sm text-muted">«{quote}»</p>
        {mode === 'menu' && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} onMouseDown={(e) => e.preventDefault()} onClick={onHighlight}>
              {t('annot.highlight')}
            </button>
            <button type="button" className={action} onMouseDown={(e) => e.preventDefault()} onClick={() => setMode('note')}>
              {t('annot.note')}
            </button>
            <button type="button" className={action} onMouseDown={(e) => e.preventDefault()} onClick={() => setMode('glossary')}>
              {t('annot.glossary')}
            </button>
            <button type="button" className={action} onMouseDown={(e) => e.preventDefault()} onClick={() => setMode('card')}>
              {t('annot.card')}
            </button>
            <button type="button" className={action} onClick={onCancel}>
              {t('annot.cancel')}
            </button>
          </div>
        )}
        {mode === 'card' && <CardForm initialBack={quote} onSave={onCard} onCancel={onCancel} />}
        {mode === 'note' && (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              onNote(kind, text.trim())
            }}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('annot.kind')}</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="rounded border border-line-strong bg-surface p-2">
                {(['cita', 'parafrasis', 'idea'] as const).map((k) => (
                  <option key={k} value={k}>
                    {t(`note.kind.${k}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('annot.text')}</span>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={field} autoFocus />
            </label>
            <div className="flex gap-2">
              <button type="submit" className={primary}>
                {t('annot.save')}
              </button>
              <button type="button" className={action} onClick={onCancel}>
                {t('annot.cancel')}
              </button>
            </div>
          </form>
        )}
        {mode === 'glossary' && (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              onGlossary({ term: term.trim(), definition: definition.trim(), translation: translation.trim() || undefined })
            }}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('annot.term')}</span>
              <input value={term} onChange={(e) => setTerm(e.target.value)} className={field} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('annot.definition')}</span>
              <input value={definition} onChange={(e) => setDefinition(e.target.value)} className={field} autoFocus />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t('annot.translation')}</span>
              <input value={translation} onChange={(e) => setTranslation(e.target.value)} className={field} />
            </label>
            <div className="flex gap-2">
              <button type="submit" className={primary} disabled={!term.trim()}>
                {t('annot.save')}
              </button>
              <button type="button" className={action} onClick={onCancel}>
                {t('annot.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
