import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { t } from '../i18n'

const WAIT_MS = 5000

/**
 * Accesibilidad al navegar: pone el título de la página en la pestaña y, tras cada cambio de ruta
 * (no en la primera carga), lleva el foco al encabezado principal y lo anuncia a los lectores de pantalla.
 */
export function RouteAnnouncer() {
  const { pathname } = useLocation()
  const first = useRef(true)
  const live = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const main = document.getElementById('contenido')
    if (!main) return
    const announce = !first.current
    first.current = false
    const apply = () => {
      const h1 = main.querySelector('h1')
      if (!h1) return false
      const title = h1.textContent?.trim() || t('app.title')
      document.title = title === t('app.title') ? title : `${title} · ${t('app.title')}`
      if (announce) {
        h1.setAttribute('tabindex', '-1')
        h1.focus({ preventScroll: false })
        if (live.current) live.current.textContent = t('a11y.pageLoaded', { title })
      }
      return true
    }
    if (apply()) return
    // Las páginas se cargan bajo demanda: espera a que aparezca su encabezado.
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect()
    })
    observer.observe(main, { childList: true, subtree: true })
    const timer = setTimeout(() => observer.disconnect(), WAIT_MS)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [pathname])

  return <p ref={live} aria-live="polite" className="sr-only" />
}
