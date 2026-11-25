export type ThemeChoice = 'system' | 'light' | 'sepia' | 'dark'
export type ResolvedTheme = 'light' | 'sepia' | 'dark'

export const THEME_CHOICES: ThemeChoice[] = ['system', 'light', 'sepia', 'dark']
const STORAGE_KEY = 'lectura-rapida.theme'
export const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Color de la barra del navegador para cada tema (coincide con --page en index.css). */
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#fafaf9',
  sepia: '#f4ecd8',
  dark: '#0c0a09',
}

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): ResolvedTheme {
  if (choice === 'system') return prefersDark ? 'dark' : 'light'
  return choice
}

export function loadThemeChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return THEME_CHOICES.includes(value as ThemeChoice) ? (value as ThemeChoice) : 'system'
  } catch {
    return 'system'
  }
}

export function saveThemeChoice(choice: ThemeChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    // Sin almacenamiento: el tema se aplica solo en esta visita.
  }
}

export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
}

export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}
