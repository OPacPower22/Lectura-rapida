import { HashRouter, Route, Routes } from 'react-router-dom'
import { DiagnosticPage } from '../features/diagnostico/DiagnosticPage'
import { HomePage } from '../features/inicio/HomePage'
import { PasteReadPage } from '../features/lector/PasteReadPage'
import { HistoryPage } from '../features/progreso/HistoryPage'
import { Layout } from './Layout'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="diagnostico" element={<DiagnosticPage />} />
          <Route path="leer" element={<PasteReadPage />} />
          <Route path="progreso" element={<HistoryPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
