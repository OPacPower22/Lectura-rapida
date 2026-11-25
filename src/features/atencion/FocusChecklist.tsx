import { useState } from 'react'
import { t } from '../../i18n'

const ITEMS = ['focus.phone', 'focus.notifications', 'focus.oneTab'] as const

/** Lista previa a un bloque de enfoque: preparar el entorno y fijar un objetivo. */
export function FocusChecklist({ onReady }: { onReady(goal: string): void }) {
  const [checked, setChecked] = useState<boolean[]>([false, false, false])
  const [goal, setGoal] = useState('')
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        onReady(goal.trim())
      }}
    >
      <h2 className="text-xl font-semibold">{t('focus.title')}</h2>
      <p>{t('focus.intro')}</p>
      {ITEMS.map((key, i) => (
        <label key={key} className="flex items-center gap-2">
          <input type="checkbox" checked={checked[i]} onChange={(e) => setChecked(checked.map((c, j) => (j === i ? e.target.checked : c)))} />
          {t(key)}
        </label>
      ))}
      <label className="block">
        <span className="mb-1 block font-medium">{t('focus.goal')}</span>
        <input value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full rounded border border-line-strong bg-surface p-2" />
      </label>
      <button type="submit" disabled={!checked.every(Boolean)} className="rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:bg-disabled">
        {t('focus.start')}
      </button>
    </form>
  )
}
