import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { requestPersistentStorage } from '../../lib/storage/persist'

const NOTICE_KEY = 'lectura-rapida.persistNoticeDismissed'

function noticeDismissed(): boolean {
  try {
    return localStorage.getItem(NOTICE_KEY) === '1'
  } catch {
    return false
  }
}

function dismissNotice(): void {
  try {
    localStorage.setItem(NOTICE_KEY, '1')
  } catch {
    // Sin almacenamiento: el aviso se oculta solo en esta visita.
  }
}

const linkClass = 'block rounded-lg border border-line bg-surface p-4 font-medium hover:border-accent'

export function HomePage() {
  const [hasDiagnostic, setHasDiagnostic] = useState<boolean | null>(null)
  const [persisted, setPersisted] = useState(true)
  const [dismissed, setDismissed] = useState(noticeDismissed)

  useEffect(() => {
    db.readingSessions
      .where('kind')
      .equals('diagnostico')
      .count()
      .then((n) => setHasDiagnostic(n > 0))
      .catch(() => setHasDiagnostic(false))
    requestPersistentStorage().then(setPersisted)
  }, [])

  return (
    <section className="mx-auto max-w-prose space-y-6">
      <h1 className="text-3xl font-bold">{t('app.title')}</h1>
      <p>{t('home.lead')}</p>
      {!persisted && !dismissed && (
        <div role="status" className="flex flex-wrap items-start gap-3 rounded border border-warn-line bg-warn-bg p-3 text-warn-ink">
          <p className="flex-1">{t('storage.notPersistent')}</p>
          <button
            type="button"
            onClick={() => {
              dismissNotice()
              setDismissed(true)
            }}
            className="rounded border border-warn-strong px-3 py-1"
          >
            {t('storage.dismiss')}
          </button>
        </div>
      )}
      {hasDiagnostic === false && (
        <div className="rounded-lg border-2 border-accent bg-accent-soft p-4">
          <Link to="/diagnostico" className="text-xl font-semibold text-accent-ink underline">
            {t('home.diagnosticCta')}
          </Link>
          <p className="mt-1 text-muted">{t('home.diagnosticHelp')}</p>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {hasDiagnostic && (
          <Link to="/diagnostico" className={linkClass}>
            {t('nav.diagnostic')}
          </Link>
        )}
        <Link to="/biblioteca" className={linkClass}>
          {t('home.libraryCta')}
        </Link>
        <Link to="/leer" className={linkClass}>
          {t('home.readCta')}
        </Link>
        <Link to="/progreso" className={linkClass}>
          {t('home.progressCta')}
        </Link>
      </div>
    </section>
  )
}
