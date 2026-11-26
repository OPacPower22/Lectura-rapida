import { t } from '../i18n'
import type { Source } from './storage/db'

/** Autores escritos «Apellido, I.» y separados por «;». */
function authors(s: Source): string[] {
  return (s.author ?? '').split(';').map((a) => a.trim()).filter(Boolean)
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`
}

const withPeriod = (s: string) => (/[.?!]$/.test(s) ? s : `${s}.`)
const year = (s: Source) => s.year?.trim() || 's. f.'

/** Obras independientes (libro, página web, documento) llevan el título en cursiva; los artículos no. */
const italicTitle = (s: Source) => s.type !== 'articulo'

/**
 * Referencia bibliográfica en APA 7 simplificado. Devuelve el texto y el tramo que va en cursiva.
 * Libro: `Autor. (Año). *Título*. Editorial.` · Artículo o web: `Autor. (Año). Título. Sitio. URL`
 */
export function formatReference(s: Source): { text: string; italic: [number, number] | null } {
  const list = authors(s)
  const title = s.title.trim()
  let text = ''
  let italic: [number, number] | null = null
  const addTitle = () => {
    if (italicTitle(s)) italic = [text.length, text.length + title.length]
    text += withPeriod(title)
  }
  if (list.length) {
    text += `${withPeriod(joinList(list))} (${year(s)}). `
    addTitle()
  } else {
    addTitle()
    text += ` (${year(s)}).`
  }
  if (s.publisher?.trim()) text += ` ${withPeriod(s.publisher.trim())}`
  if (s.url?.trim()) text += ` ${s.url.trim()}`
  return { text, italic }
}

const surname = (author: string) => author.split(',')[0].trim()

/** Cita en el texto: `(Autor, Año, p. N)`. */
export function inTextCitation(s: Source | undefined, page?: number): string {
  if (!s) return `(${t('citation.deleted')})`
  const list = authors(s)
  const who =
    list.length === 0
      ? s.title.trim()
      : list.length === 1
        ? surname(list[0])
        : list.length === 2
          ? `${surname(list[0])} y ${surname(list[1])}`
          : `${surname(list[0])} et al.`
  return `(${who}, ${year(s)}${page !== undefined ? `, p. ${page}` : ''})`
}

/** Lista de referencias sin duplicados, en orden alfabético (español). */
export function bibliography(sources: Source[]): ReturnType<typeof formatReference>[] {
  const unique = [...new Map(sources.map((s) => [s.id ?? s.title, s])).values()]
  return unique
    .map(formatReference)
    .sort((a, b) => a.text.localeCompare(b.text, 'es', { sensitivity: 'base' }))
}
