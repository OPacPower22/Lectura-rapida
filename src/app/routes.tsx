import type { RouteObject } from 'react-router-dom'
import { ImportPage } from '../features/biblioteca/ImportPage'
import { LibraryPage } from '../features/biblioteca/LibraryPage'
import { DiagnosticPage } from '../features/diagnostico/DiagnosticPage'
import { HomePage } from '../features/inicio/HomePage'
import { DocumentReaderPage } from '../features/lector/DocumentReaderPage'
import { PasteReadPage } from '../features/lector/PasteReadPage'
import { HistoryPage } from '../features/progreso/HistoryPage'
import { Layout } from './Layout'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'diagnostico', element: <DiagnosticPage /> },
      { path: 'biblioteca', element: <LibraryPage /> },
      { path: 'biblioteca/importar', element: <ImportPage /> },
      { path: 'biblioteca/:id', element: <DocumentReaderPage /> },
      { path: 'leer', element: <PasteReadPage /> },
      { path: 'progreso', element: <HistoryPage /> },
    ],
  },
]
