import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './index.css'
import { applyShareTarget } from './lib/formats/share'
import { applyTheme, loadThemeChoice, resolveTheme, systemPrefersDark } from './lib/theme'

// Contenido recibido desde «Compartir» (Web Share Target): se abre la pantalla de importación.
applyShareTarget(import.meta.env.BASE_URL)

applyTheme(resolveTheme(loadThemeChoice(), systemPrefersDark()))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
