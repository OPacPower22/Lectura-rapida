import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JSZip from 'jszip'
import { MemoryRouter } from 'react-router-dom'
import { t } from '../../i18n'
import { loadPreferences } from '../../lib/preferences'
import { db } from '../../lib/storage/db'
import { getSetting } from '../../lib/storage/settings'
import { PreferencesProvider } from '../../app/PreferencesProvider'
import { SettingsPage } from './SettingsPage'

const downloads = vi.hoisted(() => [] as { blob: Blob; name: string }[])
vi.mock('../../lib/download', async (orig) => ({
  ...(await orig<typeof import('../../lib/download')>()),
  downloadBlob: (blob: Blob, name: string) => downloads.push({ blob, name }),
}))

beforeEach(async () => {
  downloads.length = 0
  await db.delete()
  await db.open()
})

const show = () => render(<MemoryRouter><PreferencesProvider><SettingsPage /></PreferencesProvider></MemoryRouter>)

describe('SettingsPage', () => {
  it('guarda las preferencias al cambiarlas', async () => {
    show()
    await userEvent.click(await screen.findByRole('checkbox', { name: t('settings.probes') }))
    await userEvent.selectOptions(screen.getByLabelText(t('settings.fontSize')), '3')
    await waitFor(async () => expect(await loadPreferences()).toMatchObject({ probesInFreeReading: false, fontIndex: 3 }))
  })

  it('crear un respaldo descarga el ZIP y muestra la fecha del último', async () => {
    await db.notes.add({ sourceId: 1, kind: 'idea', text: 'x', lang: 'es', createdAt: 1 })
    show()
    expect(await screen.findByText(t('settings.backup.never'))).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: t('settings.backup.create') }))
    await waitFor(() => expect(downloads).toHaveLength(1))
    expect(downloads[0].name).toMatch(/^lectura-rapida-respaldo-\d{4}-\d{2}-\d{2}\.zip$/)
    expect(typeof (await getSetting('backup:lastAt'))).toBe('number')
    expect(screen.queryByText(t('settings.backup.never'))).toBeNull()
  })

  it('restaurar un archivo que no es respaldo muestra el error y no borra nada', async () => {
    await db.notes.add({ sourceId: 1, kind: 'idea', text: 'x', lang: 'es', createdAt: 1 })
    show()
    const zip = new JSZip()
    zip.file('otro.txt', 'hola')
    const file = new File([await zip.generateAsync({ type: 'arraybuffer' })], 'algo.zip', { type: 'application/zip' })
    await userEvent.upload(await screen.findByLabelText(t('settings.restore.file')), file)
    expect(await screen.findByText(t('settings.restore.error.not-a-backup'))).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t('settings.restore.confirm') })).toBeNull()
    expect(await db.notes.count()).toBe(1)
  })
})
