const segmenters = new Map<string, Intl.Segmenter>()

function segmenterFor(lang: string): Intl.Segmenter {
  let s = segmenters.get(lang)
  if (!s) {
    s = new Intl.Segmenter(lang, { granularity: 'word' })
    segmenters.set(lang, s)
  }
  return s
}

/** Cuenta palabras según las reglas del idioma (sirve también para idiomas sin espacios). */
export function countWords(text: string, lang: string): number {
  let count = 0
  for (const segment of segmenterFor(lang).segment(text)) {
    if (segment.isWordLike) count++
  }
  return count
}

/** Divide un texto en párrafos separados por líneas en blanco. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}
