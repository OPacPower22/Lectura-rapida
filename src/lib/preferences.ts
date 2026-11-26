import { getSetting, setSetting } from './storage/settings'

export interface Preferences {
  /** Índice en FONT_SIZES del lector. */
  fontIndex: number
  lineHeight: 'normal' | 'amplio'
  /** Sondeos de atención en lecturas libres (texto propio y documentos). El programa y el diagnóstico siempre los usan. */
  probesInFreeReading: boolean
  sound: boolean
  vibration: boolean
}

export const DEFAULT_PREFERENCES: Preferences = {
  fontIndex: 1,
  lineHeight: 'normal',
  probesInFreeReading: true,
  sound: true,
  vibration: true,
}

const KEY = 'preferences'
const FONT_COUNT = 6

export async function loadPreferences(): Promise<Preferences> {
  const raw = (await getSetting<Partial<Preferences>>(KEY)) ?? {}
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)
  return {
    fontIndex: Number.isInteger(raw.fontIndex) && raw.fontIndex! >= 0 && raw.fontIndex! < FONT_COUNT ? raw.fontIndex! : DEFAULT_PREFERENCES.fontIndex,
    lineHeight: raw.lineHeight === 'amplio' ? 'amplio' : 'normal',
    probesInFreeReading: bool(raw.probesInFreeReading, true),
    sound: bool(raw.sound, true),
    vibration: bool(raw.vibration, true),
  }
}

export async function savePreferences(p: Preferences): Promise<void> {
  await setSetting(KEY, p)
}
