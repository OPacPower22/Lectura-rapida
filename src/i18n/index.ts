import { es } from './es'

export type MessageKey = keyof typeof es

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const template: string = es[key]
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}
