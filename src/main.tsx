import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { t } from './i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <h1>{t('app.title')}</h1>
  </StrictMode>,
)
