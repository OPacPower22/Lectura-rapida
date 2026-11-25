import {
  classifyReading,
  comprehension,
  computeWpm,
  ile,
  mindWanderingRate,
  selfCaughtPer10Min,
} from './metrics'

describe('computeWpm', () => {
  it('calcula palabras por minuto redondeadas', () => {
    expect(computeWpm(600, 180000)).toBe(200)
    expect(computeWpm(250, 60000)).toBe(250)
  })
  it('devuelve null si el tiempo es demasiado corto', () => {
    expect(computeWpm(100, 4999)).toBeNull()
  })
  it('devuelve null si no hay palabras', () => {
    expect(computeWpm(0, 60000)).toBeNull()
  })
})

describe('comprehension', () => {
  it('devuelve la proporción de aciertos', () => {
    expect(comprehension(7, 10)).toBe(0.7)
  })
  it('rechaza un total de cero', () => {
    expect(() => comprehension(1, 0)).toThrow(RangeError)
  })
})

describe('ile', () => {
  it('multiplica ppm por comprensión y redondea', () => {
    expect(ile(300, 0.8)).toBe(240)
  })
})

describe('classifyReading', () => {
  it('marca hojeo con ppm > 600 y comprensión < 60 %', () => {
    expect(classifyReading(650, 0.5)).toBe('hojeo')
  })
  it('es lectura en los límites', () => {
    expect(classifyReading(650, 0.6)).toBe('lectura')
    expect(classifyReading(600, 0.3)).toBe('lectura')
  })
})

describe('mindWanderingRate', () => {
  it('excluye los "me distraje" espontáneos', () => {
    expect(mindWanderingRate(['texto', 'otra-cosa', 'no-se', 'auto'])).toBeCloseTo(2 / 3)
  })
  it('devuelve null sin respuestas a sondeos', () => {
    expect(mindWanderingRate(['auto'])).toBeNull()
  })
})

describe('selfCaughtPer10Min', () => {
  it('normaliza a 10 minutos', () => {
    expect(selfCaughtPer10Min(2, 600000)).toBe(2)
    expect(selfCaughtPer10Min(1, 300000)).toBe(2)
  })
  it('devuelve null si el tiempo es demasiado corto', () => {
    expect(selfCaughtPer10Min(1, 1000)).toBeNull()
  })
})
