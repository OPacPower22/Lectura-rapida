import { estimateWordsPerPage, physicalWords } from './physical'

describe('libro físico', () => {
  it('estima palabras por página con el promedio de 3 líneas', () => {
    expect(estimateWordsPerPage([10, 12, 11], 30)).toBe(330)
    expect(estimateWordsPerPage([9, 10, 10], 28)).toBe(271)
  })
  it('cuenta páginas leídas incluyendo la inicial y la final', () => {
    expect(physicalWords(10, 19, 300)).toBe(3000)
    expect(physicalWords(5, 5, 250)).toBe(250)
  })
  it('rechaza una página final menor que la inicial', () => {
    expect(() => physicalWords(20, 19, 300)).toThrow(RangeError)
  })
})
