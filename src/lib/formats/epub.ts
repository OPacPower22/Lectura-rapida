import JSZip from 'jszip'
import { t } from '../../i18n'
import type { Chapter } from '../storage/db'
import { hasWords, ImportError, MAX_IMPORT_BYTES, type ImportedDocument } from './types'

const BLOCKS = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, div'
const CONTENT_FILE = /\.(x?html?|xml)$/i

function clean(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim()
}

function parseXml(text: string): Document {
  return new DOMParser().parseFromString(text, 'application/xml')
}

function parseXhtml(text: string): Document {
  const doc = new DOMParser().parseFromString(text, 'application/xhtml+xml')
  return doc.getElementsByTagName('parsererror').length ? new DOMParser().parseFromString(text, 'text/html') : doc
}

function byTag(root: Document | Element, tag: string): Element[] {
  return Array.from(root.getElementsByTagNameNS('*', tag))
}

/** Resuelve `href` relativo a la carpeta de `base` dentro del ZIP. */
function resolvePath(base: string, href: string): string {
  const parts = base.split('/').slice(0, -1)
  for (const seg of decodeURIComponent(href.split('#')[0]).split('/')) {
    if (seg === '..') parts.pop()
    else if (seg && seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

/** DRM: contenido de texto cifrado. La ofuscación de fuentes tipográficas no cuenta. */
async function hasDrm(zip: JSZip): Promise<boolean> {
  const file = zip.file('META-INF/encryption.xml')
  if (!file) return false
  const doc = parseXml(await file.async('text'))
  return byTag(doc, 'CipherReference').some((ref) => CONTENT_FILE.test(ref.getAttribute('URI') ?? ''))
}

function chapterFrom(doc: Document, fallbackTitle: string): Chapter {
  const body = doc.body ?? doc.documentElement
  let title = ''
  const paragraphs: string[] = []
  for (const el of Array.from(body.querySelectorAll(BLOCKS))) {
    if (el.querySelector(BLOCKS)) continue
    const text = clean(el.textContent)
    if (!text) continue
    if (!title && /^h[1-3]$/i.test(el.localName)) title = text
    else paragraphs.push(text)
  }
  return { title: title || fallbackTitle, paragraphs }
}

async function navTitles(zip: JSZip, opfPath: string, opf: Document): Promise<Map<string, string>> {
  const titles = new Map<string, string>()
  const navItem = byTag(opf, 'item').find((i) => (i.getAttribute('properties') ?? '').split(' ').includes('nav'))
  if (!navItem) return titles
  const navPath = resolvePath(opfPath, navItem.getAttribute('href') ?? '')
  const text = await zip.file(navPath)?.async('text')
  if (!text) return titles
  for (const a of byTag(parseXhtml(text), 'a')) {
    const href = a.getAttribute('href')
    if (href) titles.set(resolvePath(navPath, href), clean(a.textContent))
  }
  return titles
}

export async function importEpub(data: ArrayBuffer): Promise<ImportedDocument> {
  if (data.byteLength > MAX_IMPORT_BYTES) throw new ImportError('too-large')
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(data)
  } catch {
    throw new ImportError('invalid')
  }
  if (await hasDrm(zip)) throw new ImportError('drm')

  const container = await zip.file('META-INF/container.xml')?.async('text')
  const opfPath = container && byTag(parseXml(container), 'rootfile')[0]?.getAttribute('full-path')
  const opfText = opfPath ? await zip.file(opfPath)?.async('text') : undefined
  if (!opfPath || !opfText) throw new ImportError('invalid')
  const opf = parseXml(opfText)

  const meta = (tag: string) => clean(byTag(opf, tag)[0]?.textContent) || undefined
  const manifest = new Map(
    byTag(opf, 'item').map((i) => [i.getAttribute('id') ?? '', { href: i.getAttribute('href') ?? '', props: i.getAttribute('properties') ?? '' }]),
  )
  const titles = await navTitles(zip, opfPath, opf)

  const chapters: Chapter[] = []
  for (const ref of byTag(opf, 'itemref')) {
    const item = manifest.get(ref.getAttribute('idref') ?? '')
    if (!item || item.props.split(' ').includes('nav')) continue
    const path = resolvePath(opfPath, item.href)
    const text = await zip.file(path)?.async('text')
    if (!text) continue
    const chapter = chapterFrom(parseXhtml(text), titles.get(path) ?? '')
    if (hasWords([chapter])) chapters.push(chapter)
  }
  if (chapters.length === 0) throw new ImportError('no-content')

  const title = meta('title') ?? t('import.untitledBook')
  const author = meta('creator')
  return {
    title,
    author,
    lang: meta('language'),
    chapters,
    source: { type: 'libro', title, author, year: meta('date')?.slice(0, 4), publisher: meta('publisher') },
  }
}
