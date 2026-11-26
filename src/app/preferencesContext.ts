import { createContext, useContext } from 'react'
import { DEFAULT_PREFERENCES, type Preferences } from '../lib/preferences'

export interface PreferencesApi {
  prefs: Preferences
  update(p: Preferences): Promise<void>
}

export const PreferencesContext = createContext<PreferencesApi>({ prefs: DEFAULT_PREFERENCES, update: async () => {} })

export function usePreferences(): PreferencesApi {
  return useContext(PreferencesContext)
}
