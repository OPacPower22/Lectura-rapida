import { useState } from 'react'
import { t } from '../../../i18n'
import { addNote } from '../../../lib/storage/notes'
import { programSourceId } from '../../../lib/storage/programSource'
import { DoneButton, field } from './common'

/** Mapa de tres ramas, guardado como nota de idea propia. */
export function ConceptMap({ onDone }: { onDone(): void }) {
  const [central, setCentral] = useState('')
  const [args, setArgs] = useState('')
  const [examples, setExamples] = useState('')
  return (
    <div className="space-y-3">
      <p>{t('map.intro')}</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('map.central')}</span>
        <input value={central} onChange={(e) => setCentral(e.target.value)} className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('map.arguments')}</span>
        <textarea value={args} onChange={(e) => setArgs(e.target.value)} rows={3} className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('map.examples')}</span>
        <textarea value={examples} onChange={(e) => setExamples(e.target.value)} rows={3} className={field} />
      </label>
      <DoneButton
        disabled={!central.trim()}
        onClick={async () => {
          const sourceId = await programSourceId(t('program.notesSource'))
          await addNote({
            sourceId,
            kind: 'idea',
            text: `${t('map.central')}: ${central.trim()}\n${t('map.arguments')}: ${args.trim()}\n${t('map.examples')}: ${examples.trim()}`,
            lang: 'es',
          })
          onDone()
        }}
      />
    </div>
  )
}
