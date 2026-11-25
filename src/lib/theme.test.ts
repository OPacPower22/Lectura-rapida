import { applyTheme, loadThemeChoice, resolveTheme, saveThemeChoice } from './theme'

afterEach(() => localStorage.clear())

describe('resolveTheme', () => {
  it('"system" sigue la preferencia del sistema', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
  it('una elección explícita ignora el sistema', () => {
    expect(resolveTheme('sepia', true)).toBe('sepia')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('loadThemeChoice / saveThemeChoice', () => {
  it('por defecto usa el sistema', () => {
    expect(loadThemeChoice()).toBe('system')
  })
  it('recuerda la elección', () => {
    saveThemeChoice('dark')
    expect(loadThemeChoice()).toBe('dark')
  })
  it('ignora valores guardados inválidos', () => {
    localStorage.setItem('lectura-rapida.theme', 'neon')
    expect(loadThemeChoice()).toBe('system')
  })
  it('no falla si el almacenamiento no está disponible', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(loadThemeChoice()).toBe('system')
    spy.mockRestore()
  })
})

describe('applyTheme', () => {
  it('marca el documento con el tema y el esquema de color', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    applyTheme('sepia')
    expect(document.documentElement.dataset.theme).toBe('sepia')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})
