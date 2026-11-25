import { db } from './storage/db'
import { saveSession } from './storage/repo'
import { baseWpm, comprehensionHistory, suggestPacerWpm } from './progression'

describe('suggestPacerWpm', () => {
  it('baja un 10 % con dos lecturas por debajo del 70 %', () => {
    expect(suggestPacerWpm([{ textKind: 'expositivo', comp: 0.6, at: 1 }, { textKind: 'expositivo', comp: 0.5, at: 2 }], 'expositivo', 300)).toBe(270)
  })
  it('sube un 5 % con dos lecturas de 80 % o más (redondeo a 10)', () => {
    expect(suggestPacerWpm([{ textKind: 'expositivo', comp: 0.9, at: 1 }, { textKind: 'expositivo', comp: 0.8, at: 2 }], 'expositivo', 300)).toBe(320)
  })
  it('sin historial suficiente del mismo tipo no cambia', () => {
    expect(suggestPacerWpm([{ textKind: 'denso', comp: 0.9, at: 1 }], 'denso', 300)).toBe(300)
    expect(suggestPacerWpm([{ textKind: 'narrativo', comp: 0.9, at: 1 }, { textKind: 'denso', comp: 0.9, at: 2 }], 'denso', 300)).toBe(300)
  })
  it('se limita a 100-800', () => {
    expect(suggestPacerWpm([{ textKind: 'narrativo', comp: 0.5, at: 1 }, { textKind: 'narrativo', comp: 0.5, at: 2 }], 'narrativo', 105)).toBe(100)
    expect(suggestPacerWpm([{ textKind: 'narrativo', comp: 0.9, at: 1 }, { textKind: 'narrativo', comp: 0.9, at: 2 }], 'narrativo', 790)).toBe(800)
  })
  it('usa las dos más recientes', () => {
    const h = [
      { textKind: 'expositivo' as const, comp: 0.9, at: 1 },
      { textKind: 'expositivo' as const, comp: 0.5, at: 3 },
      { textKind: 'expositivo' as const, comp: 0.6, at: 2 },
    ]
    expect(suggestPacerWpm(h, 'expositivo', 300)).toBe(270)
  })
})

describe('comprehensionHistory', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })
  it('toma solo cuestionarios inmediatos con tipo de texto', async () => {
    const id = await saveSession({
      session: { kind: 'diagnostico', textId: 'diag-denso', textKind: 'denso', lang: 'es', startedAt: 1, endedAt: 2, activeMs: 60000, words: 700, wpm: 700 },
      probes: [],
      quiz: { textId: 'diag-denso', answers: [], correct: 6, total: 9, deferred: false, at: 10 },
    })
    await db.quizResults.add({ sessionId: id, textId: 'diag-denso', answers: [], correct: 1, total: 5, deferred: true, delayDays: 1, at: 20 })
    expect(await comprehensionHistory()).toEqual([{ textKind: 'denso', comp: 6 / 9, at: 10 }])
  })

  it('una relectura del mismo texto no cuenta para la progresión', async () => {
    for (const [at, correct] of [[10, 5], [20, 9]] as const) {
      await saveSession({
        session: { kind: 'practica', textId: 'practica-3', textKind: 'denso', lang: 'es', startedAt: at, endedAt: at + 1, activeMs: 60000, words: 600, wpm: 600 },
        probes: [],
        quiz: { textId: 'practica-3', answers: [], correct, total: 9, deferred: false, at },
      })
    }
    expect(await comprehensionHistory()).toEqual([{ textKind: 'denso', comp: 5 / 9, at: 10 }])
  })

  it('la velocidad base ignora las relecturas', async () => {
    const read = (textId: string, at: number, wpm: number) =>
      saveSession({
        session: { kind: 'practica', textId, textKind: 'denso', lang: 'es', startedAt: at, endedAt: at + 1, activeMs: 60000, words: wpm, wpm },
        probes: [],
        quiz: { textId, answers: [], correct: 5, total: 9, deferred: false, at },
      })
    await read('practica-3', 10, 200)
    await read('diag-denso', 20, 220)
    await read('practica-3', 30, 400) // relectura: no cuenta
    expect(await baseWpm('denso')).toBe(220)
    expect(await baseWpm('narrativo')).toBe(250)
  })
})
