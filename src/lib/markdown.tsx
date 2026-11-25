import type { ReactNode } from 'react'

/**
 * Renderizador de un subconjunto de Markdown para las lecciones: encabezados ##/###, párrafos,
 * listas (- y 1.), citas (>), **negrita**, *cursiva* y enlaces https. Todo se construye como
 * elementos de React: el HTML que aparezca en el texto se muestra literalmente.
 */
const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index! > last) out.push(text.slice(last, m.index))
    const key = `${keyBase}-${i++}`
    if (m[1] !== undefined) out.push(<strong key={key}>{inline(m[1], key)}</strong>)
    else if (m[2] !== undefined) out.push(<em key={key}>{inline(m[2], key)}</em>)
    else if (/^https:\/\//.test(m[4])) {
      out.push(
        <a key={key} href={m[4]} rel="noopener noreferrer" target="_blank" className="text-accent-ink underline">
          {m[3]}
        </a>,
      )
    } else out.push(m[3])
    last = m.index! + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const join = (lines: string[]) => lines.map((l) => l.trim()).join(' ')

export function renderMarkdown(md: string): ReactNode[] {
  const blocks = md.replace(/\r\n?/g, '\n').split(/\n\s*\n/)
  return blocks
    .map((block, b) => {
      const lines = block.split('\n').filter((l) => l.trim())
      if (lines.length === 0) return null
      const key = `b${b}`
      const first = lines[0]
      if (first.startsWith('### ')) return <h3 key={key} className="mt-4 text-lg font-semibold">{inline(first.slice(4), key)}</h3>
      if (first.startsWith('## ')) return <h2 key={key} className="mt-5 text-xl font-semibold">{inline(first.slice(3), key)}</h2>
      if (first.startsWith('# ')) return <h2 key={key} className="mt-5 text-xl font-semibold">{inline(first.slice(2), key)}</h2>
      if (lines.every((l) => l.trimStart().startsWith('>'))) {
        return (
          <blockquote key={key} className="border-l-4 border-line-strong pl-4 italic">
            {inline(join(lines.map((l) => l.trimStart().replace(/^>\s?/, ''))), key)}
          </blockquote>
        )
      }
      if (lines.every((l) => /^\s*-\s+/.test(l))) {
        return (
          <ul key={key} className="list-disc space-y-1 pl-6">
            {lines.map((l, i) => (
              <li key={i}>{inline(l.replace(/^\s*-\s+/, ''), `${key}-${i}`)}</li>
            ))}
          </ul>
        )
      }
      if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
        return (
          <ol key={key} className="list-decimal space-y-1 pl-6">
            {lines.map((l, i) => (
              <li key={i}>{inline(l.replace(/^\s*\d+\.\s+/, ''), `${key}-${i}`)}</li>
            ))}
          </ol>
        )
      }
      return <p key={key}>{inline(join(lines), key)}</p>
    })
    .filter(Boolean)
}
