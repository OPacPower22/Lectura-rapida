import { useState } from 'react'
import { currentLang, t } from '../../../i18n'
import { addNote } from '../../../lib/storage/notes'
import { programSourceId } from '../../../lib/storage/programSource'
import { DoneButton, field } from './common'

/** Esquema de un trabajo escrito (el proyecto completo llega en la fase 4). */
export function Outline({ onDone }: { onDone(): void }) {
  const [topic, setTopic] = useState('')
  const [thesis, setThesis] = useState('')
  const [sections, setSections] = useState(['', '', ''])
  return (
    <div className="space-y-3">
      <p>{t('outline.intro')}</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('outline.topic')}</span>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t('outline.thesis')}</span>
        <textarea value={thesis} onChange={(e) => setThesis(e.target.value)} rows={2} className={field} />
      </label>
      {sections.map((v, i) => (
        <label key={i} className="block">
          <span className="mb-1 block text-sm font-medium">{t('outline.section', { n: i + 1 })}</span>
          <textarea value={v} onChange={(e) => setSections(sections.map((x, j) => (j === i ? e.target.value : x)))} rows={2} className={field} />
        </label>
      ))}
      {sections.length < 5 && (
        <button type="button" className="text-accent-ink underline" onClick={() => setSections([...sections, ''])}>
          + {t('outline.section', { n: sections.length + 1 })}
        </button>
      )}
      <DoneButton
        disabled={!topic.trim() || !thesis.trim()}
        onClick={async () => {
          const sourceId = await programSourceId(t('program.notesSource'))
          const body = [
            `${t('outline.topic')}: ${topic.trim()}`,
            `${t('outline.thesis')}: ${thesis.trim()}`,
            ...sections.filter((s) => s.trim()).map((s, i) => `${i + 1}. ${s.trim()}`),
          ].join('\n')
          await addNote({ sourceId, kind: 'idea', text: body, lang: currentLang() })
          onDone()
        }}
      />
    </div>
  )
}
