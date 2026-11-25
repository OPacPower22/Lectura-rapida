import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade as FsrsGrade } from 'ts-fsrs'

export type Grade = 'again' | 'hard' | 'good' | 'easy'
export const GRADES: Grade[] = ['again', 'hard', 'good', 'easy']

const RATINGS: Record<Grade, FsrsGrade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }))

export function newCardState(now: Date): Card {
  return createEmptyCard(now)
}

/** Fecha de revisión efectiva: nunca anterior a la última revisión (reloj atrasado). */
function effectiveNow(card: Card, now: Date): Date {
  const last = card.last_review ? new Date(card.last_review) : null
  return last && now < last ? last : now
}

export function review(card: Card, grade: Grade, now: Date): Card {
  return scheduler.next(card, effectiveNow(card, now), RATINGS[grade]).card
}

function describe(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60000))
  if (min < 60) return `${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} d`
  const months = Math.round(d / 30)
  if (months < 12) return months === 1 ? '1 mes' : `${months} meses`
  const years = Math.round(d / 365)
  return years === 1 ? '1 año' : `${years} años`
}

/** Tiempo hasta la próxima revisión para cada calificación (texto para los botones). */
export function previewIntervals(card: Card, now: Date): Record<Grade, string> {
  const at = effectiveNow(card, now)
  const preview = scheduler.repeat(card, at)
  return Object.fromEntries(
    GRADES.map((g) => [g, describe(new Date(preview[RATINGS[g]].card.due).getTime() - at.getTime())]),
  ) as Record<Grade, string>
}
