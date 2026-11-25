import { newCardState, previewIntervals, review } from './srs'

const t0 = new Date('2026-01-01T10:00:00Z')

describe('srs', () => {
  it('programa la siguiente revisión en el futuro', () => {
    const card = review(newCardState(t0), 'good', t0)
    expect(card.due.getTime()).toBeGreaterThan(t0.getTime())
  })

  it('con el reloj atrasado no programa en el pasado', () => {
    const reviewed = review(newCardState(t0), 'good', t0)
    const back = new Date(t0.getTime() - 86400000)
    const again = review(reviewed, 'good', back)
    expect(again.due.getTime()).toBeGreaterThanOrEqual(reviewed.last_review!.getTime())
  })

  it('«otra vez» vuelve antes que «fácil»', () => {
    const base = review(newCardState(t0), 'good', t0)
    const later = new Date(base.due)
    expect(review(base, 'again', later).due.getTime()).toBeLessThan(review(base, 'easy', later).due.getTime())
  })

  it('describe los intervalos de cada botón', () => {
    const intervals = previewIntervals(newCardState(t0), t0)
    expect(Object.keys(intervals)).toEqual(['again', 'hard', 'good', 'easy'])
    for (const v of Object.values(intervals)) expect(v).toMatch(/\d+ (min|h|d|mes|meses|año|años)/)
  })
})
