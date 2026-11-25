import type { RouteObject } from 'react-router-dom'
import { ImportPage } from '../features/biblioteca/ImportPage'
import { LibraryPage } from '../features/biblioteca/LibraryPage'
import { DiagnosticPage } from '../features/diagnostico/DiagnosticPage'
import { GlossaryPage } from '../features/glosario/GlossaryPage'
import { HomePage } from '../features/inicio/HomePage'
import { DocumentReaderPage } from '../features/lector/DocumentReaderPage'
import { PasteReadPage } from '../features/lector/PasteReadPage'
import { HistoryPage } from '../features/progreso/HistoryPage'
import { PhysicalSessionPage } from '../features/sesion-fisica/PhysicalSessionPage'
import { CardsPage } from '../features/retencion/CardsPage'
import { AttentionPage } from '../features/atencion/AttentionPage'
import { DayView } from '../features/programa/DayView'
import { ProgramPage } from '../features/programa/ProgramPage'
import { ReviewPage } from '../features/retencion/ReviewPage'
import { Layout } from './Layout'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'diagnostico', element: <DiagnosticPage /> },
      { path: 'biblioteca', element: <LibraryPage /> },
      { path: 'biblioteca/importar', element: <ImportPage /> },
      { path: 'biblioteca/fisico', element: <PhysicalSessionPage /> },
      { path: 'biblioteca/:id', element: <DocumentReaderPage /> },
      { path: 'leer', element: <PasteReadPage /> },
      { path: 'progreso', element: <HistoryPage /> },
      { path: 'glosario', element: <GlossaryPage /> },
      { path: 'repasar', element: <ReviewPage /> },
      { path: 'fichas', element: <CardsPage /> },
      { path: 'atencion', element: <AttentionPage /> },
      { path: 'programa', element: <ProgramPage /> },
      { path: 'programa/dia/:day', element: <DayView /> },
    ],
  },
]
