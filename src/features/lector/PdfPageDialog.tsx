import { useEffect, useRef, useState } from 'react'
import { t } from '../../i18n'
import { loadPdfjs } from '../../lib/formats/pdf'

/** Muestra una página del PDF original (figuras, tablas, orden de texto dudoso). */
export function PdfPageDialog({ file, page, onClose }: { file: Blob; page: number; onClose(): void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    closeButton.current?.focus()
    let cancelled = false
    let task: { destroy(): Promise<void> } | null = null
    ;(async () => {
      try {
        const pdfjs = await loadPdfjs()
        const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
        task = loading
        if (cancelled) return
        const pdf = await loading.promise
        const p = await pdf.getPage(page)
        const width = Math.min(window.innerWidth - 48, 900)
        const viewport = p.getViewport({ scale: width / p.getViewport({ scale: 1 }).width })
        const el = canvas.current
        if (cancelled || !el) return
        el.width = viewport.width
        el.height = viewport.height
        await p.render({ canvas: el, viewport }).promise
      } catch {
        if (!cancelled) setError(true)
      }
    })()
    return () => {
      cancelled = true
      task?.destroy().catch(() => {})
    }
  }, [file, page])

  return (
    <div className="fixed inset-0 z-30 overflow-auto bg-black/60 p-4" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="pdf-page-title" className="mx-auto max-w-4xl rounded-lg bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="pdf-page-title" className="font-semibold">
            {t('docreader.pageTitle', { page })}
          </h2>
          <button ref={closeButton} type="button" onClick={onClose} className="rounded border border-line-strong px-3 py-1">
            {t('docreader.close')}
          </button>
        </div>
        {error ? <p role="alert">{t('import.error.invalid')}</p> : <canvas ref={canvas} className="mx-auto max-w-full bg-white" />}
      </div>
    </div>
  )
}
