import { countWords } from '../lib/text'
import { diagnosticTextFor, getPracticeText, getPracticeTexts } from '.'

describe('textos de práctica', () => {
  const texts = getPracticeTexts()

  it('hay 12 textos con roles válidos y 4 re-tests expositivos', () => {
    expect(texts).toHaveLength(12)
    for (const t of texts) expect(['diagnostico', 'retest', 'practica']).toContain(t.role)
    const retests = texts.filter((t) => t.role === 'retest')
    expect(retests.map((t) => t.id).sort()).toEqual(['retest-1', 'retest-2', 'retest-3', 'retest-4'])
    for (const t of retests) expect(t.kind).toBe('expositivo')
    expect(texts.filter((t) => t.role === 'diagnostico')).toHaveLength(3)
  })

  for (const text of getPracticeTexts()) {
    describe(text.id, () => {
      it('está en español y tiene fuente', () => {
        expect(text.lang).toBe('es')
        expect(text.source.length).toBeGreaterThan(0)
      })
      it('tiene entre 600 y 900 palabras', () => {
        const words = countWords(text.body, text.lang)
        expect(words).toBeGreaterThanOrEqual(600)
        expect(words).toBeLessThanOrEqual(900)
      })
      it('tiene 8-10 preguntas de los tres tipos, con ids únicos', () => {
        expect(text.questions.length).toBeGreaterThanOrEqual(8)
        expect(text.questions.length).toBeLessThanOrEqual(10)
        expect(new Set(text.questions.map((q) => q.type))).toEqual(
          new Set(['literal', 'inferencial', 'idea-central']),
        )
        expect(new Set(text.questions.map((q) => q.id)).size).toBe(text.questions.length)
      })
      it('cada pregunta tiene 4 opciones distintas y respuesta válida', () => {
        for (const q of text.questions) {
          expect(q.options).toHaveLength(4)
          expect(new Set(q.options).size).toBe(4)
          expect([0, 1, 2, 3]).toContain(q.answerIndex)
        }
      })
    })
  }

  it('hay un texto de diagnóstico por tipo', () => {
    for (const kind of ['narrativo', 'expositivo', 'denso'] as const) {
      expect(diagnosticTextFor(kind).kind).toBe(kind)
    }
  })

  it('las respuestas correctas ocupan todas las posiciones', () => {
    const positions = new Set(texts.flatMap((t) => t.questions.map((q) => q.answerIndex)))
    expect(positions).toEqual(new Set([0, 1, 2, 3]))
  })

  it('la opción más larga no delata la respuesta', () => {
    for (const text of texts) {
      const longestIsCorrect = text.questions.filter((q) => {
        const lengths = q.options.map((o) => o.length)
        const max = Math.max(...lengths)
        return lengths[q.answerIndex] === max && lengths.filter((l) => l === max).length === 1
      }).length
      expect(longestIsCorrect / text.questions.length).toBeLessThanOrEqual(0.4)
    }
  })

  it('ninguna posición concentra más de la mitad de las respuestas de un texto', () => {
    for (const text of texts) {
      const counts = [0, 0, 0, 0]
      for (const q of text.questions) counts[q.answerIndex]++
      expect(Math.max(...counts) / text.questions.length, text.id).toBeLessThanOrEqual(0.5)
    }
  })

  it('la opción más corta tampoco delata la respuesta', () => {
    for (const text of texts) {
      const shortestIsCorrect = text.questions.filter((q) => {
        const lengths = q.options.map((o) => o.length)
        const min = Math.min(...lengths)
        return lengths[q.answerIndex] === min && lengths.filter((l) => l === min).length === 1
      }).length
      expect(shortestIsCorrect / text.questions.length, text.id).toBeLessThanOrEqual(0.4)
    }
  })

  it('busca por id', () => {
    expect(getPracticeText('diag-expositivo')?.kind).toBe('expositivo')
    expect(getPracticeText('no-existe')).toBeUndefined()
  })
})
