import { useEffect, useRef, type RefObject } from 'react'

/**
 * Al cambiar de paso dentro de una misma pantalla (no al montarla), lleva el foco al primer encabezado
 * del paso nuevo: el teclado no se pierde en `<body>` y el lector de pantalla anuncia dónde estás.
 */
export function useFocusHeading(step: unknown, ref: RefObject<HTMLElement | null>, selector = 'h2'): void {
  const previous = useRef(step)
  useEffect(() => {
    if (previous.current === step) return
    previous.current = step
    const heading = ref.current?.querySelector<HTMLElement>(selector)
    if (!heading) return
    heading.setAttribute('tabindex', '-1')
    heading.focus()
  }, [step, ref, selector])
}
