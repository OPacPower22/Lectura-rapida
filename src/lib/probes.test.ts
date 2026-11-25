import { createProbeTimer, PROBE_RANGE_DIAGNOSTICO, PROBE_RANGE_PROGRAMA, nextProbeDelayMs } from './probes'

describe('nextProbeDelayMs', () => {
  it('respeta el rango del programa (2-4 min)', () => {
    expect(nextProbeDelayMs(PROBE_RANGE_PROGRAMA, () => 0)).toBe(120000)
    expect(nextProbeDelayMs(PROBE_RANGE_PROGRAMA, () => 0.5)).toBe(180000)
    expect(nextProbeDelayMs(PROBE_RANGE_PROGRAMA, () => 0.99999)).toBeLessThan(240000)
  })
  it('usa 45-90 s en el diagnóstico', () => {
    expect(nextProbeDelayMs(PROBE_RANGE_DIAGNOSTICO, () => 0)).toBe(45000)
  })
})

describe('createProbeTimer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('dispara al vencer el intervalo', () => {
    const onFire = vi.fn()
    createProbeTimer(PROBE_RANGE_DIAGNOSTICO, onFire, () => 0).start()
    vi.advanceTimersByTime(44999)
    expect(onFire).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('al reanudar usa el tiempo restante, no reinicia la cuenta', () => {
    const onFire = vi.fn()
    const timer = createProbeTimer(PROBE_RANGE_DIAGNOSTICO, onFire, () => 0)
    timer.start()
    vi.advanceTimersByTime(30000)
    timer.pause()
    vi.advanceTimersByTime(100000)
    expect(onFire).not.toHaveBeenCalled()
    timer.resume()
    vi.advanceTimersByTime(14999)
    expect(onFire).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onFire).toHaveBeenCalledTimes(1)
  })

  it('cancel evita el disparo', () => {
    const onFire = vi.fn()
    const timer = createProbeTimer(PROBE_RANGE_DIAGNOSTICO, onFire, () => 0)
    timer.start()
    timer.cancel()
    vi.advanceTimersByTime(100000)
    expect(onFire).not.toHaveBeenCalled()
  })
})
