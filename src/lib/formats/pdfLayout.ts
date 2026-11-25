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

/** Líneas repetidas en la misma posición en más de la mitad de las páginas (encabezados y pies). */
function repeatedLines(lines: PdfLine[]): Set<string> {
  const pages = new Set(lines.map((l) => l.page))
  if (pages.size < 2) return new Set()
  const seen = new Map<string, Set<number>>()
  for (const l of lines) {
    const key = `${l.text.trim()}@${Math.round(l.y)}`
    if (!seen.has(key)) seen.set(key, new Set())
    seen.get(key)!.add(l.page)
  }
  return new Set([...seen].filter(([, p]) => p.size / pages.size > 0.5).map(([k]) => k))
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
  const repeated = repeatedLines(lines)
  const kept = lines.filter((l) => l.text.trim() && !repeated.has(`${l.text.trim()}@${Math.round(l.y)}`))

  const pages = [...new Set(kept.map((l) => l.page))].sort((a, b) => a - b)
  const result: { text: string; page: number }[] = []
  let previous: PdfLine | null = null

  for (const page of pages) {
    for (const column of readingOrder(kept.filter((l) => l.page === page))) {
      let prevInColumn: PdfLine | null = null
      for (const line of column) {
        const text = line.text.replace(/\s+/g, ' ').trim()
        let startNew: boolean
        if (!previous) startNew = true
        else if (prevInColumn) startNew = prevInColumn.y - line.y > 1.5 * Math.max(line.height, prevInColumn.height) * 1.2
        else startNew = SENTENCE_END.test(result[result.length - 1].text)

        if (startNew) result.push({ text, page: line.page })
        else result[result.length - 1].text = joinLines(result[result.length - 1].text, text)
        previous = line
        prevInColumn = line
      }
    }
  }
  return result
}
