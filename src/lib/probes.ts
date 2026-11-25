export type ProbeRange = { minMs: number; maxMs: number }

/** Sondeos durante el programa diario: cada 2-4 min. */
export const PROBE_RANGE_PROGRAMA: ProbeRange = { minMs: 120000, maxMs: 240000 }
/** Sondeos en el diagnóstico (lecturas de 3-4 min): cada 45-90 s, para obtener 2-3. */
export const PROBE_RANGE_DIAGNOSTICO: ProbeRange = { minMs: 45000, maxMs: 90000 }

export function nextProbeDelayMs(range: ProbeRange, rng: () => number = Math.random): number {
  return Math.floor(range.minMs + rng() * (range.maxMs - range.minMs))
}
