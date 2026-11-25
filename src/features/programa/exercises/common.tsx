import { t } from '../../../i18n'

export const primary = 'rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:bg-disabled'
export const field = 'w-full rounded border border-line-strong bg-surface p-2'

export function DoneButton({ onClick, disabled }: { onClick(): void; disabled?: boolean }) {
  return (
    <button type="button" className={primary} onClick={onClick} disabled={disabled}>
      {t('program.exerciseDone')}
    </button>
  )
}
