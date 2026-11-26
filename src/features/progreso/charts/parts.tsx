import type { ReactNode } from 'react'
import { t } from '../../../i18n'

export function Figure({ id, title, unit, children }: { id: string; title: string; unit: string; children: ReactNode }) {
  return (
    <figure aria-labelledby={`${id}-cap`} className="space-y-2 rounded-lg border border-line bg-surface p-4">
      <figcaption className="font-semibold">
        <span id={`${id}-cap`}>{title}</span> <span className="text-sm font-normal text-muted">({unit})</span>
      </figcaption>
      {children}
    </figure>
  )
}

export function Tooltip({ left, heading, rows }: { left: number; heading: string; rows: { key: ReactNode; name: string; value: string }[] }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded border border-line bg-surface px-3 py-2 text-sm shadow"
      style={{ left: `${Math.min(85, Math.max(15, left))}%` }}
    >
      <div className="text-muted">{heading}</div>
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-2">
          {r.key}
          <strong>{r.value}</strong>
          <span className="text-muted">{r.name}</span>
        </div>
      ))}
    </div>
  )
}

export function LineKey({ color }: { color: string }) {
  return (
    <svg width="16" height="8" aria-hidden="true" className="shrink-0">
      <line x1="1" y1="4" x2="15" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-accent-ink underline">{t('chart.showData')}</summary>
      <div className="overflow-x-auto">
        <table className="mt-2 w-full text-left tabular-nums">
          <thead>
            <tr className="border-b border-line-strong">
              {head.map((h) => (
                <th key={h} className="py-1 pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line">
                {r.map((c, j) => (
                  <td key={j} className="py-1 pr-3">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
