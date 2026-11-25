import { forwardRef, type ReactNode } from 'react'
import { t } from '../../i18n'

interface Props {
  /** Fija la barra bajo la cabecera (false si ya la contiene un contenedor fijo). */
  sticky?: boolean
  onFont: (delta: -1 | 1) => void
  onDistracted(): void
  onFinish(): void
  extra?: ReactNode
}

/** Barra fija durante la lectura. La ref apunta al botón «Me distraje» (recibe el foco tras un sondeo). */
export const ReadingToolbar = forwardRef<HTMLButtonElement, Props>(function ReadingToolbar(
  { sticky = true, onFont, onDistracted, onFinish, extra },
  distractedRef,
) {
  return (
    <div
      className={`${sticky ? 'sticky top-[var(--header-h,0px)] z-[1] bg-page' : ''} mb-3 flex flex-wrap items-center gap-2 border-b border-line py-2 text-sm sm:text-base`}
    >
      <button
        type="button"
        onClick={() => onFont(-1)}
        aria-label={t('reader.fontSmaller')}
        className="rounded border border-line-strong px-2 py-1 sm:px-3"
      >
        A−
      </button>
      <button
        type="button"
        onClick={() => onFont(1)}
        aria-label={t('reader.fontLarger')}
        className="rounded border border-line-strong px-2 py-1 sm:px-3"
      >
        A+
      </button>
      {extra}
      <span className="flex-1" />
      <button
        ref={distractedRef}
        type="button"
        onClick={onDistracted}
        className="rounded border border-warn-strong px-2 py-1 text-warn-ink sm:px-3"
      >
        {t('reader.distracted')}
      </button>
      <button
        type="button"
        onClick={onFinish}
        className="rounded bg-accent px-3 py-1 font-medium text-on-accent hover:bg-accent-hover sm:px-4"
      >
        {t('reader.finish')}
      </button>
    </div>
  )
})
