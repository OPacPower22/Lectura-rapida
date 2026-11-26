/** Etiquetas escritas con comas: sin espacios sobrantes, sin vacías y sin repetidas. */
export function parseTags(input: string): string[] {
  return [...new Set(input.split(',').map((s) => s.trim()).filter(Boolean))]
}
