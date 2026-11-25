import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { requestPersistentStorage } from '../../lib/storage/persist'

const linkClass = 'block rounded-lg border border-stone-200 bg-white p-4 font-medium hover:border-blue-700'

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
        <p role="status" className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">
          {t('storage.notPersistent')}
        </p>
      )}
      {hasDiagnostic === false && (
        <div className="rounded-lg border-2 border-blue-700 bg-blue-50 p-4">
          <Link to="/diagnostico" className="text-xl font-semibold text-blue-800 underline">
            {t('home.diagnosticCta')}
          </Link>
          <p className="mt-1 text-stone-700">{t('home.diagnosticHelp')}</p>
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
