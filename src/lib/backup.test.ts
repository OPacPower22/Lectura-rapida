// @vitest-environment node
import JSZip from 'jszip'
import { createEmptyCard } from 'ts-fsrs'
import { db } from './storage/db'
import { BACKUP_FORMAT, backupDue, exportBackup, inspectBackup, restoreBackup } from './backup'
import { dueCards } from './storage/cards'
import { getSetting, setSetting } from './storage/settings'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const DAY = 86_400_000

async function seed() {
  const due = new Date('2026-01-02T10:00:00Z')
  const last = new Date('2026-01-01T09:00:00Z')
  await db.readingSessions.add({ kind: 'libre', lang: 'es', startedAt: 1, endedAt: 2, activeMs: 60000, words: 200, wpm: 200 })
  await db.notes.add({ sourceId: 1, kind: 'idea', text: 'nota «ñ»', lang: 'es', createdAt: 5, tags: ['t'] })
  await db.cards.add({ kind: 'ficha', front: 'f', back: 'b', lang: 'es', fsrs: { ...createEmptyCard(last), due, last_review: last }, createdAt: 1 })
  await db.sources.add({ type: 'documento', title: 'Doc', createdAt: 1 })
  await db.documents.add({
    sourceId: 1, format: 'pdf', lang: 'es', title: 'Doc', chapters: [{ title: '', paragraphs: ['a'] }], words: 1,
    file: new Blob([new Uint8Array([1, 2, 3, 250])], { type: 'application/pdf' }),
    position: { chapter: 0, paragraph: 0 }, createdAt: 1, lastOpenedAt: 1,
  })
  await db.programDays.add({ day: 1, startedAt: 1, steps: { lesson: 2 } })
  await setSetting('theme', 'dark')
  return { due, last }
}

async function zipWith(files: Record<string, string>): Promise<Blob> {
  const zip = new JSZip()
  for (const [k, v] of Object.entries(files)) zip.file(k, v)
  return zip.generateAsync({ type: 'blob' })
}

describe('respaldo', () => {
  it('ida y vuelta conserva fechas, archivos y todas las tablas', async () => {
    const { due, last } = await seed()
    const blob = await exportBackup({ includeFiles: true })
    expect(typeof (await getSetting<number>('backup:lastAt'))).toBe('number')
    await db.delete()
    await db.open()
    expect(await db.notes.count()).toBe(0)

    const info = await inspectBackup(blob)
    expect(info.ok).toBe(true)
    if (info.ok) expect(info.summary.notes).toBe(1)

    await restoreBackup(blob)
    const card = (await db.cards.toArray())[0]
    expect(card.fsrs.due).toBeInstanceOf(Date)
    expect(card.fsrs.due.getTime()).toBe(due.getTime())
    expect(card.fsrs.last_review).toBeInstanceOf(Date)
    expect((card.fsrs.last_review as Date).getTime()).toBe(last.getTime())
    expect(await dueCards(new Date('2026-02-01'))).toHaveLength(1)
    const doc = (await db.documents.toArray())[0]
    expect(doc.file).toBeInstanceOf(Blob)
    expect(doc.file!.type).toBe('application/pdf')
    expect([...new Uint8Array(await doc.file!.arrayBuffer())]).toEqual([1, 2, 3, 250])
    expect((await db.notes.toArray())[0]).toMatchObject({ text: 'nota «ñ»', tags: ['t'] })
    expect(await db.readingSessions.count()).toBe(1)
    expect(await db.programDays.get(1)).toMatchObject({ steps: { lesson: 2 } })
    expect(await getSetting('theme')).toBe('dark')
  })

  it('sin archivos: el documento vuelve sin file y lo demás intacto', async () => {
    await seed()
    const blob = await exportBackup({ includeFiles: false })
    const zip = await JSZip.loadAsync(blob)
    expect(Object.keys(zip.files).some((f) => f.startsWith('archivos/') && !zip.files[f].dir)).toBe(false)
    await restoreBackup(blob)
    const doc = (await db.documents.toArray())[0]
    expect(doc.file).toBeUndefined()
    expect(doc.title).toBe('Doc')
    expect(await db.cards.count()).toBe(1)
  })

  it.each([
    ['un archivo que no es ZIP', async () => new Blob(['hola']), 'not-a-backup'],
    ['un ZIP sin datos.json', () => zipWith({ 'otro.txt': 'x' }), 'not-a-backup'],
    ['un JSON de otra app', () => zipWith({ 'datos.json': JSON.stringify({ formato: 'otra', version: 1 }) }), 'not-a-backup'],
    ['una versión futura', () => zipWith({ 'datos.json': JSON.stringify({ formato: BACKUP_FORMAT, version: 2, esquema: 4, tablas: {} }) }), 'unsupported-version'],
    ['un esquema futuro', () => zipWith({ 'datos.json': JSON.stringify({ formato: BACKUP_FORMAT, version: 1, esquema: 99, tablas: {} }) }), 'unsupported-version'],
    ['un JSON dañado', () => zipWith({ 'datos.json': '{"formato": "lectura' }), 'corrupt'],
    ['tablas no válidas', () => zipWith({ 'datos.json': JSON.stringify({ formato: BACKUP_FORMAT, version: 1, esquema: 4, tablas: { notes: 'x' } }) }), 'corrupt'],
    ['un archivo referido que falta', () => zipWith({ 'datos.json': JSON.stringify({ formato: BACKUP_FORMAT, version: 1, esquema: 4, tablas: { documents: [{ id: 1, file: { $file: 'archivos/x', type: '' } }] } }) }), 'corrupt'],
  ])('rechaza %s sin tocar los datos', async (_name, make, error) => {
    await seed()
    const file = await make()
    expect(await inspectBackup(file)).toEqual({ ok: false, error })
    await expect(restoreBackup(file)).rejects.toThrow(error)
    expect(await db.notes.count()).toBe(1)
    expect(await db.documents.count()).toBe(1)
  })

  it('si la escritura falla a mitad, no se pierde nada', async () => {
    await seed()
    const zip = new JSZip()
    // Dos notas con el mismo id: la segunda inserción falla dentro de la transacción.
    zip.file('datos.json', JSON.stringify({
      formato: BACKUP_FORMAT, version: 1, esquema: 4, exportadoEl: '2026-01-01T00:00:00Z',
      tablas: { notes: [{ id: 1, text: 'a' }, { id: 1, text: 'b' }] },
    }))
    const file = await zip.generateAsync({ type: 'blob' })
    await expect(restoreBackup(file)).rejects.toThrow()
    expect((await db.notes.toArray())[0].text).toBe('nota «ñ»')
    expect(await db.cards.count()).toBe(1)
  })
})

describe('backupDue', () => {
  it('sin datos nunca avisa', () => expect(backupDue(10 * DAY, undefined, false)).toBe(false))
  it('con datos y sin respaldo, avisa', () => expect(backupDue(10 * DAY, undefined, true)).toBe(true))
  it('6 días: no', () => expect(backupDue(10 * DAY, 4 * DAY, true)).toBe(false))
  it('7 días: sí', () => expect(backupDue(11 * DAY, 4 * DAY, true)).toBe(true))
})
