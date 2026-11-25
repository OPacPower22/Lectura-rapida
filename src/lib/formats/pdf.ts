import type { Chapter } from '../storage/db'
import { paragraphsFromLines, type PdfLine } from './pdfLayout'
import { hasWords, ImportError, MAX_IMPORT_BYTES, type ImportedDocument } from './types'

type PdfjsGetDocument = typeof import('pdfjs-dist').getDocument

interface TextItemLike {
  str: string
  transform: number[]
  width: number
  height: number
}

/** Carga pdfjs (y su worker) solo cuando se necesita. */
export async function loadPdfjs(): Promise<typeof import('pdfjs-dist')> {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  return pdfjs
}

/**
 * Agrupa los fragmentos de texto de una página en líneas (misma altura `y`). Si dentro de una fila hay
 * un hueco horizontal mayor que 1,5 veces la altura de la letra, son dos líneas distintas (columnas).
 */
export function linesOfPage(items: TextItemLike[], page: number): PdfLine[] {
  const rows = new Map<number, TextItemLike[]>()
  for (const item of items) {
    if (!item.str.trim()) continue
    const y = Math.round(item.transform[5] / 2) * 2
    if (!rows.has(y)) rows.set(y, [])
    rows.get(y)!.push(item)
  }
  const lines: PdfLine[] = []
  const heightOf = (i: TextItemLike) => i.height || Math.abs(i.transform[3])
  for (const [y, row] of rows) {
    row.sort((a, b) => a.transform[4] - b.transform[4])
    let group: TextItemLike[] = []
    const flush = () => {
      if (group.length === 0) return
      const first = group[0]
      const last = group[group.length - 1]
      let text = ''
      let end = first.transform[4]
      for (const item of group) {
        const gap = item.transform[4] - end
        text += text && gap > 1 && !text.endsWith(' ') && !item.str.startsWith(' ') ? ` ${item.str}` : item.str
        end = item.transform[4] + item.width
      }
      lines.push({
        text,
        x: first.transform[4],
        y,
        width: last.transform[4] + last.width - first.transform[4],
        height: Math.max(...group.map(heightOf)),
        page,
      })
      group = []
    }
    for (const item of row) {
      const prev = group[group.length - 1]
      if (prev && item.transform[4] - (prev.transform[4] + prev.width) > 1.5 * Math.max(heightOf(prev), heightOf(item))) flush()
      group.push(item)
    }
    flush()
  }
  return lines
}

interface OutlineEntry {
  title: string
  page: number
}

async function outlineStarts(pdf: Awaited<ReturnType<PdfjsGetDocument>['promise']>): Promise<OutlineEntry[]> {
  try {
    const outline = await pdf.getOutline()
    if (!outline?.length) return []
    const entries: OutlineEntry[] = []
    for (const item of outline) {
      const dest = typeof item.dest === 'string' ? await pdf.getDestination(item.dest) : item.dest
      if (!dest?.[0]) continue
      const index = await pdf.getPageIndex(dest[0])
      entries.push({ title: item.title.trim(), page: index + 1 })
    }
    return entries.sort((a, b) => a.page - b.page)
  } catch {
    return []
  }
}

/** Importa un PDF. pdfjs transfiere `data` a su worker: el llamador no debe reutilizar ese búfer. */
export async function importPdf(
  data: ArrayBuffer,
  opts: {
    fileName?: string
    onProgress?: (page: number, total: number) => void
    getDocument?: PdfjsGetDocument
  } = {},
): Promise<ImportedDocument> {
  if (data.byteLength > MAX_IMPORT_BYTES) throw new ImportError('too-large')
  const getDocument = opts.getDocument ?? (await loadPdfjs()).getDocument

  const task = getDocument({ data: new Uint8Array(data) })
  try {
    let pdf: Awaited<ReturnType<PdfjsGetDocument>['promise']>
    try {
      pdf = await task.promise
    } catch {
      throw new ImportError('invalid')
    }
    return await extract(pdf, opts)
  } finally {
    await task.destroy()
  }
}

async function extract(
  pdf: Awaited<ReturnType<PdfjsGetDocument>['promise']>,
  opts: { fileName?: string; onProgress?: (page: number, total: number) => void },
): Promise<ImportedDocument> {
  const lines: PdfLine[] = []
  let chars = 0
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n)
    const content = await page.getTextContent()
    const pageLines = linesOfPage(content.items as TextItemLike[], n)
    chars += pageLines.reduce((sum, l) => sum + l.text.trim().length, 0)
    lines.push(...pageLines)
    opts.onProgress?.(n, pdf.numPages)
  }
  if (chars / pdf.numPages < 20) throw new ImportError('no-text')

  const paragraphs = paragraphsFromLines(lines)
  const starts = await outlineStarts(pdf)
  const chapters: Chapter[] = []
  const open = (title: string) => chapters.push({ title, paragraphs: [], pages: [] })
  if (starts.length === 0 || starts[0].page > 1) open('')
  let next = 0
  for (const p of paragraphs) {
    while (next < starts.length && starts[next].page <= p.page) open(starts[next++].title)
    const current = chapters[chapters.length - 1]
    current.paragraphs.push(p.text)
    current.pages!.push(p.page)
  }
  const nonEmpty = chapters.filter((c) => c.paragraphs.length > 0)
  if (!hasWords(nonEmpty)) throw new ImportError('no-text')

  let info: { Title?: string; Author?: string; Language?: string } = {}
  try {
    info = ((await pdf.getMetadata()).info ?? {}) as typeof info
  } catch {
    // Metadatos opcionales.
  }
  const title = info.Title?.trim() || opts.fileName?.replace(/\.pdf$/i, '') || 'Documento PDF'
  const author = info.Author?.trim() || undefined
  return {
    title,
    author,
    lang: info.Language || undefined,
    chapters: nonEmpty,
    source: { type: 'documento', title, author },
  }
}
