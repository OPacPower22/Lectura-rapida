import { useEffect, useState } from 'react'
import { t } from '../../i18n'
import { requestPersistentStorage } from '../../lib/storage/persist'
import { Dashboard } from './Dashboard'

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

export function HomePage() {
  const [persisted, setPersisted] = useState(true)
  const [dismissed, setDismissed] = useState(noticeDismissed)

  useEffect(() => {
    requestPersistentStorage().then(setPersisted)
  }, [])

  return (
    <section className="mx-auto max-w-5xl space-y-6">
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
      <Dashboard />
    </section>
  )
}
