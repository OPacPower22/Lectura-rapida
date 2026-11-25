import { NavLink, Outlet } from 'react-router-dom'
import { t } from '../i18n'

const items = [
  { to: '/', label: 'nav.home', end: true },
  { to: '/diagnostico', label: 'nav.diagnostic', end: false },
  { to: '/leer', label: 'nav.read', end: false },
  { to: '/progreso', label: 'nav.progress', end: false },
] as const

export function Layout() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <nav aria-label={t('nav.label')} className="mx-auto flex max-w-4xl flex-wrap gap-1 px-4 py-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded px-3 py-2 ${isActive ? 'bg-blue-700 text-white' : 'hover:bg-stone-100'}`
              }
            >
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
