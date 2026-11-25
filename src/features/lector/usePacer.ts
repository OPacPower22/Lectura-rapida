import { useEffect, useMemo, useRef, useState } from 'react'
import { pacerPosition, tokenize } from '../../lib/pacer'

export const PACER_MIN = 100
export const PACER_MAX = 800

/**
 * Posición del marcapasos sobre `paragraphs` desde `startParagraph`. Avanza con el tiempo activo
 * de la sesión (`elapsedMs`), así que se detiene durante los sondeos y con la pestaña oculta.
 */
export function usePacer(opts: {
  enabled: boolean
  wpm: number
  paragraphs: string[]
  startParagraph: number
  elapsedMs: () => number
}): { paragraph: number; word: number } | null {
  const { enabled, wpm, paragraphs, startParagraph, elapsedMs } = opts
  const counts = useMemo(() => paragraphs.slice(startParagraph).map((p) => tokenize(p).length), [paragraphs, startParagraph])
  const [position, setPosition] = useState<{ paragraph: number; word: number } | null>(null)
  const base = useRef({ elapsed: 0, words: 0 })

  // Al activar o cambiar la velocidad, continúa desde la palabra actual.
  useEffect(() => {
    if (!enabled) return
    base.current = { elapsed: elapsedMs(), words: base.current.words }
    const tick = () => {
      const pos = pacerPosition(elapsedMs() - base.current.elapsed + (base.current.words / wpm) * 60000, wpm, counts)
      setPosition(pos ? { paragraph: pos.paragraph + startParagraph, word: pos.word } : null)
    }
    tick()
    const id = setInterval(tick, 100)
    return () => {
      clearInterval(id)
      const elapsed = elapsedMs() - base.current.elapsed
      base.current.words += Math.floor((elapsed / 60000) * wpm)
    }
  }, [enabled, wpm, counts, startParagraph, elapsedMs])

  useEffect(() => {
    if (!enabled) base.current = { elapsed: 0, words: 0 }
  }, [enabled])

  return enabled ? position : null
}
