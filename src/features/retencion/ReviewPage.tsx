import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../i18n'
import type { StoredCard } from '../../lib/storage/db'
import { dueCards, gradeCard, nextDue } from '../../lib/storage/cards'
import { GRADES, previewIntervals, type Grade } from '../../lib/srs'

const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' })

/** Repaso de fichas vencidas. `embedded` lo usa el programa (sin título ni enlaces). */
export function ReviewPage({ embedded, onFinished }: { embedded?: boolean; onFinished?(count: number): void }) {
  const [queue, setQueue] = useState<StoredCard[] | null>(null)
  const [shown, setShown] = useState(false)
  const [intervals, setIntervals] = useState<Record<Grade, string> | null>(null)
  const [reviewed, setReviewed] = useState(0)
  const [next, setNext] = useState<Date | undefined>()

  useEffect(() => {
    dueCards(new Date())
      .then(setQueue)
      .catch(() => setQueue([]))
  }, [])

  const current = queue?.[0]

  const show = useCallback(() => {
    if (!current) return
    setIntervals(previewIntervals(current.fsrs, new Date()))
    setShown(true)
  }, [current])

  useEffect(() => {
    if (queue && queue.length === 0) {
      nextDue().then(setNext).catch(() => {})
      onFinished?.(reviewed)
    }
  }, [queue, reviewed, onFinished])

  const grade = useCallback(
    async (g: Grade) => {
      if (!current) return
      await gradeCard(current.id!, g, new Date())
      setShown(false)
      setReviewed((n) => n + 1)
      setQueue((q) => (q ? q.slice(1) : q))
    },
    [current],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current || (e.target as HTMLElement)?.closest?.('input, textarea, select')) return
      if (e.key === ' ' && !shown) {
        e.preventDefault()
        show()
      } else if (shown && ['1', '2', '3', '4'].includes(e.key)) {
        grade(GRADES[Number(e.key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, shown, grade, show])

  if (queue === null) return null

  return (
    <section className="mx-auto max-w-prose space-y-4">
      {!embedded && <h1 className="text-3xl font-bold">{t('review.title')}</h1>}
      {!current ? (
        <div className="space-y-2">
          <p className="text-lg">{reviewed > 0 ? t('review.done', { count: reviewed }) : t('review.nothingDue')}</p>
          {next && <p className="text-muted">{t('review.next', { date: dateFormat.format(next) })}</p>}
          {!embedded && (
            <Link to="/fichas" className="text-accent-ink underline">
              {t('review.manage')}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {t('review.intro')} {t('review.remaining', { count: queue.length })}
          </p>
          <article className="space-y-4 rounded-lg border border-line bg-surface p-6" lang={current.lang}>
            <p className="whitespace-pre-line text-xl font-medium">{current.front}</p>
            {shown && <p className="whitespace-pre-line border-t border-line pt-4">{current.back}</p>}
          </article>
          {!shown ? (
            <button type="button" onClick={show} className="rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover">
              {t('review.show')}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADES.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => grade(g)}
                  className="rounded-md border border-line-strong px-3 py-2 hover:bg-hover"
                >
                  <span className="block font-medium">
                    {i + 1}. {t(`review.grade.${g}`)}
                  </span>
                  <span className="block text-sm text-muted">{intervals?.[g]}</span>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted">{t('review.keys')}</p>
        </div>
      )}
    </section>
  )
}
