import { newCardState, previewIntervals, review } from './srs'
import { describeInterval } from './srs'

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

describe('describeInterval', () => {
  it('usa unidades y plurales del idioma', () => {
    expect(describeInterval(5 * 60000)).toBe('5 min')
    expect(describeInterval(3 * 3600000)).toBe('3 h')
    expect(describeInterval(4 * 86400000)).toBe('4 d')
    expect(describeInterval(31 * 86400000)).toBe('1 mes')
    expect(describeInterval(95 * 86400000)).toBe('3 meses')
    expect(describeInterval(370 * 86400000)).toBe('1 año')
    expect(describeInterval(800 * 86400000)).toBe('2 años')
  })
})
