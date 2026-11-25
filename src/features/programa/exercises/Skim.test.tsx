import { act, fireEvent, render, screen } from '@testing-library/react'
import { t } from '../../../i18n'
import { Skim } from './Skim'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('Skim', () => {
  it('oculta el texto al terminar el tiempo y pide 3 ideas', () => {
    const onDone = vi.fn()
    render(<Skim textId="practica-4" seconds={60} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: t('skim.start') }))
    expect(screen.getByText(/Pocos animales transforman/)).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(60000)
    })
    expect(screen.queryByText(/Pocos animales transforman/)).not.toBeInTheDocument()
    for (const n of [1, 2, 3]) fireEvent.change(screen.getByLabelText(t('skim.idea', { n })), { target: { value: `idea ${n}` } })
    fireEvent.click(screen.getByRole('button', { name: t('program.exerciseDone') }))
    expect(onDone).toHaveBeenCalled()
  })
})
