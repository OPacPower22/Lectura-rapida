import { useEffect, type RefObject } from 'react'

/**
 * Diálogo modal: mientras está montado, todo lo que queda fuera (cabecera, navegación, resto de la página)
 * se marca `inert`, así el foco y el lector de pantalla no pueden salir de él. Al cerrarse se restaura.
 */
export function useInertOutside(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => inertOutside(ref.current), [ref])
}

/** Marca `inert` todo lo que está fuera de `el` y devuelve la función que lo restaura. */
export function inertOutside(el: HTMLElement | null): () => void {
  const changed: Element[] = []
  for (let node = el; node && node !== document.body && node.parentElement; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling === node || sibling.hasAttribute('inert') || sibling.tagName === 'SCRIPT') continue
      sibling.setAttribute('inert', '')
      changed.push(sibling)
    }
  }
  return () => changed.forEach((e) => e.removeAttribute('inert'))
}
