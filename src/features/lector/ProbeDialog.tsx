import { useEffect, useRef } from 'react'
import { useInertOutside } from '../../ui/useInertOutside'
import { t } from '../../i18n'
import type { ProbeAnswer } from '../../lib/metrics'

export function ProbeDialog({ onAnswer }: { onAnswer: (answer: Exclude<ProbeAnswer, 'auto'>) => void }) {
  const firstButton = useRef<HTMLButtonElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  useInertOutside(overlay)
  useEffect(() => {
    firstButton.current?.focus()
  }, [])

  const options: { answer: Exclude<ProbeAnswer, 'auto'>; label: string }[] = [
    { answer: 'texto', label: t('probe.text') },
    { answer: 'otra-cosa', label: t('probe.other') },
    { answer: 'no-se', label: t('probe.unsure') },
  ]

  return (
    <div ref={overlay} className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        onKeyDown={(e) => {
          // Patrón de diálogo modal: Tab y Mayús+Tab dan la vuelta dentro del diálogo.
          if (e.key !== 'Tab') return
          const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
          const first = buttons[0]
          const last = buttons[buttons.length - 1]
          if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        }}
        aria-labelledby="probe-title"
        className="w-full max-w-sm rounded-lg bg-surface p-6 text-ink shadow-xl"
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
              className="rounded-md border border-line-strong px-4 py-2 text-left hover:bg-hover "
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
