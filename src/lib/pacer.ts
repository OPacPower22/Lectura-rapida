/** Palabras resaltadas a la vez por el marcapasos. */
export const PACER_WINDOW = 4

/** Separa un párrafo en palabras por espacios (solo para el resaltado visual). */
export function tokenize(paragraph: string): string[] {
  return paragraph.split(/\s+/).filter(Boolean)
}

/**
 * Posición del marcapasos tras `activeMs` de lectura a `wpm` palabras por minuto.
 * `wordCounts` son las palabras de cada párrafo desde el de inicio. Devuelve null al terminar.
 */
export function pacerPosition(activeMs: number, wpm: number, wordCounts: number[]): { paragraph: number; word: number } | null {
  let remaining = Math.floor((activeMs / 60000) * wpm)
  for (let paragraph = 0; paragraph < wordCounts.length; paragraph++) {
    if (remaining < wordCounts[paragraph]) return { paragraph, word: remaining }
    remaining -= wordCounts[paragraph]
  }
  return null
}
