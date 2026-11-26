import { useId } from 'react'
import { t } from '../../../i18n'
import { DataTable, Figure, Tooltip } from './parts'
import { useActive } from './useActive'
import { fmt, H, labeledIndices, M, niceScale, W } from './scale'

interface Props {
  title: string
  unit: string
  bars: { x: string; y: number }[]
  xFormat?: (x: string) => string
}

/** Columna con extremo de datos redondeado (4 px) y base recta. */
function columnPath(x: number, top: number, w: number, base: number): string {
  const r = Math.min(4, w / 2, base - top)
  return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`
}

export function BarChart({ title, unit, bars, xFormat = (x) => x }: Props) {
  const id = useId()
  const n = bars.length
  const { active, setActive, svgProps } = useActive(n)
  const scale = niceScale(Math.max(0, ...bars.map((b) => b.y)))
  const plotW = W - M.l - M.r
  const plotH = H - M.t - M.b
  const band = n ? plotW / n : plotW
  const barW = Math.min(24, band * 0.6)
  const cx = (i: number) => M.l + band * (i + 0.5)
  const y = (v: number) => M.t + plotH - (v / scale.max) * plotH
  const labels = labeledIndices(n)
  const maxI = bars.reduce((best, b, i) => (b.y > (bars[best]?.y ?? -1) ? i : best), 0)
  const capLabels = new Set([maxI, n - 1].filter((i) => n > 0 && bars[i].y > 0))
  const summary = `${title} (${unit}). ${bars.length ? `${xFormat(bars[n - 1].x)}: ${fmt(bars[n - 1].y)} ${unit}.` : ''} ${t('chart.keyboardHint')}`

  return (
    <Figure id={id} title={title} unit={unit}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="h-auto w-full focus-visible:outline-2 focus-visible:outline-accent" {...svgProps}>
          {scale.ticks.map((v) => (
            <g key={v}>
              <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
              <text x={M.l - 6} y={y(v)} dy="0.32em" textAnchor="end" fontSize="12" fill="var(--muted)" className="tabular-nums">
                {fmt(v)}
              </text>
            </g>
          ))}
          {bars.map((b, i) => (
            <g key={b.x}>
              {b.y > 0 ? (
                <path data-bar="" d={columnPath(cx(i) - barW / 2, y(b.y), barW, y(0))} fill="var(--series-1)" opacity={active === null || active === i ? 1 : 0.6} />
              ) : (
                <rect data-bar="" x={cx(i) - barW / 2} y={y(0)} width={barW} height={0} />
              )}
              {capLabels.has(i) && (
                <text x={cx(i)} y={y(b.y) - 6} textAnchor="middle" fontSize="12" fill="var(--ink)" className="tabular-nums">
                  {fmt(b.y)}
                </text>
              )}
              {labels.has(i) && (
                <text x={cx(i)} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--muted)">
                  {xFormat(b.x)}
                </text>
              )}
              <rect x={cx(i) - band / 2} y={M.t} width={band} height={plotH} fill="transparent" onPointerEnter={() => setActive(i)} />
            </g>
          ))}
          <line x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" strokeWidth="1" />
        </svg>
        {active !== null && bars[active] && (
          <Tooltip
            left={(cx(active) / W) * 100}
            heading={xFormat(bars[active].x)}
            rows={[{ key: null, name: unit, value: fmt(bars[active].y) }]}
          />
        )}
      </div>
      <DataTable head={[t('chart.period'), unit]} rows={bars.map((b) => [xFormat(b.x), fmt(b.y)])} />
    </Figure>
  )
}
