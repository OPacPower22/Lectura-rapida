import { fireEvent, render, screen } from '@testing-library/react'
import { t } from '../../i18n'
import { FocusChecklist } from './FocusChecklist'

describe('FocusChecklist', () => {
  it('habilita «Empezar» solo con las tres casillas marcadas y entrega el objetivo', () => {
    const onReady = vi.fn()
    render(<FocusChecklist onReady={onReady} />)
    const start = screen.getByRole('button', { name: t('focus.start') })
    expect(start).toBeDisabled()
    fireEvent.click(screen.getByLabelText(t('focus.phone')))
    fireEvent.click(screen.getByLabelText(t('focus.notifications')))
    expect(start).toBeDisabled()
    fireEvent.click(screen.getByLabelText(t('focus.oneTab')))
    fireEvent.change(screen.getByLabelText(t('focus.goal')), { target: { value: 'Leer el capítulo 3' } })
    expect(start).toBeEnabled()
    fireEvent.click(start)
    expect(onReady).toHaveBeenCalledWith('Leer el capítulo 3')
  })
})
