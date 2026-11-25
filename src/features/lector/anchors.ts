import type { TextAnchor } from '../../lib/storage/db'

function paragraphOf(node: Node): HTMLElement | null {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
  return el?.closest<HTMLElement>('[data-paragraph]') ?? null
}

/**
 * Convierte una selección en un ancla (capítulo, párrafo, inicio, fin) sobre el texto plano del párrafo.
 * Devuelve 'cross-paragraph' si la selección abarca varios párrafos y null si no hay texto seleccionado.
 */
export function rangeToAnchor(range: Range, chapter: number): TextAnchor | 'cross-paragraph' | null {
  if (range.collapsed) return null
  const startP = paragraphOf(range.startContainer)
  const endP = paragraphOf(range.endContainer)
  if (!startP || !endP) return null
  if (startP !== endP) return 'cross-paragraph'

  const before = document.createRange()
  before.selectNodeContents(startP)
  before.setEnd(range.startContainer, range.startOffset)
  const selected = range.toString()
  let start = before.toString().length
  let end = start + selected.length
  start += selected.length - selected.trimStart().length
  end -= selected.length - selected.trimEnd().length
  if (end <= start) return null
  return { chapter, paragraph: Number(startP.dataset.paragraph), start, end }
}

export interface Segment {
  text: string
  markId?: number
}

/** Divide un párrafo en tramos marcados y sin marcar; en solapamientos gana la marca con id mayor. */
export function segmentsWithMarks(text: string, marks: { start: number; end: number; id: number }[]): Segment[] {
  if (marks.length === 0) return [{ text }]
  const owner: (number | undefined)[] = new Array(text.length).fill(undefined)
  for (const m of [...marks].sort((a, b) => a.id - b.id)) {
    for (let i = Math.max(0, m.start); i < Math.min(text.length, m.end); i++) owner[i] = m.id
  }
  const segments: Segment[] = []
  for (let i = 0; i < text.length; i++) {
    const last = segments[segments.length - 1]
    if (last && last.markId === owner[i]) last.text += text[i]
    else segments.push(owner[i] === undefined ? { text: text[i] } : { text: text[i], markId: owner[i] })
  }
  return segments
}

/** Oración del párrafo que contiene la posición `index` (contexto para el glosario). */
export function sentenceAround(text: string, index: number): string {
  let start = 0
  for (const m of text.matchAll(/[.!?…]+["»”)]?\s+/g)) {
    const end = m.index! + m[0].length
    if (end > index) return text.slice(start, end).trim()
    start = end
  }
  return text.slice(start).trim()
}
