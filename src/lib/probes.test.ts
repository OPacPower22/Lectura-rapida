import { PROBE_RANGE_DIAGNOSTICO, PROBE_RANGE_PROGRAMA, nextProbeDelayMs } from './probes'

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
