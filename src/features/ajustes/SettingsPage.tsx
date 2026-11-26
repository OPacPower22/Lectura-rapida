import { useEffect, useId, useState } from 'react'
import { usePreferences } from '../../app/preferencesContext'
import { currentLang, t } from '../../i18n'
import { BACKUP_LAST_KEY, exportBackup, inspectBackup, restoreBackup, type RestoreError } from '../../lib/backup'
import { downloadBlob } from '../../lib/download'
import type { Preferences } from '../../lib/preferences'
import { getSetting } from '../../lib/storage/settings'
import { card, outlineButton, primaryButton } from '../../ui/styles'
import { FONT_SIZES } from '../lector/readerUtils'
import { ThemePicker } from './ThemePicker'

const SUMMARY_TABLES = ['readingSessions', 'notes', 'documents', 'cards', 'projects'] as const

function Toggle({ label, help, checked, onChange }: { label: string; help?: string; checked: boolean; onChange(v: boolean): void }) {
  const helpId = useId()
  return (
    <div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={help ? helpId : undefined}
          className="mt-1 size-4"
        />
        <span className="font-medium">{label}</span>
      </label>
      {help && <p id={helpId} className="ml-7 text-sm text-muted">{help}</p>}
    </div>
  )
}

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function DataSection() {
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [lastAt, setLastAt] = useState<number | undefined | null>(null)
  const [includeFiles, setIncludeFiles] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(false)
  const [candidate, setCandidate] = useState<{ file: File; summary: Record<string, number>; exportedAt: string } | null>(null)
  const [restoreError, setRestoreError] = useState<RestoreError | 'write' | null>(null)
  const [restored, setRestored] = useState(false)
  const date = new Intl.DateTimeFormat(currentLang(), { dateStyle: 'long', timeStyle: 'short' })

  useEffect(() => {
    getSetting<number>(BACKUP_LAST_KEY)
      .then(setLastAt)
      .catch(() => setLastAt(undefined))
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(false))
  }, [])

  async function create() {
    setCreating(true)
    setCreateError(false)
    try {
      const blob = await exportBackup({ includeFiles })
      downloadBlob(blob, `lectura-rapida-respaldo-${isoDate(new Date())}.zip`)
      setLastAt(Date.now())
    } catch {
      setCreateError(true)
    } finally {
      setCreating(false)
    }
  }

  async function pick(file: File | undefined) {
    setCandidate(null)
    setRestoreError(null)
    setRestored(false)
    if (!file) return
    const info = await inspectBackup(file)
    if (info.ok) setCandidate({ file, summary: info.summary, exportedAt: info.exportedAt })
    else setRestoreError(info.error)
  }

  async function restore() {
    if (!candidate) return
    try {
      await restoreBackup(candidate.file)
      setCandidate(null)
      setRestored(true)
    } catch {
      setRestoreError('write')
    }
  }

  return (
    <section aria-labelledby="data-title" className={`${card} space-y-4`}>
      <h2 id="data-title" className="text-xl font-semibold">{t('settings.data')}</h2>
      {persisted !== null && <p className="text-sm">{persisted ? t('settings.persisted') : t('settings.notPersisted')}</p>}

      <div className="space-y-2">
        <h3 className="font-semibold">{t('settings.backup.title')}</h3>
        <p className="text-sm text-muted">{t('settings.backup.help')}</p>
        {lastAt !== null && <p className="text-sm">{lastAt === undefined ? t('settings.backup.never') : t('settings.backup.last', { date: date.format(lastAt) })}</p>}
        <Toggle label={t('settings.backup.includeFiles')} help={t('settings.backup.includeFilesHelp')} checked={includeFiles} onChange={setIncludeFiles} />
        <button type="button" className={primaryButton} disabled={creating} onClick={create}>
          {creating ? t('settings.backup.creating') : t('settings.backup.create')}
        </button>
        {createError && <p role="alert" className="text-err-ink">{t('settings.backup.error')}</p>}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">{t('settings.restore.title')}</h3>
        <p className="text-sm text-muted">{t('settings.restore.help')}</p>
        <label className="block">
          <span className="block text-sm font-medium">{t('settings.restore.file')}</span>
          <input type="file" accept=".zip,application/zip" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {restoreError && <p role="alert" className="text-err-ink">{t(`settings.restore.error.${restoreError}`)}</p>}
        {candidate && (
          <div className="space-y-2 rounded border border-warn-line bg-warn-bg p-3 text-warn-ink">
            <p>{t('settings.restore.summary', { date: candidate.exportedAt ? date.format(new Date(candidate.exportedAt)) : '—' })}</p>
            <ul className="list-disc pl-6">
              {SUMMARY_TABLES.map((k) => (
                <li key={k}>{t(`settings.restore.count.${k}`, { count: candidate.summary[k] ?? 0 })}</li>
              ))}
            </ul>
            <p className="font-medium">{t('settings.restore.warning')}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={primaryButton} onClick={restore}>{t('settings.restore.confirm')}</button>
              <button type="button" className={outlineButton} onClick={() => setCandidate(null)}>{t('notebook.cancel')}</button>
            </div>
          </div>
        )}
        {restored && (
          <p role="status" className="rounded border border-accent bg-accent-soft p-3 text-accent-ink">
            {t('settings.restore.done')}{' '}
            <button type="button" className="underline" onClick={() => window.location.reload()}>{t('settings.restore.reload')}</button>
          </p>
        )}
      </div>
    </section>
  )
}

export function SettingsPage() {
  const { prefs, update } = usePreferences()
  const set = (patch: Partial<Preferences>) => void update({ ...prefs, ...patch })

  return (
    <section className="mx-auto max-w-prose space-y-6">
      <h1 className="text-3xl font-bold">{t('settings.title')}</h1>

      <section aria-labelledby="look-title" className={`${card} space-y-4`}>
        <h2 id="look-title" className="text-xl font-semibold">{t('settings.appearance')}</h2>
        <ThemePicker />
        <label className="block">
          <span className="block font-medium">{t('settings.fontSize')}</span>
          <select value={prefs.fontIndex} onChange={(e) => set({ fontIndex: Number(e.target.value) })} className="rounded border border-line-strong bg-surface px-2 py-1">
            {FONT_SIZES.map((px, i) => (
              <option key={px} value={i}>{t('settings.fontPx', { px })}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="font-medium">{t('settings.lineHeight')}</legend>
          {(['normal', 'amplio'] as const).map((v) => (
            <label key={v} className="mr-4 inline-flex items-center gap-2">
              <input type="radio" name="lineHeight" checked={prefs.lineHeight === v} onChange={() => set({ lineHeight: v })} />
              {t(`settings.lineHeight.${v}`)}
            </label>
          ))}
        </fieldset>
      </section>

      <section aria-labelledby="reading-title" className={`${card} space-y-4`}>
        <h2 id="reading-title" className="text-xl font-semibold">{t('settings.reading')}</h2>
        <Toggle label={t('settings.probes')} help={t('settings.probesHelp')} checked={prefs.probesInFreeReading} onChange={(v) => set({ probesInFreeReading: v })} />
        <Toggle label={t('settings.sound')} help={t('settings.soundHelp')} checked={prefs.sound} onChange={(v) => set({ sound: v })} />
        <Toggle label={t('settings.vibration')} help={t('settings.vibrationHelp')} checked={prefs.vibration} onChange={(v) => set({ vibration: v })} />
      </section>

      <DataSection />
    </section>
  )
}
