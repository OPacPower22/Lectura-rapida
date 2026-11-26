import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CARDS_CHANGED, countDue } from '../lib/storage/cards'
import { ThemePicker } from '../features/ajustes/ThemePicker'
import { CalendarCheck, ChartNoAxesCombined, House, Layers, LibraryBig, NotebookPen, Settings } from 'lucide-react'
import { t } from '../i18n'
import { BrandMark } from '../ui/BrandMark'
import { PreferencesProvider } from './PreferencesProvider'
import { RouteAnnouncer } from './RouteAnnouncer'

const items = [
  { to: '/', label: 'nav.home', end: true, Icon: House },
  { to: '/programa', label: 'nav.program', end: false, Icon: CalendarCheck },
  { to: '/biblioteca', label: 'nav.library', end: false, Icon: LibraryBig },
  { to: '/repasar', label: 'nav.review', end: false, Icon: Layers },
  { to: '/cuaderno', label: 'nav.notebook', end: false, Icon: NotebookPen },
  { to: '/progreso', label: 'nav.progress', end: false, Icon: ChartNoAxesCombined },
  { to: '/ajustes', label: 'nav.settings', end: false, Icon: Settings },
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
      <header ref={header} className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 sm:px-4 lg:flex-nowrap">
          <div className="flex items-center gap-2">
            <BrandMark className="size-8 shrink-0" />
            <span className="font-serif text-lg font-bold tracking-tight">{t('app.title')}</span>
          </div>
          <div className="order-2 ml-auto lg:order-3">
            <ThemePicker />
          </div>
          <nav
            aria-label={t('nav.label')}
            className="order-3 -mx-3 flex w-[calc(100%+1.5rem)] gap-1 overflow-x-auto px-3 pb-1 lg:order-2 lg:mx-0 lg:w-auto lg:flex-1 lg:justify-center lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {items.map(({ to, label, end, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-accent text-on-accent shadow-sm' : 'text-muted hover:bg-hover hover:text-ink'
                  }`
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {label === 'nav.review' && due > 0 ? t('nav.reviewCount', { count: due }) : t(label)}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className="px-4 pb-16 pt-6 focus:outline-none sm:pt-8">
        <PreferencesProvider>
          <Outlet />
        </PreferencesProvider>
      </main>
      <RouteAnnouncer />
    </div>
  )
}
