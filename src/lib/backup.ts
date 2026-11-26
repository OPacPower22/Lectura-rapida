import type JSZipType from 'jszip'
import { db } from './storage/db'
import { setSetting } from './storage/settings'

export const BACKUP_FORMAT = 'lectura-rapida-respaldo'
export const BACKUP_VERSION = 1
export const BACKUP_LAST_KEY = 'backup:lastAt'
const DATA_FILE = 'datos.json'
const WEEK_MS = 7 * 86_400_000

export type RestoreError = 'not-a-backup' | 'unsupported-version' | 'corrupt'

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

async function loadZip(): Promise<typeof JSZipType> {
  return (await import('jszip')).default
}

/** Convierte fechas y archivos a marcadores JSON. Los archivos se añaden al ZIP (o se omiten). */
function encode(value: unknown, onBlob: (b: Blob) => Json | undefined): Json | undefined {
  if (value instanceof Date) return { $date: value.toISOString() }
  if (value instanceof Blob) return onBlob(value)
  if (Array.isArray(value)) return value.map((v) => encode(v, onBlob) ?? null)
  if (value && typeof value === 'object') {
    const out: Record<string, Json> = {}
    for (const [k, v] of Object.entries(value)) {
      const e = encode(v, onBlob)
      if (e !== undefined) out[k] = e
    }
    return out
  }
  if (value === undefined) return undefined
  return value as Json
}

function isMarker(v: unknown, key: '$date' | '$file'): v is Record<string, string> {
  return !!v && typeof v === 'object' && !Array.isArray(v) && typeof (v as Record<string, unknown>)[key] === 'string'
}

function decode(value: unknown, files: Map<string, Blob>): unknown {
  if (isMarker(value, '$date')) return new Date(value.$date)
  if (isMarker(value, '$file')) return files.get(value.$file)
  if (Array.isArray(value)) return value.map((v) => decode(v, files))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      const d = decode(v, files)
      if (d !== undefined) out[k] = d
    }
    return out
  }
  return value
}

function fileRefs(value: unknown, acc: { path: string; type: string }[] = []): { path: string; type: string }[] {
  if (isMarker(value, '$file')) acc.push({ path: value.$file, type: value.type ?? '' })
  else if (Array.isArray(value)) value.forEach((v) => fileRefs(v, acc))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => fileRefs(v, acc))
  return acc
}

export async function exportBackup(opts: { includeFiles: boolean }): Promise<Blob> {
  const JSZip = await loadZip()
  const zip = new JSZip()
  const tablas: Record<string, Json> = {}
  let n = 0
  for (const table of db.tables) {
    const rows = await table.toArray()
    tablas[table.name] = rows.map(
      (row) =>
        encode(row, (blob) => {
          if (!opts.includeFiles) return undefined
          const path = `archivos/${table.name}-${++n}`
          // El Blob va tal cual al ZIP, sin base64 ni recomprimir (PDF y EPUB ya vienen comprimidos).
          zip.file(path, blob.arrayBuffer(), { binary: true, compression: 'STORE' })
          return { $file: path, type: blob.type }
        }) ?? null,
    )
  }
  zip.file(
    DATA_FILE,
    JSON.stringify({
      formato: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      esquema: db.verno,
      exportadoEl: new Date().toISOString(),
      tablas,
    }),
  )
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/zip' })
  await setSetting(BACKUP_LAST_KEY, Date.now())
  return blob
}

interface Parsed {
  tablas: Record<string, unknown[]>
  exportedAt: string
  files: Map<string, Blob>
}

const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const str = (v: unknown) => typeof v === 'string'

/** Campos imprescindibles de cada tabla: sin ellos la app mostraría cifras sin sentido o fallaría. */
function validRow(table: string, r: Record<string, unknown>): boolean {
  switch (table) {
    case 'readingSessions':
      return str(r.kind) && num(r.startedAt) && num(r.activeMs) && num(r.words)
    case 'notes':
      return num(r.sourceId) && str(r.kind) && str(r.text)
    case 'cards':
      return str(r.front) && str(r.back) && isMarker((r.fsrs as Record<string, unknown> | undefined)?.due, '$date')
    case 'projects':
      return str(r.title) && Array.isArray(r.sections)
    default:
      return true
  }
}

async function parse(file: Blob): Promise<{ ok: true; data: Parsed } | { ok: false; error: RestoreError }> {
  const JSZip = await loadZip()
  let zip: JSZipType
  const buffer = await file.arrayBuffer()
  try {
    zip = await JSZip.loadAsync(buffer, { checkCRC32: true })
  } catch {
    // Empieza como un ZIP («PK\x03\x04») pero no se puede leer: está dañado o truncado.
    const head = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength))
    const looksZip = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04
    return { ok: false, error: looksZip ? 'corrupt' : 'not-a-backup' }
  }
  const entry = zip.file(DATA_FILE)
  if (!entry) return { ok: false, error: 'not-a-backup' }
  let json: Record<string, unknown>
  try {
    json = JSON.parse(await entry.async('string'))
  } catch {
    return { ok: false, error: 'corrupt' }
  }
  if (!json || typeof json !== 'object' || json.formato !== BACKUP_FORMAT) return { ok: false, error: 'not-a-backup' }
  if (typeof json.version !== 'number' || typeof json.esquema !== 'number') return { ok: false, error: 'corrupt' }
  if (json.version > BACKUP_VERSION || json.esquema > db.verno) return { ok: false, error: 'unsupported-version' }
  const tablas = json.tablas
  if (!tablas || typeof tablas !== 'object' || Array.isArray(tablas)) return { ok: false, error: 'corrupt' }
  const known = new Set(db.tables.map((t) => t.name))
  for (const [name, rows] of Object.entries(tablas)) {
    if (!known.has(name) || !Array.isArray(rows) || rows.some((r) => !r || typeof r !== 'object' || !validRow(name, r))) {
      return { ok: false, error: 'corrupt' }
    }
  }
  const files = new Map<string, Blob>()
  for (const ref of fileRefs(tablas)) {
    const f = zip.file(ref.path)
    if (!f) return { ok: false, error: 'corrupt' }
    try {
      files.set(ref.path, new Blob([await f.async('arraybuffer')], { type: ref.type }))
    } catch {
      return { ok: false, error: 'corrupt' }
    }
  }
  return {
    ok: true,
    data: {
      tablas: tablas as Record<string, unknown[]>,
      exportedAt: typeof json.exportadoEl === 'string' ? json.exportadoEl : '',
      files,
    },
  }
}

/** Lee y valida un respaldo sin escribir nada. */
export async function inspectBackup(
  file: Blob,
): Promise<
  { ok: true; summary: Record<string, number>; exportedAt: string; documentsWithoutFile: number } | { ok: false; error: RestoreError }
> {
  const r = await parse(file)
  if (!r.ok) return r
  const summary = Object.fromEntries(Object.entries(r.data.tablas).map(([k, rows]) => [k, rows.length]))
  // Solo los PDF y EPUB tienen archivo; los documentos web y de texto nunca lo llevan.
  const documentsWithoutFile = (r.data.tablas.documents ?? []).filter((d) => {
    const doc = d as Record<string, unknown>
    return (doc.format === 'pdf' || doc.format === 'epub') && !isMarker(doc.file, '$file')
  }).length
  return { ok: true, summary, exportedAt: r.data.exportedAt, documentsWithoutFile }
}

/** Reemplaza todos los datos por los del respaldo, en una sola transacción. */
export async function restoreBackup(file: Blob): Promise<void> {
  const r = await parse(file)
  if (!r.ok) throw new Error(r.error)
  const { tablas, files, exportedAt } = r.data
  const exportedTime = Date.parse(exportedAt)
  const decoded = Object.fromEntries(Object.entries(tablas).map(([k, rows]) => [k, rows.map((row) => decode(row, files))]))
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear()
      const rows = decoded[table.name]
      if (rows?.length) await table.bulkAdd(rows)
    }
    // El respaldo restaurado cuenta como el último hecho (si no, la app pediría otro enseguida).
    if (Number.isFinite(exportedTime)) await db.settings.put({ key: BACKUP_LAST_KEY, value: exportedTime })
  })
}

export function backupDue(now: number, lastAt: number | undefined, hasData: boolean): boolean {
  if (!hasData) return false
  return lastAt === undefined || now - lastAt >= WEEK_MS
}

/** Hay algo que merezca respaldarse. */
export async function hasUserData(): Promise<boolean> {
  const counts = await Promise.all([db.readingSessions, db.notes, db.documents, db.cards, db.projects].map((t) => t.count()))
  return counts.some((c) => c > 0)
}
