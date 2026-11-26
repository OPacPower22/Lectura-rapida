import { formatReference } from '../lib/citation'
import type { Source } from '../lib/storage/db'

/** Entrada bibliográfica con el título en cursiva. */
export function Reference({ source }: { source: Source }) {
  const { text, italic } = formatReference(source)
  if (!italic) return <span data-reference="">{text}</span>
  const [a, b] = italic
  return (
    <span data-reference="">
      {text.slice(0, a)}
      <i>{text.slice(a, b)}</i>
      {text.slice(b)}
    </span>
  )
}
