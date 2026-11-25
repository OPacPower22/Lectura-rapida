import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPracticeText } from '../../content'
import type { ReadingSpec } from '../../content/programa'
import { t } from '../../i18n'
import { ownReadingDone } from '../../lib/program'
import { comprehensionHistory, suggestPacerWpm } from '../../lib/progression'
import type { ProgramDay } from '../../lib/storage/db'
import { db } from '../../lib/storage/db'
import { getSetting } from '../../lib/storage/settings'
import type { Clock } from '../../lib/stopwatch'
import { DiagnosticPage } from '../diagnostico/DiagnosticPage'
import { TextTestFlow } from '../diagnostico/TextTestFlow'
import { primary } from './exercises/common'

const linkButton = 'rounded-md border border-line-strong px-4 py-2 hover:bg-hover'

function OwnReading({ progress, spec, onDone }: { progress: ProgramDay; spec: Extract<ReadingSpec, { type: 'propio' }>; onDone(): void }) {
  const [docs, setDocs] = useState<number | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    db.documents.count().then(setDocs).catch(() => setDocs(0))
  }, [])

  async function check() {
    const sessions = await db.readingSessions.where('startedAt').aboveOrEqual(progress.startedAt).toArray()
    if (ownReadingDone(progress, sessions, spec.minMinutes)) onDone()
    else setMissing(true)
  }

  return (
    <div className="space-y-4">
      <p>{t('program.own.intro')}</p>
      {spec.minMinutes && <p className="font-medium">{t('program.own.min', { minutes: spec.minMinutes })}</p>}
      {spec.pacer && <p className="font-medium">{t('program.own.pacer')}</p>}
      {docs === 0 && <p className="rounded border border-warn-line bg-warn-bg p-3 text-warn-ink">{t('program.emptyLibrary')}</p>}
      <div className="flex flex-wrap gap-2">
        <Link to="/biblioteca" className={linkButton}>
          {t('program.own.library')}
        </Link>
        <Link to="/biblioteca/fisico" className={linkButton}>
          {t('program.own.physical')}
        </Link>
        <Link to="/leer" className={linkButton}>
          {t('program.own.paste')}
        </Link>
      </div>
      <button type="button" className={primary} onClick={check}>
        {t('program.ownDone')}
      </button>
      {missing && <p role="alert" className="text-err-ink">{t('program.ownMissing')}</p>}
    </div>
  )
}

function PracticeReading({ day, spec, now, onDone }: { day: number; spec: Extract<ReadingSpec, { type: 'texto' | 'retest' }>; now?: Clock; onDone(): void }) {
  const text = getPracticeText(spec.textId)!
  const wantsPacer = spec.type === 'texto' && !!spec.pacer
  const [pacer, setPacer] = useState<number | undefined | null>(wantsPacer ? null : undefined)
  const [questions, setQuestions] = useState<string[] | undefined>()

  useEffect(() => {
    getSetting<string[]>(`program:questions:${day}`).then(setQuestions).catch(() => {})
    if (wantsPacer) {
      comprehensionHistory()
        .then(async (history) => {
          const last = await db.readingSessions.where('kind').anyOf('practica', 'diagnostico', 'retest').reverse().sortBy('startedAt')
          const base = last.find((s) => s.textKind === text.kind && s.wpm)?.wpm ?? 250
          setPacer(suggestPacerWpm(history, text.kind, base))
        })
        .catch(() => setPacer(250))
    }
  }, [day, wantsPacer, text.kind])

  if (pacer === null) return null
  return (
    <TextTestFlow
      text={text}
      role={spec.type === 'retest' ? 'retest' : 'practica'}
      pacerWpm={pacer}
      now={now}
      ownQuestions={questions}
      onDone={() => onDone()}
    />
  )
}

export function ReadingStep({ day, progress, spec, now, onDone }: { day: number; progress: ProgramDay; spec: ReadingSpec; now?: Clock; onDone(): void }) {
  if (spec.type === 'diagnostico') return <DiagnosticPage now={now} onDone={onDone} />
  if (spec.type === 'propio') return <OwnReading progress={progress} spec={spec} onDone={onDone} />
  return <PracticeReading day={day} spec={spec} now={now} onDone={onDone} />
}
