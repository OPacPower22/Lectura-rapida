import { useState } from 'react'
import { t } from '../../i18n'
import type { Note } from '../../lib/storage/db'

interface Props {
  notes: Note[]
  onGoTo(note: Note): void
  /** Si se puede saltar a la nota ahora (p. ej. no a otro capítulo durante una sesión). */
  canGoTo?(note: Note): boolean
  onUpdate(id: number, text: string): void
  onDelete(id: number): void
}

export function NotesPanel({ notes, onGoTo, canGoTo = () => true, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')

  return (
    <details className="rounded-lg border border-line bg-surface p-4" open={notes.length > 0}>
      <summary className="cursor-pointer font-semibold">{t('notes.title', { count: notes.length })}</summary>
      {notes.length === 0 && <p className="mt-2 text-muted">{t('notes.empty')}</p>}
      <ul className="mt-3 space-y-3">
        {notes.map((note) => (
          <li key={note.id} className="border-l-4 border-accent pl-3">
            <p className="text-xs uppercase tracking-wide text-muted">
              {t(`note.kind.${note.kind}`)}
              {note.page !== undefined && ` · ${t('notes.page', { page: note.page })}`}
            </p>
            {note.quote && <blockquote className="italic">«{note.quote}»</blockquote>}
            {editing === note.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onUpdate(note.id!, draft.trim())
                  setEditing(null)
                }}
                className="mt-1 space-y-1"
              >
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className="w-full rounded border border-line-strong bg-surface p-2" aria-label={t('annot.text')} />
                <button type="submit" className="rounded bg-accent px-3 py-1 text-on-accent">
                  {t('annot.save')}
                </button>
              </form>
            ) : (
              note.text && <p className="mt-1">{note.text}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {note.anchor && canGoTo(note) && (
                <button type="button" className="text-accent-ink underline" onClick={() => onGoTo(note)}>
                  {t('notes.goTo')}
                </button>
              )}
              <button
                type="button"
                className="text-accent-ink underline"
                onClick={() => {
                  setDraft(note.text)
                  setEditing(note.id!)
                }}
              >
                {t('notes.edit')}
              </button>
              <button type="button" className="text-err-ink underline" onClick={() => onDelete(note.id!)}>
                {t('notes.delete')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </details>
  )
}
