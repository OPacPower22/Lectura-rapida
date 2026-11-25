import { useEffect, useRef, type RefObject } from 'react'

export const FONT_SIZES = [16, 18, 20, 22, 24, 28]

/** Devuelve el foco a `target` cuando se cierra un sondeo (el fondo ya no es inerte). */
export function useFocusAfterProbe(probeOpen: boolean, target: RefObject<HTMLElement | null>) {
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !probeOpen) target.current?.focus()
    wasOpen.current = probeOpen
  }, [probeOpen, target])
}
