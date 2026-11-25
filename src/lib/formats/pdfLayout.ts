export interface PdfLine {
  text: string
  /** Coordenadas PDF: `y` crece hacia arriba. */
  x: number
  y: number
  width: number
  height: number
  page: number
}

const SENTENCE_END = /[.!?:;»"”)\]]$/

const PAGE_NUMBER = /^\s*(\d+|[ivxlcdm]+)\s*$/i

/**
 * Encabezados y pies de página:
 * - líneas idénticas en la misma posición en al menos 2 páginas y el 30 % de ellas (cubre encabezados
 *   alternos de páginas pares e impares);
 * - en la primera y última línea de cada página, si es corta (≤ 4 palabras), lo mismo ignorando los
 *   dígitos («Capítulo 3 · 45»);
 * - números de página sueltos (arábigos o romanos) en la primera o última línea.
 */
function marginLines(lines: PdfLine[]): Set<PdfLine> {
  const drop = new Set<PdfLine>()
  const pages = [...new Set(lines.map((l) => l.page))]
  const bands = new Set<PdfLine>()
  for (const page of pages) {
    const onPage = lines.filter((l) => l.page === page)
    bands.add(onPage.reduce((a, b) => (b.y > a.y ? b : a)))
    bands.add(onPage.reduce((a, b) => (b.y < a.y ? b : a)))
  }
  if (pages.length >= 2) {
    const count = (key: (l: PdfLine) => string, pool: PdfLine[]) => {
      const seen = new Map<string, Set<number>>()
      for (const l of pool) {
        const k = key(l)
        if (!seen.has(k)) seen.set(k, new Set())
        seen.get(k)!.add(l.page)
      }
      for (const l of pool) {
        const n = seen.get(key(l))!.size
        if (n >= 2 && n / pages.length >= 0.3) drop.add(l)
      }
    }
    count((l) => `${l.text.trim()}@${Math.round(l.y)}`, lines)
    const short = [...bands].filter((l) => l.text.replace(/\d+/g, '').trim().split(/\s+/).length <= 4)
    count((l) => `${l.text.trim().replace(/\d+/g, '#')}@${Math.round(l.y)}`, short)
  }
  for (const l of bands) if (PAGE_NUMBER.test(l.text)) drop.add(l)
  return drop
}

/** Ordena las líneas de una página: columna izquierda completa y luego la derecha, de arriba abajo. */
function readingOrder(lines: PdfLine[]): PdfLine[][] {
  const byY = (a: PdfLine, b: PdfLine) => b.y - a.y || a.x - b.x
  const minX = Math.min(...lines.map((l) => l.x))
  const maxRight = Math.max(...lines.map((l) => l.x + l.width))
  const mid = (minX + maxRight) / 2
  const right = lines.filter((l) => l.x >= mid - 1)
  if (right.length < 3) return [[...lines].sort(byY)]
  const left = lines.filter((l) => l.x < mid - 1)
  return [left.sort(byY), right.sort(byY)]
}

function joinLines(previous: string, next: string): string {
  if (/\p{L}-$/u.test(previous) && /^\p{Ll}/u.test(next)) return previous.slice(0, -1) + next
  return `${previous} ${next}`
}

/**
 * Reconstruye párrafos a partir de las líneas de un PDF: quita encabezados y pies repetidos,
 * respeta columnas, une guiones de fin de línea y conserva la página de inicio de cada párrafo.
 */
export function paragraphsFromLines(lines: PdfLine[]): { text: string; page: number }[] {
  const nonEmpty = lines.filter((l) => l.text.trim())
  const margins = marginLines(nonEmpty)
  const kept = nonEmpty.filter((l) => !margins.has(l))

  const pages = [...new Set(kept.map((l) => l.page))].sort((a, b) => a - b)
  const result: { text: string; page: number }[] = []
  let previous: PdfLine | null = null

  for (const page of pages) {
    for (const column of readingOrder(kept.filter((l) => l.page === page))) {
      let prevInColumn: PdfLine | null = null
      const leftEdge = Math.min(...column.map((l) => l.x))
      for (const line of column) {
        const text = line.text.replace(/\s+/g, ' ').trim()
        const endsSentence = result.length > 0 && SENTENCE_END.test(result[result.length - 1].text)
        // Sangría de primera línea: empieza claramente a la derecha del margen de la columna.
        const indented = line.x > leftEdge + 0.6 * line.height
        let startNew: boolean
        if (!previous) startNew = true
        else if (prevInColumn) {
          startNew = prevInColumn.y - line.y > 1.5 * Math.max(line.height, prevInColumn.height) * 1.2 || (indented && endsSentence)
        } else startNew = endsSentence

        if (startNew) result.push({ text, page: line.page })
        else result[result.length - 1].text = joinLines(result[result.length - 1].text, text)
        previous = line
        prevInColumn = line
      }
    }
  }
  return result
}
