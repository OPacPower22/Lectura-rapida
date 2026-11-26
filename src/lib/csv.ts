import { ile, mindWanderingRate } from './metrics'
import type { SessionSummary } from './storage/repo'

const HEADER = ['fecha', 'tipo', 'titulo', 'idioma', 'tipo_texto', 'ppm', 'comprension', 'ile', 'divagacion', 'minutos', 'paginas']

const pad = (n: number) => String(n).padStart(2, '0')
function localDateTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Escapa un campo CSV (RFC 4180) y neutraliza fórmulas de hojas de cálculo. */
function field(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  let s = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\r\n]|^'/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Sesiones en CSV para hojas de cálculo: BOM UTF-8 (Excel lee bien los acentos), CRLF y solo números
 * enteros (porcentajes de 0 a 100) para evitar la ambigüedad del separador decimal.
 */
export function sessionsToCsv(rows: SessionSummary[]): string {
  const lines = rows.map(({ session: s, quiz, probes }) => {
    const comp = quiz && quiz.total > 0 ? quiz.correct / quiz.total : null
    const wandering = mindWanderingRate(probes.map((p) => p.answer))
    return [
      localDateTime(s.startedAt),
      s.kind,
      s.title ?? s.textId ?? '',
      s.lang,
      s.textKind ?? '',
      s.wpm,
      comp === null ? null : Math.round(comp * 100),
      comp === null || s.wpm === null ? null : ile(s.wpm, comp),
      wandering === null ? null : Math.round(wandering * 100),
      Math.round(s.activeMs / 60000),
      s.pages ? `${s.pages.from}-${s.pages.to}` : '',
    ]
      .map(field)
      .join(',')
  })
  return '﻿' + [HEADER.join(','), ...lines].join('\r\n')
}
