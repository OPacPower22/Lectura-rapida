/**
 * La app recibe contenido compartido (Web Share Target) en `<base>compartir?title&text&url`.
 * Devuelve el hash de la pantalla de importación con esos datos, o null si la ruta es otra.
 */
export function shareTargetToImportHash(location: { pathname: string; search: string }, base: string): string | null {
  if (location.pathname !== `${base}compartir`) return null
  const params = new URLSearchParams(location.search)
  if (!params.get('url')) {
    const found = params.get('text')?.match(/https?:\/\/\S+/)
    if (found) params.set('url', found[0])
  }
  const query = params.toString()
  return `#/biblioteca/importar${query ? `?${query}` : ''}`
}

/** Si la app se abrió desde «Compartir», reescribe la URL hacia la pantalla de importación. */
export function applyShareTarget(base: string): void {
  const hash = shareTargetToImportHash(window.location, base)
  if (hash) window.history.replaceState(null, '', base + hash)
}
