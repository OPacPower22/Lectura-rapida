import type { RouteObject } from 'react-router-dom'
import { DiagnosticPage } from '../features/diagnostico/DiagnosticPage'
import { HomePage } from '../features/inicio/HomePage'
import { PasteReadPage } from '../features/lector/PasteReadPage'
import { HistoryPage } from '../features/progreso/HistoryPage'
import { Layout } from './Layout'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'diagnostico', element: <DiagnosticPage /> },
      { path: 'leer', element: <PasteReadPage /> },
      { path: 'progreso', element: <HistoryPage /> },
    ],
  },
]
