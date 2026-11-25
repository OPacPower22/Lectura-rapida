export type ProbeRange = { minMs: number; maxMs: number }

/** Sondeos durante el programa diario: cada 2-4 min. */
export const PROBE_RANGE_PROGRAMA: ProbeRange = { minMs: 120000, maxMs: 240000 }
/** Sondeos en el diagnóstico (lecturas de 3-4 min): cada 45-90 s, para obtener 2-3. */
export const PROBE_RANGE_DIAGNOSTICO: ProbeRange = { minMs: 45000, maxMs: 90000 }

export function nextProbeDelayMs(range: ProbeRange, rng: () => number = Math.random): number {
  return Math.floor(range.minMs + rng() * (range.maxMs - range.minMs))
}

export interface ProbeTimer {
  /** Programa un sondeo con un intervalo nuevo. */
  start(): void
  /** Detiene la cuenta guardando el tiempo restante. */
  pause(): void
  /** Continúa la cuenta con el tiempo restante. */
  resume(): void
  cancel(): void
}

export function createProbeTimer(
  range: ProbeRange,
  onFire: () => void,
  rng: () => number = Math.random,
): ProbeTimer {
  let handle: ReturnType<typeof setTimeout> | undefined
  let remaining = 0
  let scheduledAt = 0

  const schedule = (ms: number) => {
    clearTimeout(handle)
    remaining = ms
    scheduledAt = Date.now()
    handle = setTimeout(() => {
      handle = undefined
      remaining = 0
      onFire()
    }, ms)
  }

  return {
    start() {
      schedule(nextProbeDelayMs(range, rng))
    },
    pause() {
      if (handle === undefined) return
      clearTimeout(handle)
      handle = undefined
      remaining = Math.max(0, remaining - (Date.now() - scheduledAt))
    },
    resume() {
      if (handle !== undefined || remaining <= 0) return
      schedule(remaining)
    },
    cancel() {
      clearTimeout(handle)
      handle = undefined
      remaining = 0
    },
  }
}
