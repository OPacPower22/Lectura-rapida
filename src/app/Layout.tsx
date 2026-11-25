import { NavLink, Outlet } from 'react-router-dom'
import { ThemePicker } from '../features/ajustes/ThemePicker'
import { t } from '../i18n'

const items = [
  { to: '/', label: 'nav.home', end: true },
  { to: '/diagnostico', label: 'nav.diagnostic', end: false },
  { to: '/biblioteca', label: 'nav.library', end: false },
  { to: '/progreso', label: 'nav.progress', end: false },
  { to: '/glosario', label: 'nav.glossary', end: false },
] as const

export function Layout() {
  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <nav aria-label={t('nav.label')} className="flex flex-wrap gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded px-3 py-2 ${isActive ? 'bg-accent text-on-accent' : 'hover:bg-hover'}`
                }
              >
                {t(item.label)}
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
