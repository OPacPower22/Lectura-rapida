import type { ReactNode } from 'react'
import { t } from '../../i18n'

export interface ResultsData {
  wpm: number | null
  comp: number | null
  ileValue: number | null
  label: 'lectura' | 'hojeo' | null
  wanderingRate: number | null
  selfCaught: number | null
}

const pct = (v: number) => t('results.percent', { value: Math.round(v * 100) })

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{children}</dd>
    </div>
  )
}

export function ResultsCard({ data, saveError, purpose }: { data: ResultsData; saveError?: boolean; purpose?: string }) {
  return (
    <section className="mx-auto max-w-prose space-y-4" aria-labelledby="results-title">
      <h2 id="results-title" className="text-2xl font-semibold">
        {t('results.title')}
      </h2>
      {saveError && (
        <p role="alert" className="rounded border border-err-line bg-err-bg p-3 text-err-ink">
          {t('results.saveError')}
        </p>
      )}
      {purpose && (
        <p className="rounded border border-line bg-accent-soft p-3 text-accent-ink">{t('results.purpose', { purpose })}</p>
      )}
      <dl className="grid gap-3 sm:grid-cols-2">
        <Metric label={t('results.speed')}>
          {data.wpm === null ? (
            <span className="text-base font-normal">{t('results.tooShort')}</span>
          ) : (
            t('results.wpm', { wpm: data.wpm })
          )}
        </Metric>
        {data.comp !== null && <Metric label={t('results.comprehension')}>{pct(data.comp)}</Metric>}
        {data.ileValue !== null && <Metric label={t('results.ile')}>{data.ileValue}</Metric>}
        <Metric label={t('results.wandering')}>
          <span className="block text-base font-normal">
            {data.wanderingRate === null
              ? t('results.noProbes')
              : t('results.wanderingRate', { value: Math.round(data.wanderingRate * 100) })}
          </span>
          {data.selfCaught !== null && (
            <span className="block text-base font-normal">
              {t('results.selfCaught', { value: Math.round(data.selfCaught * 10) / 10 })}
            </span>
          )}
        </Metric>
      </dl>
      {data.label === 'hojeo' && (
        <p className="rounded border border-warn-line bg-warn-bg p-3 text-warn-ink">{t('results.skimming')}</p>
      )}
      <p className="text-sm text-muted">{t('results.reference')}</p>
    </section>
  )
}
