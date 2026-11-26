import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { MARKER_BG, type Marker } from './markers'

/** Título de página con el icono y el color de marcador de su tipo de actividad (el icono es decorativo). */
export function PageTitle({ Icon, marker, children }: { Icon: LucideIcon; marker: Marker; children: ReactNode }) {
  return (
    <h1 className="flex items-center gap-3 text-3xl font-bold">
      <span className={`marker-chip ${MARKER_BG[marker]}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span>{children}</span>
    </h1>
  )
}
