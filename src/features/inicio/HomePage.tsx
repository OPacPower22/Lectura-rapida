import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { requestPersistentStorage } from '../../lib/storage/persist'

const linkClass = 'block rounded-lg border border-line bg-surface p-4 font-medium hover:border-accent'

export function HomePage() {
  const [hasDiagnostic, setHasDiagnostic] = useState<boolean | null>(null)
  const [persisted, setPersisted] = useState(true)

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
      {!persisted && (
        <p role="status" className="rounded border border-warn-line bg-warn-bg p-3 text-warn-ink">
          {t('storage.notPersistent')}
        </p>
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
