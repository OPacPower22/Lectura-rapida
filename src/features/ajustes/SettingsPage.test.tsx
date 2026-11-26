import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JSZip from 'jszip'
import { MemoryRouter } from 'react-router-dom'
import { t, tPlural } from '../../i18n'
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

  it('un respaldo truncado muestra que está dañado', async () => {
    show()
    const zip = new JSZip()
    zip.file('datos.json', JSON.stringify({ formato: 'lectura-rapida-respaldo', version: 1, esquema: 4, tablas: {} }))
    const full = new Uint8Array(await zip.generateAsync({ type: 'arraybuffer' }))
    const file = new File([full.slice(0, full.length - 30)], 'respaldo.zip', { type: 'application/zip' })
    await userEvent.upload(await screen.findByLabelText(t('settings.restore.file')), file)
    expect(await screen.findByText(t('settings.restore.error.corrupt'))).toBeInTheDocument()
  })

  it('si la lectura del archivo falla de forma inesperada, lo dice', async () => {
    const backup = await import('../../lib/backup')
    vi.spyOn(backup, 'inspectBackup').mockRejectedValueOnce(new Error('boom'))
    show()
    const file = new File(['x'], 'r.zip', { type: 'application/zip' })
    await userEvent.upload(await screen.findByLabelText(t('settings.restore.file')), file)
    expect(await screen.findByText(t('settings.restore.error.corrupt'))).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('avisa si el respaldo no trae los PDF y EPUB, y deja volver a elegir el mismo archivo', async () => {
    await db.sources.add({ type: 'documento', title: 'D', createdAt: 1 })
    await db.documents.add({ sourceId: 1, format: 'pdf', lang: 'es', title: 'D', chapters: [], words: 0, position: { chapter: 0, paragraph: 0 }, createdAt: 1, lastOpenedAt: 1 })
    const { exportBackup } = await import('../../lib/backup')
    const blob = await exportBackup({ includeFiles: false })
    show()
    const input = (await screen.findByLabelText(t('settings.restore.file'))) as HTMLInputElement
    await userEvent.upload(input, new File([await blob.arrayBuffer()], 'r.zip', { type: 'application/zip' }))
    expect(await screen.findByText(tPlural('settings.restore.noFiles', 1))).toBeInTheDocument()
    expect(input.value).toBe('')
  })
})
