import { t, tPlural } from '.'

describe('t', () => {
  it('devuelve el texto de una clave', () => {
    expect(t('app.title')).toBe('Lectura Rápida')
  })
  it('interpola parámetros', () => {
    expect(t('results.wpm', { wpm: 250 })).toBe('250 ppm')
  })
})

describe('tPlural', () => {
  it('elige singular o plural según el idioma', () => {
    expect(tPlural('review.done', 1)).toBe('Repaso completado: 1 ficha')
    expect(tPlural('review.done', 3)).toBe('Repaso completado: 3 fichas')
    expect(tPlural('notebook.count', 1)).toBe('1 nota')
    expect(tPlural('notebook.count', 0)).toBe('0 notas')
  })
  it('acepta otros parámetros', () => {
    expect(tPlural('attention.summary', 1, { minutes: 5 })).toBe('Sesión de 5 min · 1 regreso a la respiración')
  })
})
