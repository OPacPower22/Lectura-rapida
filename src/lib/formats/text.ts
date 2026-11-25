import { splitParagraphs } from '../text'
import { hasWords, ImportError, type ImportedDocument } from './types'

export function importPlainText(text: string, opts: { title?: string; url?: string } = {}): ImportedDocument {
  const paragraphs = splitParagraphs(text.replace(/\r\n?/g, '\n')).map((p) => p.replace(/\s+/g, ' '))
  const chapters = [{ title: '', paragraphs }]
  if (!hasWords(chapters)) throw new ImportError('no-content')
  const title = opts.title?.trim() || paragraphs[0].slice(0, 80)
  return {
    title,
    chapters,
    source: opts.url ? { type: 'web', title, url: opts.url } : { type: 'documento', title },
  }
}
