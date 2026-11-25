export type Clock = () => number

export interface Stopwatch {
  start(): void
  pause(): void
  resume(): void
  elapsedMs(): number
  isRunning(): boolean
}

/** Cronómetro de tiempo activo: el tiempo en pausa no cuenta. */
export function createStopwatch(now: Clock = () => performance.now()): Stopwatch {
  let accumulated = 0
  let runningSince: number | null = null

  return {
    start() {
      accumulated = 0
      runningSince = now()
    },
    pause() {
      if (runningSince === null) return
      accumulated += now() - runningSince
      runningSince = null
    },
    resume() {
      if (runningSince !== null) return
      runningSince = now()
    },
    elapsedMs() {
      return accumulated + (runningSince === null ? 0 : now() - runningSince)
    },
    isRunning() {
      return runningSince !== null
    },
  }
}
