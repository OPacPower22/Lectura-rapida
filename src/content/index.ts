import type { PracticeText, TextKind } from './types'

type TextMeta = Omit<PracticeText, 'body'>

const bodies = import.meta.glob<string>('./textos/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const metas = import.meta.glob<TextMeta>('./textos/*.json', { import: 'default', eager: true })

const texts: PracticeText[] = Object.entries(metas).map(([path, meta]) => {
  const body = bodies[path.replace(/\.json$/, '.md')]
  if (body === undefined) throw new Error(`Falta el cuerpo del texto ${path}`)
  return { ...meta, body: body.trim() }
})

export function getPracticeTexts(): PracticeText[] {
  return texts
}

export function getPracticeText(id: string): PracticeText | undefined {
  return texts.find((t) => t.id === id)
}

export function diagnosticTextFor(kind: TextKind): PracticeText {
  const text = getPracticeText(`diag-${kind}`)
  if (!text) throw new Error(`No hay texto de diagnóstico para ${kind}`)
  return text
}
