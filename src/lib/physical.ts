/** Palabras por página = promedio de palabras en unas líneas de muestra × líneas por página. */
export function estimateWordsPerPage(wordsPerLine: number[], linesPerPage: number): number {
  const average = wordsPerLine.reduce((a, b) => a + b, 0) / wordsPerLine.length
  return Math.round(average * linesPerPage)
}

/** Palabras leídas entre la página inicial y la final, ambas incluidas. */
export function physicalWords(from: number, to: number, wordsPerPage: number): number {
  if (to < from) throw new RangeError('La página final no puede ser menor que la inicial')
  return (to - from + 1) * wordsPerPage
}
