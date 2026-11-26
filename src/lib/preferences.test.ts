import { db } from './storage/db'
import { setSetting } from './storage/settings'
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from './preferences'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('preferencias', () => {
  it('por defecto', async () => {
    expect(await loadPreferences()).toEqual({ fontIndex: 1, lineHeight: 'normal', probesInFreeReading: true, sound: true, vibration: true })
    expect(DEFAULT_PREFERENCES.fontIndex).toBe(1)
  })
  it('guarda y lee', async () => {
    await savePreferences({ ...DEFAULT_PREFERENCES, probesInFreeReading: false, fontIndex: 3, lineHeight: 'amplio' })
    expect(await loadPreferences()).toMatchObject({ probesInFreeReading: false, fontIndex: 3, lineHeight: 'amplio' })
  })
  it('completa valores que falten o no sean válidos', async () => {
    await setSetting('preferences', { sound: false, fontIndex: 99, lineHeight: 'raro' })
    expect(await loadPreferences()).toEqual({ ...DEFAULT_PREFERENCES, sound: false })
  })
})
