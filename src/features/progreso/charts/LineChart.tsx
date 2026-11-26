import { useId } from 'react'
import { t } from '../../../i18n'
import { DataTable, Figure, LineKey, Tooltip } from './parts'
import { useActive } from './useActive'
import { DASH, fmt, H, labeledIndices, M, niceScale, W } from './scale'

export interface LineSeries {
  name: string
  /** Ranura de color fija de la entidad (1-3): el color sigue a la serie, no a su posición. */
  color?: 1 | 2 | 3
  points: { x: string; y: number | null }[]
}

interface Props {
  title: string
  unit: string
  series: LineSeries[]
  xFormat?: (x: string) => string
  yMax?: number
}

export function LineChart({ title, unit, series, xFormat = (x) => x, yMax }: Props) {
  const id = useId()
  const xs = series[0]?.points.map((p) => p.x) ?? []
  const n = xs.length
  const { active, setActive, svgProps } = useActive(n)
  const values = series.flatMap((s) => s.points.map((p) => p.y)).filter((v): v is number => v !== null)
  const scale = niceScale(yMax ?? Math.max(0, ...values))
  const plotW = W - M.l - M.r
  const plotH = H - M.t - M.b
  const x = (i: number) => M.l + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1))
  const y = (v: number) => M.t + plotH - (v / scale.max) * plotH
  const color = (s: LineSeries, i: number) => `var(--series-${s.color ?? i + 1})`
  const labels = labeledIndices(n)

  // Etiqueta directa al final de cada serie; si dos chocan, la segunda queda para la leyenda y el aviso.
  const ends: { si: number; i: number; v: number }[] = []
  series.forEach((s, si) => {
    const i = s.points.map((p) => p.y).findLastIndex((v) => v !== null)
    if (i >= 0) {
      const v = s.points[i].y!
      if (!ends.some((e) => Math.abs(y(e.v) - y(v)) < 14 && Math.abs(x(e.i) - x(i)) < 40)) ends.push({ si, i, v })
    }
  })

  const summary = `${title} (${unit}). ${series
    .map((s) => {
      const last = [...s.points].reverse().find((p) => p.y !== null)
      return last ? `${s.name}: ${fmt(last.y!)} ${unit} (${xFormat(last.x)})` : `${s.name}: ${DASH}`
    })
    .join('; ')}. ${t('chart.keyboardHint')}`

  return (
    <Figure id={id} title={title} unit={unit}>
      {series.length >= 2 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {series.map((s, i) => (
            <li key={s.name} className="flex items-center gap-1">
              <LineKey color={color(s, i)} />
              {s.name}
            </li>
          ))}
        </ul>
      )}
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
          <line x1={M.l} x2={W - M.r} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" strokeWidth="1" />
          {xs.map((xv, i) =>
            labels.has(i) ? (
              <text key={xv} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--muted)">
                {xFormat(xv)}
              </text>
            ) : null,
          )}
          {active !== null && <line x1={x(active)} x2={x(active)} y1={M.t} y2={y(0)} stroke="var(--line-strong)" strokeWidth="1" />}
          {series.map((s, si) => {
            const runs: { i: number; v: number }[][] = []
            s.points.forEach((p, i) => {
              if (p.y === null) return
              const prev = s.points[i - 1]
              if (i === 0 || !prev || prev.y === null || !runs.length) runs.push([])
              runs[runs.length - 1].push({ i, v: p.y })
            })
            return (
              <g key={s.name} data-series={si}>
                {runs.map((run) => (
                  <path
                    key={run[0].i}
                    data-segment=""
                    d={run.map((p, k) => `${k ? 'L' : 'M'}${x(p.i)},${y(p.v)}`).join(' ')}
                    fill="none"
                    stroke={color(s, si)}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
                {runs.flat().map((p) => (
                  <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={p.i === active ? 5 : 4} fill={color(s, si)} stroke="var(--surface)" strokeWidth="2" />
                ))}
              </g>
            )
          })}
          {ends.map((e) => (
            <text key={e.si} x={x(e.i) + 8} y={y(e.v)} dy="0.32em" fontSize="12" fill="var(--ink)" className="tabular-nums">
              {fmt(e.v)}
            </text>
          ))}
          {xs.map((xv, i) => (
            <rect
              key={xv}
              data-hit=""
              x={x(i) - (n <= 1 ? plotW / 2 : plotW / (n - 1) / 2)}
              y={M.t}
              width={n <= 1 ? plotW : plotW / (n - 1)}
              height={plotH}
              fill="transparent"
              onPointerEnter={() => setActive(i)}
            />
          ))}
        </svg>
        {active !== null && (
          <Tooltip
            left={(x(active) / W) * 100}
            heading={xFormat(xs[active])}
            rows={series.map((s, si) => {
              const v = s.points[active]?.y ?? null
              return { key: <LineKey color={color(s, si)} />, name: s.name, value: v === null ? DASH : `${fmt(v)} ${unit}` }
            })}
          />
        )}
      </div>
      <DataTable
        head={[t('chart.period'), ...series.map((s) => s.name)]}
        rows={xs.map((xv, i) => [xFormat(xv), ...series.map((s) => (s.points[i]?.y == null ? DASH : fmt(s.points[i].y!)))])}
      />
    </Figure>
  )
}
