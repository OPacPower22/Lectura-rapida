import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './index.css'
import { shareTargetToImportHash } from './lib/formats/share'
import { applyTheme, loadThemeChoice, resolveTheme, systemPrefersDark } from './lib/theme'

// Contenido recibido desde «Compartir» (Web Share Target): se abre la pantalla de importación.
const shared = shareTargetToImportHash(window.location, import.meta.env.BASE_URL)
if (shared) window.history.replaceState(null, '', import.meta.env.BASE_URL + shared)

applyTheme(resolveTheme(loadThemeChoice(), systemPrefersDark()))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
