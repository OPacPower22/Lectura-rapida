import { forwardRef, type ReactNode } from 'react'
import { t } from '../../i18n'

interface Props {
  onFont: (delta: -1 | 1) => void
  onDistracted(): void
  onFinish(): void
  extra?: ReactNode
}

/** Barra fija durante la lectura. La ref apunta al botón «Me distraje» (recibe el foco tras un sondeo). */
export const ReadingToolbar = forwardRef<HTMLButtonElement, Props>(function ReadingToolbar(
  { onFont, onDistracted, onFinish, extra },
  distractedRef,
) {
  return (
    <div className="sticky top-0 z-[1] mb-4 flex flex-wrap items-center gap-2 border-b border-line bg-page/95 py-2">
      <button
        type="button"
        onClick={() => onFont(-1)}
        aria-label={t('reader.fontSmaller')}
        className="rounded border border-line-strong px-3 py-1"
      >
        A−
      </button>
      <button
        type="button"
        onClick={() => onFont(1)}
        aria-label={t('reader.fontLarger')}
        className="rounded border border-line-strong px-3 py-1"
      >
        A+
      </button>
      {extra}
      <span className="flex-1" />
      <button
        ref={distractedRef}
        type="button"
        onClick={onDistracted}
        className="rounded border border-warn-strong px-3 py-1 text-warn-ink"
      >
        {t('reader.distracted')}
      </button>
      <button
        type="button"
        onClick={onFinish}
        className="rounded bg-accent px-4 py-1 font-medium text-on-accent hover:bg-accent-hover"
      >
        {t('reader.finish')}
      </button>
    </div>
  )
})
