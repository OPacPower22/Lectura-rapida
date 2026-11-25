import { t } from '.'

describe('t', () => {
  it('devuelve el texto de una clave', () => {
    expect(t('app.title')).toBe('Lectura Rápida')
  })
  it('interpola parámetros', () => {
    expect(t('results.wpm', { wpm: 250 })).toBe('250 ppm')
  })
})
