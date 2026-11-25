import {
  classifyReading,
  comprehension,
  computeWpm,
  ile,
  mindWanderingRate,
  selfCaughtPer10Min,
} from '../../lib/metrics'
import type { ReadingOutcome } from '../lector/ReadingView'
import type { ResultsData } from './ResultsCard'

/** Calcula los resultados de una lectura; `quiz` solo existe con comprensión objetiva. */
export function computeResults(outcome: ReadingOutcome, quiz?: { correct: number; total: number }): ResultsData {
  const wpm = computeWpm(outcome.words, outcome.activeMs)
  const comp = quiz ? comprehension(quiz.correct, quiz.total) : null
  const answers = outcome.probes.map((p) => p.answer)
  return {
    wpm,
    comp,
    ileValue: wpm !== null && comp !== null ? ile(wpm, comp) : null,
    label: wpm !== null && comp !== null ? classifyReading(wpm, comp) : null,
    wanderingRate: mindWanderingRate(answers),
    selfCaught: selfCaughtPer10Min(answers.filter((a) => a === 'auto').length, outcome.activeMs),
  }
}
