import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './index.css'
import { applyTheme, loadThemeChoice, resolveTheme, systemPrefersDark } from './lib/theme'

applyTheme(resolveTheme(loadThemeChoice(), systemPrefersDark()))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
