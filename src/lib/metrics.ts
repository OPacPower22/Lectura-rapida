/** Tiempo activo mínimo para considerar válida una medición de velocidad. */
export const MIN_ACTIVE_MS = 5000

export type ProbeAnswer = 'texto' | 'otra-cosa' | 'no-se' | 'auto'

export function computeWpm(words: number, activeMs: number): number | null {
  if (words <= 0 || activeMs < MIN_ACTIVE_MS) return null
  return Math.round(words / (activeMs / 60000))
}

export function comprehension(correct: number, total: number): number {
  if (total <= 0) throw new RangeError('total debe ser mayor que 0')
  return correct / total
}

/** Índice de Lectura Efectiva = ppm × comprensión (0-1). */
export function ile(wpm: number, comp: number): number {
  return Math.round(wpm * comp)
}

export function classifyReading(wpm: number, comp: number): 'lectura' | 'hojeo' {
  return wpm > 600 && comp < 0.6 ? 'hojeo' : 'lectura'
}

/** Proporción de sondeos respondidos fuera del texto; ignora los "me distraje" espontáneos. */
export function mindWanderingRate(answers: ProbeAnswer[]): number | null {
  const probed = answers.filter((a) => a !== 'auto')
  if (probed.length === 0) return null
  return probed.filter((a) => a !== 'texto').length / probed.length
}

export function selfCaughtPer10Min(autoCount: number, activeMs: number): number | null {
  if (activeMs < MIN_ACTIVE_MS) return null
  return autoCount / (activeMs / 600000)
}
