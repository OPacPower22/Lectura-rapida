import { useId, useState, type ReactNode } from 'react'

export interface TabDef {
  id: string
  label: string
  panel: ReactNode
}

/** Pestañas accesibles (patrón WAI-ARIA): todos los paneles existen y los inactivos quedan ocultos. */
export function Tabs({ label, tabs, initial }: { label: string; tabs: TabDef[]; initial?: string }) {
  const base = useId()
  const [current, setCurrent] = useState(initial ?? tabs[0].id)
  const tabId = (id: string) => `${base}-tab-${id}`
  const panelId = (id: string) => `${base}-panel-${id}`
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            id={tabId(tab.id)}
            role="tab"
            type="button"
            aria-selected={current === tab.id}
            aria-controls={panelId(tab.id)}
            tabIndex={current === tab.id ? 0 : -1}
            onClick={() => setCurrent(tab.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
              const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].id
              setCurrent(next)
              document.getElementById(tabId(next))?.focus()
            }}
            className={`rounded px-3 py-2 ${current === tab.id ? 'bg-accent text-on-accent' : 'border border-line-strong hover:bg-hover'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={panelId(tab.id)} aria-labelledby={tabId(tab.id)} hidden={current !== tab.id}>
          {tab.panel}
        </div>
      ))}
    </div>
  )
}
