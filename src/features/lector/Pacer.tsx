import { t } from '../../i18n'
import { PACER_WINDOW, tokenize } from '../../lib/pacer'
import { PACER_MAX, PACER_MIN } from './usePacer'

export function PacerControls(props: { enabled: boolean; wpm: number; onEnabled(v: boolean): void; onWpm(v: number): void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={props.enabled} onChange={(e) => props.onEnabled(e.target.checked)} />
        {t('pacer.enable')}
      </label>
      {props.enabled && (
        <label className="flex items-center gap-1">
          <span>{t('pacer.wpm')}</span>
          <input
            type="number"
            min={PACER_MIN}
            max={PACER_MAX}
            step={10}
            value={props.wpm}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (v >= PACER_MIN && v <= PACER_MAX) props.onWpm(v)
            }}
            className="w-20 rounded border border-line-strong bg-surface px-1"
          />
        </label>
      )}
    </div>
  )
}

export function PacerNote() {
  return <p className="mb-3 text-sm text-muted">{t('pacer.note')}</p>
}

/** Párrafo con la ventana del marcapasos resaltada a partir de la palabra `word`. */
export function PacedParagraph({ text, word }: { text: string; word: number }) {
  const tokens = tokenize(text)
  return (
    <>
      {tokens.map((token, i) => {
        const active = i >= word && i < word + PACER_WINDOW
        return (
          <span key={i}>
            <span
              className={active ? 'rounded-sm bg-pace text-ink' : undefined}
              data-pacer-start={i === word ? '' : undefined}
            >
              {token}
            </span>
            {i < tokens.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </>
  )
}
