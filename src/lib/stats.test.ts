import type { AttentionSession, QuizResult, ReadingSession, TextKind } from './storage/db'
import type { SessionSummary } from './storage/repo'
import { dashboardStats, retentionSummary, weekKey, weeklySeries } from './stats'

let nextId = 1
function reading(at: Date, opts: { wpm: number; kind?: TextKind; correct?: number; total?: number; activeMin?: number; probes?: ('texto' | 'otra-cosa' | 'auto')[]; sessionKind?: ReadingSession['kind'] }): SessionSummary {
  const id = nextId++
  const startedAt = at.getTime()
  const activeMs = (opts.activeMin ?? 2) * 60000
  return {
    session: { id, kind: opts.sessionKind ?? 'practica', textKind: opts.kind, lang: 'es', startedAt, endedAt: startedAt + activeMs, activeMs, words: 400, wpm: opts.wpm },
    quiz: opts.total ? { id, sessionId: id, textId: 't', answers: [], correct: opts.correct ?? 0, total: opts.total, deferred: false, at: startedAt } : undefined,
    probes: (opts.probes ?? []).map((answer, i) => ({ id: i, sessionId: id, at: startedAt, answer })),
  }
}
const att = (at: Date, min: number): AttentionSession => ({ startedAt: at.getTime(), durationMs: min * 60000, plannedMinutes: min, returns: 0 })

function hasNaN(v: unknown): boolean {
  if (typeof v === 'number') return Number.isNaN(v)
  if (v && typeof v === 'object') return Object.values(v).some(hasNaN)
  return false
}

describe('weekKey', () => {
  it('devuelve el lunes de la semana en hora local', () => {
    expect(weekKey(new Date(2026, 10, 26, 15).getTime())).toBe('2026-11-23') // jueves
    expect(weekKey(new Date(2026, 10, 23, 0, 5).getTime())).toBe('2026-11-23') // lunes temprano
    expect(weekKey(new Date(2026, 10, 29, 23, 59).getTime())).toBe('2026-11-23') // domingo
  })
  it('cruza el cambio de año', () => {
    expect(weekKey(new Date(2027, 0, 1).getTime())).toBe('2026-12-28')
  })
})

describe('weeklySeries', () => {
  const w1 = new Date(2026, 10, 9, 10) // lunes 9 nov
  const w3 = new Date(2026, 10, 25, 10) // miércoles 25 nov
  const sessions = [
    reading(new Date(2026, 10, 9, 10), { wpm: 200, kind: 'expositivo', correct: 4, total: 5, probes: ['texto', 'otra-cosa'] }),
    reading(new Date(2026, 10, 10, 10), { wpm: 300, kind: 'expositivo', correct: 3, total: 5, probes: ['texto', 'texto', 'auto'] }),
    reading(new Date(2026, 10, 11, 10), { wpm: 260, kind: 'expositivo', correct: 5, total: 5 }),
    reading(new Date(2026, 10, 11, 12), { wpm: 900, kind: 'expositivo', correct: 1, total: 5 }), // hojeo
    reading(new Date(2026, 10, 12, 10), { wpm: 180, kind: 'denso', correct: 4, total: 5 }),
    reading(new Date(2026, 10, 25, 10), { wpm: 250, sessionKind: 'fisico', activeMin: 30 }), // sin cuestionario
  ]
  const attention = [att(new Date(2026, 10, 25, 9), 10)]
  const series = weeklySeries({ sessions, attention, quizzes: [] }, w1.getTime(), w3.getTime())

  it('una fila por semana, incluidas las vacías', () => {
    expect(series.map((s) => s.week)).toEqual(['2026-11-09', '2026-11-16', '2026-11-23'])
  })
  it('mediana de ppm por tipo sin contar el hojeo', () => {
    expect(series[0].ppm).toEqual({ narrativo: null, expositivo: 260, denso: 180 })
  })
  it('comprensión media, divagación agregada y minutos con atención', () => {
    expect(series[0].comprehension).toBeCloseTo((4 + 3 + 5 + 1 + 4) / 25)
    expect(series[0].wandering).toBeCloseTo(1 / 4)
    expect(series[0].minutes).toBe(10)
    expect(series[1]).toEqual({ week: '2026-11-16', ppm: { narrativo: null, expositivo: null, denso: null }, comprehension: null, wandering: null, minutes: 0 })
    expect(series[2].minutes).toBe(40)
  })
})

describe('retentionSummary', () => {
  const q = (delayDays: 1 | 7, correct: number): QuizResult => ({ sessionId: 1, textId: 't', answers: [], correct, total: 5, deferred: true, delayDays, at: 0 })
  it('media por plazo', () => {
    const r = retentionSummary([q(1, 4), q(1, 2), q(7, 3), { ...q(1, 5), deferred: false, delayDays: undefined }])
    expect(r.d1).toBeCloseTo(0.6)
    expect(r.d7).toBeCloseTo(0.6)
  })
  it('sin datos: null', () => expect(retentionSummary([])).toEqual({ d1: null, d7: null }))
})

describe('dashboardStats', () => {
  const now = new Date(2026, 10, 26, 18).getTime() // jueves
  it('sin datos no hay NaN', () => {
    const s = dashboardStats({ sessions: [], attention: [], quizzes: [] }, now)
    expect(hasNaN(s)).toBe(false)
    expect(s).toEqual({
      lastPpm: { narrativo: null, expositivo: null, denso: null },
      avgComprehension: null,
      retention: { d1: null, d7: null },
      wandering: null,
      practiceDays7: 0,
      minutesWeek: 0,
      ileSeries: [],
    })
  })

  it('calcula última ppm, días con práctica y minutos de la semana', () => {
    const sessions = [
      reading(new Date(2026, 10, 26, 9), { wpm: 240, kind: 'narrativo', correct: 4, total: 5, probes: ['otra-cosa', 'texto'] }),
      reading(new Date(2026, 10, 26, 10), { wpm: 260, kind: 'narrativo', correct: 5, total: 5 }),
      reading(new Date(2026, 10, 18, 10), { wpm: 200, kind: 'denso', correct: 3, total: 5 }), // fuera de los 7 días
      reading(new Date(2026, 10, 22, 10), { wpm: 180, kind: 'denso', correct: 2, total: 5 }), // domingo pasado
    ]
    const s = dashboardStats({ sessions, attention: [att(new Date(2026, 10, 24, 8), 5)], quizzes: [] }, now)
    expect(s.lastPpm).toEqual({ narrativo: 260, expositivo: null, denso: 180 })
    expect(s.practiceDays7).toBe(3) // 22, 24 y 26 (dos sesiones el mismo día cuentan una vez)
    expect(s.minutesWeek).toBe(9) // 2 + 2 + 5 (semana desde el lunes 23)
    expect(s.avgComprehension).toBeCloseTo((4 + 5 + 3 + 2) / 20)
    expect(s.wandering).toBeCloseTo(0.5)
    expect(s.ileSeries.map((p) => p.ile)).toEqual([120, 72, 192, 260])
  })
})
