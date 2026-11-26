import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CARDS_CHANGED, countDue } from '../lib/storage/cards'
import { ThemePicker } from '../features/ajustes/ThemePicker'
import { t } from '../i18n'
import { PreferencesProvider } from './PreferencesProvider'
import { RouteAnnouncer } from './RouteAnnouncer'

const items = [
  { to: '/', label: 'nav.home', end: true },
  { to: '/programa', label: 'nav.program', end: false },
  { to: '/biblioteca', label: 'nav.library', end: false },
  { to: '/repasar', label: 'nav.review', end: false },
  { to: '/cuaderno', label: 'nav.notebook', end: false },
  { to: '/progreso', label: 'nav.progress', end: false },
  { to: '/ajustes', label: 'nav.settings', end: false },
] as const

/** Publica la altura de la cabecera fija en --header-h para que las barras del lector se sitúen debajo. */
function useHeaderHeight(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
}

export function Layout() {
  const header = useRef<HTMLElement>(null)
  useHeaderHeight(header)
  const location = useLocation()
  const [due, setDue] = useState(0)
  useEffect(() => {
    const refresh = () =>
      countDue(new Date())
        .then(setDue)
        .catch(() => setDue(0))
    refresh()
    window.addEventListener(CARDS_CHANGED, refresh)
    return () => window.removeEventListener(CARDS_CHANGED, refresh)
  }, [location])
  return (
    <div className="min-h-screen bg-page text-ink">
      <a
        href="#contenido"
        onClick={(e) => {
          // Con rutas en el hash, el enlace no debe cambiar la ruta: solo mueve el foco.
          e.preventDefault()
          document.getElementById('contenido')?.focus()
        }}
        className="sr-only z-30 rounded bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
      >
        {t('a11y.skip')}
      </a>
      <header ref={header} className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-2 gap-y-1 px-2 py-1 sm:px-4 sm:py-2">
          <nav aria-label={t('nav.label')} className="flex flex-wrap gap-0.5 sm:gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded px-2 py-1.5 text-sm sm:px-3 sm:py-2 sm:text-base ${isActive ? 'bg-accent text-on-accent' : 'hover:bg-hover'}`
                }
              >
                {item.label === 'nav.review' && due > 0 ? t('nav.reviewCount', { count: due }) : t(item.label)}
              </NavLink>
            ))}
          </nav>
          <ThemePicker />
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className="px-4 py-8 focus:outline-none">
        <PreferencesProvider>
          <Outlet />
        </PreferencesProvider>
      </main>
      <RouteAnnouncer />
    </div>
  )
}
