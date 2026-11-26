import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences, type Preferences } from '../lib/preferences'
import { PreferencesContext } from './preferencesContext'

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES)
  useEffect(() => {
    loadPreferences()
      .then(setPrefs)
      .catch(() => {})
  }, [])
  const api = useMemo(
    () => ({
      prefs,
      update: async (p: Preferences) => {
        setPrefs(p)
        await savePreferences(p)
      },
    }),
    [prefs],
  )
  return <PreferencesContext.Provider value={api}>{children}</PreferencesContext.Provider>
}
