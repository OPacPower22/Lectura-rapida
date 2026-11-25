export const LANGS = ['es', 'en', 'fr', 'pt', 'it', 'de'] as const
export type Lang = (typeof LANGS)[number]

/** Normaliza un código de idioma (p. ej. "es-MX") a uno de los admitidos, o null. */
export function normalizeLang(code: string | undefined): Lang | null {
  const base = code?.toLowerCase().split(/[-_]/)[0]
  return (LANGS as readonly string[]).includes(base ?? '') ? (base as Lang) : null
}
