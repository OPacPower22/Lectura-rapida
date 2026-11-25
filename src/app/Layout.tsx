import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { countDue } from '../lib/storage/cards'
import { ThemePicker } from '../features/ajustes/ThemePicker'
import { t } from '../i18n'

const items = [
  { to: '/', label: 'nav.home', end: true },
  { to: '/programa', label: 'nav.program', end: false },
  { to: '/diagnostico', label: 'nav.diagnostic', end: false },
  { to: '/biblioteca', label: 'nav.library', end: false },
  { to: '/repasar', label: 'nav.review', end: false },
  { to: '/atencion', label: 'nav.attention', end: false },
  { to: '/progreso', label: 'nav.progress', end: false },
  { to: '/glosario', label: 'nav.glossary', end: false },
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
    countDue(new Date())
      .then(setDue)
      .catch(() => setDue(0))
  }, [location])
  return (
    <div className="min-h-screen bg-page text-ink">
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
      <main className="px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
