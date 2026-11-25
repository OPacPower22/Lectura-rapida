import { useState } from 'react'
import { t } from '../../i18n'

interface Props {
  initialFront?: string
  initialBack?: string
  onSave(front: string, back: string): void
  onCancel?(): void
}

const field = 'w-full rounded border border-line-strong bg-surface p-2'

export function CardForm({ initialFront = '', initialBack = '', onSave, onCancel }: Props) {
  const [front, setFront] = useState(initialFront)
  const [back, setBack] = useState(initialBack)
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (front.trim() && back.trim()) onSave(front.trim(), back.trim())
      }}
    >
      <p className="text-sm text-muted">{t('cards.help')}</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('cards.front')}</span>
        <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} className={field} autoFocus />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('cards.back')}</span>
        <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={3} className={field} />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={!front.trim() || !back.trim()} className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:bg-disabled">
          {t('annot.save')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded border border-line-strong px-4 py-2">
            {t('annot.cancel')}
          </button>
        )}
      </div>
    </form>
  )
}
