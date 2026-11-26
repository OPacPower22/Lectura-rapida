import { Suspense, type ReactNode } from 'react'
import type { RouteObject } from 'react-router-dom'
import { DiagnosticPage } from '../features/diagnostico/DiagnosticPage'
import { HomePage } from '../features/inicio/HomePage'
import { Layout } from './Layout'
import * as Pages from './lazyPages'

const deferred = (node: ReactNode) => <Suspense fallback={null}>{node}</Suspense>

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'diagnostico', element: <DiagnosticPage /> },
      { path: 'biblioteca', element: deferred(<Pages.LibraryPage />) },
      { path: 'biblioteca/importar', element: deferred(<Pages.ImportPage />) },
      { path: 'biblioteca/fisico', element: deferred(<Pages.PhysicalSessionPage />) },
      { path: 'biblioteca/:id', element: deferred(<Pages.DocumentReaderPage />) },
      { path: 'leer', element: deferred(<Pages.PasteReadPage />) },
      { path: 'practica', element: deferred(<Pages.PracticePage />) },
      { path: 'practica/:textId', element: deferred(<Pages.PracticeRunPage />) },
      { path: 'cuaderno', element: deferred(<Pages.NotebookPage />) },
      { path: 'fuentes', element: deferred(<Pages.SourcesPage />) },
      { path: 'proyectos', element: deferred(<Pages.ProjectsPage />) },
      { path: 'proyectos/:id', element: deferred(<Pages.ProjectEditor />) },
      { path: 'ajustes', element: deferred(<Pages.SettingsPage />) },
      { path: 'progreso', element: deferred(<Pages.ProgressPage />) },
      { path: 'glosario', element: deferred(<Pages.GlossaryPage />) },
      { path: 'repasar', element: deferred(<Pages.ReviewPage />) },
      { path: 'fichas', element: deferred(<Pages.CardsPage />) },
      { path: 'atencion', element: deferred(<Pages.AttentionPage />) },
      { path: 'programa', element: deferred(<Pages.ProgramPage />) },
      { path: 'programa/dia/:day', element: deferred(<Pages.DayView />) },
    ],
  },
]
