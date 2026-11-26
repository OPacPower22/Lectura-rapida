import { classifyReading, ile } from './metrics'
import type { AttentionSession, QuizResult, TextKind } from './storage/db'
import type { SessionSummary } from './storage/repo'

export const TEXT_KINDS: TextKind[] = ['narrativo', 'expositivo', 'denso']

export interface StatsInput {
  sessions: SessionSummary[]
  attention: AttentionSession[]
  /** Todos los cuestionarios, incluidos los diferidos (retención). */
  quizzes: QuizResult[]
}

export interface WeekRow {
  week: string
  ppm: Record<TextKind, number | null>
  comprehension: number | null
  wandering: number | null
  minutes: number
}

export interface DashboardStats {
  lastPpm: Record<TextKind, number | null>
  avgComprehension: number | null
  retention: { d1: number | null; d7: number | null }
  wandering: number | null
  practiceDays7: number
  minutesWeek: number
  ileSeries: { at: number; ile: number }[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function mondayOf(ts: number): Date {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

/** Lunes de la semana (hora local) en formato AAAA-MM-DD. */
export function weekKey(ts: number): string {
  return isoDay(mondayOf(ts))
}

function median(xs: number[]): number | null {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}

const comp = (s: SessionSummary) => (s.quiz && s.quiz.total > 0 ? s.quiz.correct / s.quiz.total : null)

/** Lecturas con cuestionario inmediato, en orden cronológico. */
function quizzed(sessions: SessionSummary[]): SessionSummary[] {
  return sessions.filter((s) => comp(s) !== null).sort((a, b) => a.session.startedAt - b.session.startedAt)
}

/** Velocidad válida para seguimiento: con cuestionario, tipo de texto conocido y sin hojeo. */
function countsForPpm(s: SessionSummary): boolean {
  const c = comp(s)
  return c !== null && !!s.session.textKind && s.session.wpm !== null && classifyReading(s.session.wpm, c) === 'lectura'
}

/** Divagación agregada: sondeos fuera del texto / sondeos respondidos (sin contar los espontáneos). */
function pooledWandering(sessions: SessionSummary[]): number | null {
  const answers = sessions.flatMap((s) => s.probes.map((p) => p.answer)).filter((a) => a !== 'auto')
  return answers.length ? answers.filter((a) => a !== 'texto').length / answers.length : null
}

const minutesOf = (sessions: SessionSummary[], attention: AttentionSession[]) =>
  Math.round(
    (sessions.reduce((a, s) => a + s.session.activeMs, 0) + attention.reduce((a, s) => a + s.durationMs, 0)) / 60000,
  )

export function weeklySeries(input: StatsInput, from: number, to: number): WeekRow[] {
  const rows: WeekRow[] = []
  const end = weekKey(to)
  for (let d = mondayOf(from); ; d.setDate(d.getDate() + 7)) {
    const week = isoDay(d)
    if (week > end) break
    const inWeek = input.sessions.filter((s) => weekKey(s.session.startedAt) === week)
    const att = input.attention.filter((a) => weekKey(a.startedAt) === week)
    const ppm = Object.fromEntries(
      TEXT_KINDS.map((k) => [
        k,
        median(inWeek.filter((s) => countsForPpm(s) && s.session.textKind === k).map((s) => s.session.wpm!)),
      ]),
    ) as Record<TextKind, number | null>
    rows.push({
      week,
      ppm,
      comprehension: mean(inWeek.map(comp).filter((c): c is number => c !== null)),
      wandering: pooledWandering(inWeek),
      minutes: minutesOf(inWeek, att),
    })
  }
  return rows
}

/** Retención diferida media a 1 y 7 días (siempre sobre las mismas 5 preguntas). */
export function retentionSummary(quizzes: QuizResult[]): { d1: number | null; d7: number | null } {
  const by = (d: 1 | 7) =>
    mean(quizzes.filter((q) => q.deferred && q.delayDays === d && q.total > 0).map((q) => q.correct / q.total))
  return { d1: by(1), d7: by(7) }
}

export function dashboardStats(input: StatsInput, now: number): DashboardStats {
  const q = quizzed(input.sessions)
  const lastPpm = Object.fromEntries(
    TEXT_KINDS.map((k) => {
      const last = q.filter((s) => countsForPpm(s) && s.session.textKind === k).at(-1)
      return [k, last ? last.session.wpm : null]
    }),
  ) as Record<TextKind, number | null>

  const withProbes = [...input.sessions]
    .filter((s) => s.probes.some((p) => p.answer !== 'auto'))
    .sort((a, b) => a.session.startedAt - b.session.startedAt)
    .slice(-5)

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const since = new Date(today)
  since.setDate(since.getDate() - 6)
  const days = new Set(
    [...input.sessions.map((s) => s.session.startedAt), ...input.attention.map((a) => a.startedAt)]
      .filter((ts) => ts >= since.getTime() && ts <= now)
      .map((ts) => isoDay(new Date(ts))),
  )

  const week = weekKey(now)
  return {
    lastPpm,
    avgComprehension: mean(q.slice(-5).map((s) => comp(s)!)),
    retention: retentionSummary(input.quizzes),
    wandering: pooledWandering(withProbes),
    practiceDays7: days.size,
    minutesWeek: minutesOf(
      input.sessions.filter((s) => weekKey(s.session.startedAt) === week),
      input.attention.filter((a) => weekKey(a.startedAt) === week),
    ),
    ileSeries: q
      .filter((s) => s.session.wpm !== null)
      .slice(-12)
      .map((s) => ({ at: s.session.startedAt, ile: ile(s.session.wpm!, comp(s)!) })),
  }
}
