import { useEffect, useRef } from 'react'
import { t } from '../../i18n'
import type { ProbeAnswer } from '../../lib/metrics'

export function ProbeDialog({ onAnswer }: { onAnswer: (answer: Exclude<ProbeAnswer, 'auto'>) => void }) {
  const firstButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    firstButton.current?.focus()
  }, [])

  const options: { answer: Exclude<ProbeAnswer, 'auto'>; label: string }[] = [
    { answer: 'texto', label: t('probe.text') },
    { answer: 'otra-cosa', label: t('probe.other') },
    { answer: 'no-se', label: t('probe.unsure') },
  ]

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="probe-title"
        className="w-full max-w-sm rounded-lg bg-white p-6 text-stone-900 shadow-xl"
      >
        <h2 id="probe-title" className="mb-4 text-lg font-semibold">
          {t('probe.question')}
        </h2>
        <div className="flex flex-col gap-2">
          {options.map((o, i) => (
            <button
              key={o.answer}
              ref={i === 0 ? firstButton : undefined}
              type="button"
              onClick={() => onAnswer(o.answer)}
              className="rounded-md border border-stone-300 px-4 py-2 text-left hover:bg-stone-100 focus:outline-2 focus:outline-blue-700"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
