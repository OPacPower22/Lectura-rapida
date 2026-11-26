import { useCallback, useEffect, useRef, useState } from 'react'
import type { ProbeAnswer } from '../../lib/metrics'
import { createProbeTimer, type ProbeRange, type ProbeTimer } from '../../lib/probes'
import { createStopwatch, type Clock, type Stopwatch } from '../../lib/stopwatch'

export interface SessionOutcome {
  startedAt: number
  endedAt: number
  activeMs: number
  probes: { at: number; answer: ProbeAnswer }[]
}

export type SessionStatus = 'idle' | 'reading' | 'done'

export interface ReadingSessionApi {
  status: SessionStatus
  probeOpen: boolean
  start(): void
  finish(): SessionOutcome
  markDistracted(): void
  answerProbe(answer: Exclude<ProbeAnswer, 'auto'>): void
  /** Tiempo activo acumulado (sin pausas). */
  elapsedMs(): number
}

/**
 * Lógica de una sesión de lectura medida: cronómetro de tiempo activo, sondeos de atención
 * y pausa automática cuando la pestaña se oculta.
 */
export function useReadingSession(opts: {
  probeRange: ProbeRange
  now?: Clock
  rng?: () => number
  /** Pausar al ocultar la pestaña (por defecto). En libro físico es false: se lee fuera de la pantalla. */
  pauseWhenHidden?: boolean
  /** Sondeos de atención activos (por defecto). Se desactivan en lecturas libres si el usuario lo elige. */
  probesEnabled?: boolean
}): ReadingSessionApi {
  const { probeRange, now, rng, pauseWhenHidden = true, probesEnabled = true } = opts
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [probeOpen, setProbeOpen] = useState(false)
  const stopwatch = useRef<Stopwatch | null>(null)
  const timer = useRef<ProbeTimer | null>(null)
  const probes = useRef<SessionOutcome['probes']>([])
  const startedAt = useRef(0)
  const probeOpenRef = useRef(false)

  useEffect(() => {
    if (status !== 'reading' || !pauseWhenHidden) return
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopwatch.current?.pause()
        timer.current?.pause()
      } else if (!probeOpenRef.current) {
        stopwatch.current?.resume()
        timer.current?.resume()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [status, pauseWhenHidden])

  useEffect(() => () => timer.current?.cancel(), [])

  const start = useCallback(() => {
    stopwatch.current = createStopwatch(now)
    stopwatch.current.start()
    probes.current = []
    startedAt.current = Date.now()
    timer.current?.cancel()
    timer.current = null
    if (probesEnabled) {
      timer.current = createProbeTimer(
        probeRange,
        () => {
          stopwatch.current?.pause()
          probeOpenRef.current = true
          setProbeOpen(true)
        },
        rng,
      )
      timer.current.start()
    }
    setStatus('reading')
  }, [now, probeRange, rng, probesEnabled])

  const answerProbe = useCallback((answer: Exclude<ProbeAnswer, 'auto'>) => {
    probes.current.push({ at: Date.now(), answer })
    probeOpenRef.current = false
    setProbeOpen(false)
    stopwatch.current?.resume()
    timer.current?.start()
  }, [])

  const markDistracted = useCallback(() => {
    probes.current.push({ at: Date.now(), answer: 'auto' })
  }, [])

  const finish = useCallback((): SessionOutcome => {
    timer.current?.cancel()
    const sw = stopwatch.current!
    sw.pause()
    probeOpenRef.current = false
    setProbeOpen(false)
    setStatus('done')
    return {
      startedAt: startedAt.current,
      endedAt: Date.now(),
      activeMs: sw.elapsedMs(),
      probes: [...probes.current],
    }
  }, [])

  const elapsedMs = useCallback(() => stopwatch.current?.elapsedMs() ?? 0, [])

  return { status, probeOpen, start, finish, markDistracted, answerProbe, elapsedMs }
}
