import { useEffect, useState } from 'react'
import { getPracticeText } from '../../../content'
import { t } from '../../../i18n'
import { splitParagraphs } from '../../../lib/text'
import { DoneButton, field, primary } from './common'

/** Hojeo con tiempo: el texto se ve durante `seconds` y luego se escriben 3 ideas principales. */
export function Skim({ textId, seconds, onDone }: { textId: string; seconds: number; onDone(): void }) {
  const text = getPracticeText(textId)!
  const [phase, setPhase] = useState<'intro' | 'view' | 'ideas'>('intro')
  const [left, setLeft] = useState(seconds)
  const [ideas, setIdeas] = useState(['', '', ''])

  useEffect(() => {
    if (phase !== 'view') return
    const tick = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    const end = setTimeout(() => setPhase('ideas'), seconds * 1000)
    return () => {
      clearInterval(tick)
      clearTimeout(end)
    }
  }, [phase, seconds])

  if (phase === 'intro') {
    return (
      <div className="space-y-3">
        <p>{t('skim.intro', { seconds })}</p>
        <button type="button" className={primary} onClick={() => setPhase('view')}>
          {t('skim.start')}
        </button>
      </div>
    )
  }
  if (phase === 'view') {
    return (
      <div className="space-y-3">
        <p className="font-semibold tabular-nums" aria-live="off">
          {t('skim.left', { seconds: left })}
        </p>
        <article lang={text.lang} className="space-y-3 leading-relaxed">
          <h3 className="text-lg font-semibold">{text.title}</h3>
          {splitParagraphs(text.body).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <p>{t('skim.ideas')}</p>
      {ideas.map((v, i) => (
        <label key={i} className="block">
          <span className="mb-1 block text-sm font-medium">{t('skim.idea', { n: i + 1 })}</span>
          <input value={v} onChange={(e) => setIdeas(ideas.map((x, j) => (j === i ? e.target.value : x)))} className={field} />
        </label>
      ))}
      <DoneButton onClick={onDone} disabled={ideas.some((i) => !i.trim())} />
    </div>
  )
}
