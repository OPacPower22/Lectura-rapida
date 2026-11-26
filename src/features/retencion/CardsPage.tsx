import { useEffect, useState } from 'react'
import { currentLang, t } from '../../i18n'
import type { StoredCard } from '../../lib/storage/db'
import { addCard, deleteCard, listCards, updateCard } from '../../lib/storage/cards'
import { CardForm } from './CardForm'

const dateFormat = new Intl.DateTimeFormat(currentLang(), { dateStyle: 'medium' })
const field = 'w-full rounded border border-line-strong bg-surface p-2'

function CardItem({ card, onChanged }: { card: StoredCard; onChanged(): void }) {
  const [front, setFront] = useState(card.front)
  const [back, setBack] = useState(card.back)
  const editable = card.kind === 'ficha'
  const dirty = front !== card.front || back !== card.back
  return (
    <li className="space-y-2 rounded-lg border border-line bg-surface p-4">
      <p className="text-xs text-muted">
        {t('cards.due', { date: dateFormat.format(card.fsrs.due) })}
        {!editable && ` · ${t('cards.fromGlossary')}`}
      </p>
      <label className="block">
        <span className="sr-only">{t('cards.front')}</span>
        <textarea aria-label={t('cards.front')} value={front} readOnly={!editable} onChange={(e) => setFront(e.target.value)} rows={2} className={field} />
      </label>
      <label className="block">
        <span className="sr-only">{t('cards.back')}</span>
        <textarea aria-label={t('cards.back')} value={back} readOnly={!editable} onChange={(e) => setBack(e.target.value)} rows={2} className={field} />
      </label>
      {editable && (
        <div className="flex gap-3 text-sm">
          {dirty && (
            <button
              type="button"
              className="rounded bg-accent px-3 py-1 text-on-accent"
              onClick={async () => {
                await updateCard(card.id!, { front: front.trim(), back: back.trim() })
                onChanged()
              }}
            >
              {t('annot.save')}
            </button>
          )}
          <button
            type="button"
            className="text-err-ink underline"
            onClick={async () => {
              if (!window.confirm(t('cards.confirmDelete'))) return
              await deleteCard(card.id!)
              onChanged()
            }}
          >
            {t('notes.delete')}
          </button>
        </div>
      )}
    </li>
  )
}

export function CardsPage() {
  const [cards, setCards] = useState<StoredCard[] | null>(null)
  const [adding, setAdding] = useState(false)
  const load = () =>
    listCards()
      .then(setCards)
      .catch(() => setCards([]))
  useEffect(() => {
    load()
  }, [])

  return (
    <section className="mx-auto max-w-prose space-y-4">
      <h1 className="text-3xl font-bold">{t('cards.title')}</h1>
      {adding ? (
        <CardForm
          onSave={async (front, back) => {
            await addCard({ kind: 'ficha', front, back, lang: currentLang() })
            setAdding(false)
            load()
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="rounded-md bg-accent px-4 py-2 text-on-accent">
          {t('cards.new')}
        </button>
      )}
      {cards?.length === 0 && <p>{t('cards.empty')}</p>}
      <ul className="space-y-3">
        {cards?.map((c) => (
          <CardItem key={c.id} card={c} onChanged={load} />
        ))}
      </ul>
    </section>
  )
}
