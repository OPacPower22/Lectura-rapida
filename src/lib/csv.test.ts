import type { SessionSummary } from './storage/repo'
import { sessionsToCsv } from './csv'

const base: SessionSummary = {
  session: { id: 1, kind: 'practica', textId: 'practica-1', title: 'Hola, "mundo"', textKind: 'expositivo', lang: 'es', startedAt: new Date(2026, 10, 26, 9, 5).getTime(), endedAt: 0, activeMs: 150000, words: 500, wpm: 200, pages: { from: 3, to: 9 } },
  quiz: { sessionId: 1, textId: 'practica-1', answers: [], correct: 4, total: 5, deferred: false, at: 0 },
  probes: [
    { sessionId: 1, at: 0, answer: 'texto' },
    { sessionId: 1, at: 0, answer: 'otra-cosa' },
  ],
}

describe('sessionsToCsv', () => {
  const csv = sessionsToCsv([base, { session: { ...base.session, id: 2, title: undefined, textKind: undefined, pages: undefined, wpm: null }, probes: [] }])
  const lines = csv.slice(1).split('\r\n')

  it('empieza con BOM UTF-8 y usa CRLF', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(lines[0]).toBe('fecha,tipo,titulo,idioma,tipo_texto,ppm,comprension,ile,divagacion,minutos,paginas')
  })
  it('una fila por sesión con comas y comillas escapadas', () => {
    expect(lines).toHaveLength(3)
    expect(lines[1]).toBe('2026-11-26 09:05,practica,"Hola, ""mundo""",es,expositivo,200,80,160,50,3,3-9')
  })
  it('deja vacíos los datos que no existen', () => {
    expect(lines[2]).toBe('2026-11-26 09:05,practica,practica-1,es,,,,,,3,')
  })
  it('protege contra fórmulas en hojas de cálculo', () => {
    const evil = sessionsToCsv([{ ...base, session: { ...base.session, title: '=HYPERLINK("x")' } }])
    expect(evil).toContain(`"'=HYPERLINK(""x"")"`)
  })
})
