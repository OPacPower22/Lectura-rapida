import { countWords } from '../lib/text'
import { diagnosticTextFor, getPracticeText, getPracticeTexts } from '.'

describe('textos de práctica', () => {
  const texts = getPracticeTexts()

  it('hay al menos tres textos', () => {
    expect(texts.length).toBeGreaterThanOrEqual(3)
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

  it('busca por id', () => {
    expect(getPracticeText('diag-expositivo')?.kind).toBe('expositivo')
    expect(getPracticeText('no-existe')).toBeUndefined()
  })
})
