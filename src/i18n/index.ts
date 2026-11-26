import { es } from './es'

/** Idioma activo de la interfaz (por ahora solo español). */
export function currentLang(): string {
  return 'es'
}

export type MessageKey = keyof typeof es

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const template: string = es[key]
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/** Claves base con variantes de plural (`.one`, `.other`). */
export type PluralKey = { [K in MessageKey]: K extends `${infer B}.other` ? B : never }[MessageKey]

/** Texto con plural correcto para el idioma activo (Intl.PluralRules). `{count}` se interpola. */
export function tPlural(base: PluralKey, count: number, params?: Record<string, string | number>): string {
  const rule = new Intl.PluralRules(currentLang()).select(count)
  const key = (`${base}.${rule}` in es ? `${base}.${rule}` : `${base}.other`) as MessageKey
  return t(key, { ...params, count })
}
