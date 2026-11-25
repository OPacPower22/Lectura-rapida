import type { TextKind } from './storage/db'
import { listSessions } from './storage/repo'

export interface CompRecord {
  textKind: TextKind
  comp: number
  at: number
}

const MIN = 100
const MAX = 800

/**
 * Reglas de progresión del marcapasos (spec §5): con las dos lecturas más recientes del mismo tipo,
 * ambas < 70 % → −10 %; ambas ≥ 80 % → +5 %. Resultado entre 100 y 800, redondeado a 10.
 */
export function suggestPacerWpm(history: CompRecord[], kind: TextKind, current: number): number {
  const lastTwo = history
    .filter((h) => h.textKind === kind)
    .sort((a, b) => b.at - a.at)
    .slice(0, 2)
  let next = current
  if (lastTwo.length === 2) {
    if (lastTwo.every((h) => h.comp < 0.7)) next = current * 0.9
    else if (lastTwo.every((h) => h.comp >= 0.8)) next = current * 1.05
  }
  return Math.min(MAX, Math.max(MIN, Math.round(next / 10) * 10))
}

/** Comprensión objetiva de cada lectura con cuestionario inmediato. */
export async function comprehensionHistory(): Promise<CompRecord[]> {
  const sessions = await listSessions()
  return sessions
    .filter((s) => s.quiz && s.quiz.total > 0 && s.session.textKind)
    .map((s) => ({ textKind: s.session.textKind!, comp: s.quiz!.correct / s.quiz!.total, at: s.quiz!.at }))
}
