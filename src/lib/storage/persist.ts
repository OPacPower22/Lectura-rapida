/** Pide al navegador que no borre los datos locales. Devuelve false si no lo concede o no lo soporta. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
