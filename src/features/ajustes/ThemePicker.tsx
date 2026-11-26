import { useEffect, useState } from 'react'
import { t } from '../../i18n'
import {
  applyTheme,
  DARK_QUERY,
  loadThemeChoice,
  resolveTheme,
  saveThemeChoice,
  systemPrefersDark,
  THEME_CHOICES,
  THEME_EVENT,
  type ThemeChoice,
} from '../../lib/theme'

export function ThemePicker() {
  const [choice, setChoice] = useState<ThemeChoice>(loadThemeChoice)

  useEffect(() => {
    const onTheme = (e: Event) => setChoice((e as CustomEvent<ThemeChoice>).detail)
    window.addEventListener(THEME_EVENT, onTheme)
    return () => window.removeEventListener(THEME_EVENT, onTheme)
  }, [])

  useEffect(() => {
    applyTheme(resolveTheme(choice, systemPrefersDark()))
    if (choice !== 'system' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(DARK_QUERY)
    const onChange = () => applyTheme(resolveTheme('system', query.matches))
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [choice])

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only sm:not-sr-only">{t('theme.label')}</span>
      <select
        value={choice}
        onChange={(e) => {
          const next = e.target.value as ThemeChoice
          setChoice(next)
          saveThemeChoice(next)
        }}
        className="max-w-[11rem] rounded border border-line-strong bg-surface px-1 py-1 text-ink sm:max-w-none sm:px-2"
      >
        {THEME_CHOICES.map((c) => (
          <option key={c} value={c}>
            {t(`theme.${c}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
