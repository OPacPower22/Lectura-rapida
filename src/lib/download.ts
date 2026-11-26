import { t } from '../i18n'

/** Descarga un archivo generado en el navegador (no sale nada a la red). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Nombre de archivo seguro a partir de un título: sin acentos ni signos, con guiones. */
export function slugify(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || t('export.defaultName')
}
