import { lazy } from 'react'

// Pantallas cargadas bajo demanda: mantienen pequeño el paquete inicial (JSZip, Readability,
// pdfjs, lecciones y ejercicios del programa solo se descargan al usarse).
export const ImportPage = lazy(() => import('../features/biblioteca/ImportPage').then((m) => ({ default: m.ImportPage })))
export const DocumentReaderPage = lazy(() => import('../features/lector/DocumentReaderPage').then((m) => ({ default: m.DocumentReaderPage })))
export const LibraryPage = lazy(() => import('../features/biblioteca/LibraryPage').then((m) => ({ default: m.LibraryPage })))
export const PhysicalSessionPage = lazy(() => import('../features/sesion-fisica/PhysicalSessionPage').then((m) => ({ default: m.PhysicalSessionPage })))
export const ProgramPage = lazy(() => import('../features/programa/ProgramPage').then((m) => ({ default: m.ProgramPage })))
export const DayView = lazy(() => import('../features/programa/DayView').then((m) => ({ default: m.DayViewRoute })))
export const GlossaryPage = lazy(() => import('../features/glosario/GlossaryPage').then((m) => ({ default: m.GlossaryPage })))
export const AttentionPage = lazy(() => import('../features/atencion/AttentionPage').then((m) => ({ default: m.AttentionPage })))
export const CardsPage = lazy(() => import('../features/retencion/CardsPage').then((m) => ({ default: m.CardsPage })))
export const ReviewPage = lazy(() => import('../features/retencion/ReviewPage').then((m) => ({ default: m.ReviewPage })))
export const PasteReadPage = lazy(() => import('../features/lector/PasteReadPage').then((m) => ({ default: m.PasteReadPage })))
export const ProgressPage = lazy(() => import('../features/progreso/ProgressPage').then((m) => ({ default: m.ProgressPage })))
export const PracticePage = lazy(() => import('../features/practica/PracticePage').then((m) => ({ default: m.PracticePage })))
export const PracticeRunPage = lazy(() => import('../features/practica/PracticePage').then((m) => ({ default: m.PracticeRunPage })))
export const NotebookPage = lazy(() => import('../features/cuaderno/NotebookPage').then((m) => ({ default: m.NotebookPage })))
export const SourcesPage = lazy(() => import('../features/cuaderno/SourcesPage').then((m) => ({ default: m.SourcesPage })))
