/** Mantiene la pantalla encendida mientras `active` (Screen Wake Lock API, si existe). */
export function keepScreenOn(): () => void {
  let sentinel: { release(): Promise<void> } | null = null
  let stopped = false
  const request = async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } }
      if (!nav.wakeLock || document.visibilityState !== 'visible' || stopped) return
      sentinel = await nav.wakeLock.request('screen')
    } catch {
      // Sin permiso o sin soporte: la sesión sigue igual.
    }
  }
  // El sistema libera el bloqueo al ocultar la página; se vuelve a pedir al regresar.
  const onVisibility = () => {
    if (document.visibilityState === 'visible') request()
  }
  document.addEventListener('visibilitychange', onVisibility)
  request()
  return () => {
    stopped = true
    document.removeEventListener('visibilitychange', onVisibility)
    sentinel?.release().catch(() => {})
  }
}
