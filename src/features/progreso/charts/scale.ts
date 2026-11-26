/** Máximo "redondo" del eje y y sus marcas (4 intervalos). */
export function niceScale(max: number): { max: number; ticks: number[] } {
  if (!(max > 0)) return { max: 1, ticks: [0, 1] }
  const raw = max / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw)!
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + step / 1000; v += step) ticks.push(Math.round(v * 1000) / 1000)
  return { max: top, ticks }
}

/** Índices del eje x con etiqueta: como mucho ~6, siempre el último. */
export function labeledIndices(n: number): Set<number> {
  const step = Math.max(1, Math.ceil(n / 6))
  const out = new Set<number>()
  for (let i = 0; i < n; i += step) out.add(i)
  if (n > 0) out.add(n - 1)
  if (n > 1 && out.has(n - 2) && step > 1) out.delete(n - 2)
  return out
}

export const fmt = (v: number) => new Intl.NumberFormat('es').format(Math.round(v))

export const W = 640
export const H = 240
export const M = { l: 44, r: 56, t: 16, b: 30 }

export const DASH = '—'
