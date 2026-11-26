import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { textsByRole, getPracticeText } from '../../content'
import { getDayPlans } from '../../content/programa'
import { t } from '../../i18n'
import { baseWpm, comprehensionHistory, suggestPacerWpm } from '../../lib/progression'
import { countWords } from '../../lib/text'
import { getProgramDays } from '../../lib/storage/program'
import { listSessions } from '../../lib/storage/repo'
import { TextTestFlow } from '../diagnostico/TextTestFlow'

/** Comprensión de la primera lectura de cada texto (las relecturas no cuentan). */
async function firstReadings(): Promise<Map<string, number | null>> {
  const sessions = (await listSessions()).filter((s) => s.session.textId).sort((a, b) => a.session.startedAt - b.session.startedAt)
  const out = new Map<string, number | null>()
  for (const s of sessions) {
    if (out.has(s.session.textId!)) continue
    out.set(s.session.textId!, s.quiz && s.quiz.total > 0 ? s.quiz.correct / s.quiz.total : null)
  }
  return out
}

/** Días del programa aún no completados cuya lectura es este texto. */
async function pendingProgramDays(textId: string): Promise<number[]> {
  const done = new Set((await getProgramDays()).filter((d) => d.completedAt).map((d) => d.day))
  return getDayPlans()
    .filter((p) => p.reading.type === 'texto' && p.reading.textId === textId && !done.has(p.day))
    .map((p) => p.day)
}

export function PracticePage() {
  const [read, setRead] = useState<Map<string, number | null> | null>(null)
  useEffect(() => {
    firstReadings()
      .then(setRead)
      .catch(() => setRead(new Map()))
  }, [])
  if (!read) return null
  const texts = [...textsByRole('practica')].sort((a, b) => Number(read.has(a.id)) - Number(read.has(b.id)))
  return (
    <section className="mx-auto max-w-prose space-y-4">
      <h1 className="text-3xl font-bold">{t('practice.title')}</h1>
      <p>{t('practice.lead')}</p>
      <ul className="space-y-3">
        {texts.map((text) => {
          const comp = read.get(text.id)
          return (
            <li key={text.id}>
              <Link to={`/practica/${text.id}`} className="block rounded-lg border border-line bg-surface p-4 hover:border-accent">
                <span className="block text-lg font-semibold">{text.title}</span>
                <span className="block text-sm text-muted">
                  {t(`textKind.${text.kind}`)} · {t('practice.words', { words: countWords(text.body, text.lang) })} ·{' '}
                  {!read.has(text.id)
                    ? t('practice.unread')
                    : comp === null || comp === undefined
                      ? t('practice.readNoQuiz')
                      : t('practice.read', { percent: Math.round(comp * 100) })}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function PracticeRunPage() {
  const { textId = '' } = useParams()
  const text = getPracticeText(textId)
  const [info, setInfo] = useState<{ reread: boolean; days: number[]; pacer: number } | null>(null)

  useEffect(() => {
    if (!text) return
    Promise.all([firstReadings(), pendingProgramDays(text.id), comprehensionHistory(), baseWpm(text.kind)])
      .then(([read, days, history, base]) => setInfo({ reread: read.has(text.id), days, pacer: suggestPacerWpm(history, text.kind, base) }))
      .catch(() => setInfo({ reread: false, days: [], pacer: 250 }))
  }, [text])

  if (!text || text.role !== 'practica') {
    return (
      <section className="mx-auto max-w-prose space-y-3">
        <p role="alert">{t('practice.notFound')}</p>
        <Link to="/practica" className="underline">{t('practice.back')}</Link>
      </section>
    )
  }
  if (!info) return null
  return (
    <div className="space-y-4">
      {(info.reread || info.days.length > 0) && (
        <div role="note" className="mx-auto max-w-prose space-y-1 rounded border border-warn-line bg-warn-bg p-3 text-warn-ink">
          {info.reread && <p>{t('practice.rereadWarning')}</p>}
          {info.days.length > 0 && <p>{t('practice.programWarning', { days: info.days.join(', ') })}</p>}
        </div>
      )}
      <TextTestFlow
        text={text}
        role="practica"
        pacerWpm={info.pacer}
        footer={
          <div className="mx-auto max-w-prose">
            <Link to="/practica" className="underline">{t('practice.back')}</Link>
          </div>
        }
      />
    </div>
  )
}
