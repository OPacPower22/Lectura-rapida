import { Readability } from '@mozilla/readability'
import type { Chapter } from '../storage/db'
import { hasWords, ImportError, type ImportedDocument } from './types'

const BLOCKS = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, pre'
const NOISE = 'nav, aside, header, footer, script, style, noscript, form, iframe'

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Convierte un contenedor HTML en capítulos: cada h1-h3 abre un capítulo nuevo. */
function chaptersFrom(root: Element): Chapter[] {
  const chapters: Chapter[] = [{ title: '', paragraphs: [] }]
  for (const el of Array.from(root.querySelectorAll(BLOCKS))) {
    if (el.querySelector(BLOCKS)) continue // solo los bloques más internos
    const text = clean(el.textContent ?? '')
    if (!text) continue
    if (/^H[1-3]$/.test(el.tagName)) {
      chapters.push({ title: text, paragraphs: [] })
    } else {
      chapters[chapters.length - 1].paragraphs.push(text)
    }
  }
  return chapters.filter((c) => c.paragraphs.length > 0)
}

export function importHtml(html: string, opts: { url?: string } = {}): ImportedDocument {
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const pageTitle = clean(parsed.title) || clean(parsed.querySelector('h1')?.textContent ?? '')
  const article = new Readability(parsed.cloneNode(true) as Document).parse()

  let chapters: Chapter[] = []
  if (article?.content) {
    chapters = chaptersFrom(new DOMParser().parseFromString(article.content, 'text/html').body)
  }
  if (!hasWords(chapters)) {
    parsed.querySelectorAll(NOISE).forEach((el) => el.remove())
    chapters = chaptersFrom(parsed.body)
  }
  if (!hasWords(chapters)) throw new ImportError('no-content')

  const title = clean(article?.title ?? '') || pageTitle || chapters[0].paragraphs[0].slice(0, 80)
  const author = clean(article?.byline ?? '').replace(/^por\s+/i, '') || undefined
  return {
    title,
    author,
    lang: article?.lang || parsed.documentElement.lang || undefined,
    chapters,
    source: { type: 'web', title, author, url: opts.url },
  }
}
