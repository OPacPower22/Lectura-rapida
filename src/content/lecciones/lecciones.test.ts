import { countWords } from '../../lib/text'
import { getLesson, getLessons } from '.'

describe('lecciones del programa', () => {
  it('hay 28, una por día', () => {
    expect(getLessons().map((l) => l.day)).toEqual(Array.from({ length: 28 }, (_, i) => i + 1))
  })

  for (const lesson of getLessons()) {
    it(`día ${lesson.day}: título, extensión de 3 minutos y fuentes`, () => {
      expect(lesson.title.length).toBeGreaterThan(3)
      const words = countWords(lesson.body, 'es')
      expect(words).toBeGreaterThanOrEqual(250)
      expect(words).toBeLessThanOrEqual(450)
      expect(lesson.body).toContain('**Fuentes:**')
      expect(lesson.body).not.toMatch(/^# /m)
    })
  }

  it('getLesson devuelve la del día', () => {
    expect(getLesson(2).day).toBe(2)
  })
})
