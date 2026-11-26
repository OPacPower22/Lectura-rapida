import { t } from '../../i18n'

/**
 * Demostración decorativa del método: una línea de texto que se lee con un marcador que avanza y puntos
 * donde la vista se fija (una fijación cada pocas palabras, como en la lectura real). Oculta a los lectores
 * de pantalla; sin animación si el sistema pide movimiento reducido.
 */
export function ReadingStrip() {
  const lines = [t('hero.strip1'), t('hero.strip2'), t('hero.strip3')]
  let index = 0
  return (
    <div aria-hidden="true" className="reading-strip font-serif">
      {lines.map((line, li) => (
        <p key={li} className={li === 1 ? 'reading-strip__line reading-strip__line--active' : 'reading-strip__line'}>
          {line.split(' ').map((word, wi) => {
            const i = li === 1 ? index++ : -1
            return (
              <span
                key={wi}
                className={i >= 0 ? `reading-strip__word${i % 3 === 1 ? ' reading-strip__word--fix' : ''}` : undefined}
                style={i >= 0 ? ({ '--i': i } as React.CSSProperties) : undefined}
              >
                {word}{' '}
              </span>
            )
          })}
        </p>
      ))}
    </div>
  )
}
