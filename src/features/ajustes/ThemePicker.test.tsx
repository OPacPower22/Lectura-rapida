import { fireEvent, render, screen } from '@testing-library/react'
import { t } from '../../i18n'
import { loadThemeChoice } from '../../lib/theme'
import { ThemePicker } from './ThemePicker'

let prefersDark = false
const listeners = new Set<() => void>()

beforeEach(() => {
  prefersDark = false
  listeners.clear()
  localStorage.clear()
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes('dark') && prefersDark
    },
    media: query,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  })) as unknown as typeof window.matchMedia
})

describe('ThemePicker', () => {
  it('dos selectores (cabecera y ajustes) se mantienen sincronizados', () => {
    render(<><ThemePicker /><ThemePicker /></>)
    const [a, b] = screen.getAllByRole('combobox')
    fireEvent.change(a, { target: { value: 'sepia' } })
    expect(b).toHaveValue('sepia')
  })

  it('cambia a modo oscuro y lo recuerda', () => {
    render(<ThemePicker />)
    fireEvent.change(screen.getByLabelText(t('theme.label')), { target: { value: 'dark' } })
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(loadThemeChoice()).toBe('dark')
  })

  it('en automático sigue los cambios del sistema', () => {
    render(<ThemePicker />)
    expect(document.documentElement.dataset.theme).toBe('light')
    prefersDark = true
    listeners.forEach((cb) => cb())
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
