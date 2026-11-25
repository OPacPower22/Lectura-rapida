import { useContext, useEffect } from 'react'
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router-dom'
import { t } from '../../i18n'

function RouteBlocker() {
  const blocker = useBlocker(true)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm(t('reader.leaveConfirm'))) blocker.proceed()
    else blocker.reset()
  }, [blocker])
  return null
}

/**
 * Mientras `active`, pide confirmación antes de salir de la lectura: navegación interna
 * (solo dentro de un router de datos) y cierre o recarga de la pestaña.
 */
export function LeaveGuard({ active }: { active: boolean }) {
  const dataRouter = useContext(UNSAFE_DataRouterContext)

  useEffect(() => {
    if (!active) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [active])

  return active && dataRouter ? <RouteBlocker /> : null
}
