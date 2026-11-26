import { useState, type KeyboardEvent } from 'react'

/** Índice activo (hover o teclado) para el aviso y la retícula. */
export function useActive(n: number) {
  const [active, setActive] = useState<number | null>(null)
  const onKeyDown = (e: KeyboardEvent) => {
    if (n === 0) return
    if (e.key === 'ArrowLeft') setActive((a) => Math.max(0, (a ?? n - 1) - 1))
    else if (e.key === 'ArrowRight') setActive((a) => Math.min(n - 1, (a ?? 0) + 1))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(n - 1)
    else return
    e.preventDefault()
  }
  return {
    active,
    setActive,
    svgProps: {
      tabIndex: 0,
      onFocus: () => setActive(n - 1),
      onBlur: () => setActive(null),
      onPointerLeave: () => setActive(null),
      onKeyDown,
    },
  }
}
