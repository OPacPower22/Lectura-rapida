/**
 * Marca de la app: tres fijaciones de la vista unidas por los saltos (sacadas) que da el ojo al leer,
 * sobre un trazo de marcador. Decorativa: el nombre va siempre en texto al lado.
 */
export function BrandMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M6.5 22.5 H25.5" stroke="var(--cta)" strokeWidth="5" strokeLinecap="round" />
      <path d="M8 15.5 Q12 8.5 16 15.5 Q20 8.5 24 15.5" fill="none" stroke="var(--on-accent)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="15.5" r="2.6" fill="var(--on-accent)" />
      <circle cx="16" cy="15.5" r="2.6" fill="var(--on-accent)" />
      <circle cx="24" cy="15.5" r="2.6" fill="var(--on-accent)" />
    </svg>
  )
}
