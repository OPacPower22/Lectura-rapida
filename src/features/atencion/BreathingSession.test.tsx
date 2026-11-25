import { act, fireEvent, render, screen } from '@testing-library/react'
import { t } from '../../i18n'
import { BreathingSession } from './BreathingSession'

let now = 0
beforeEach(() => {
  now = 0
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('BreathingSession', () => {
  it('termina sola al cumplirse el tiempo y cuenta los regresos', () => {
    const onDone = vi.fn()
    render(<BreathingSession minutes={2} now={() => now} onDone={onDone} />)
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: t('attention.returned') }))
    now = 120000
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(onDone).toHaveBeenCalledWith({ durationMs: 120000, returns: 3 })
  })

  it('«Terminar antes» guarda la duración real', () => {
    const onDone = vi.fn()
    render(<BreathingSession minutes={5} now={() => now} onDone={onDone} />)
    now = 30000
    fireEvent.click(screen.getByRole('button', { name: t('attention.finishEarly') }))
    expect(onDone).toHaveBeenCalledWith({ durationMs: 30000, returns: 0 })
  })
})
