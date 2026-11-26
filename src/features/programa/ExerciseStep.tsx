import { useState } from 'react'
import type { ExerciseSpec } from '../../content/programa'
import { setSetting } from '../../lib/storage/settings'
import type { Clock } from '../../lib/stopwatch'
import { AttentionPage } from '../atencion/AttentionPage'
import { FocusChecklist } from '../atencion/FocusChecklist'
import { ReviewPage } from '../retencion/ReviewPage'
import { DoneButton } from './exercises/common'
import { ConceptMap } from './exercises/ConceptMap'
import { Explain } from './exercises/Explain'
import { MakeCards } from './exercises/MakeCards'
import { Outline } from './exercises/Outline'
import { Questions } from './exercises/Questions'
import { Scan } from './exercises/Scan'
import { Skim } from './exercises/Skim'

export function ExerciseStep({ day, spec, now, onDone }: { day: number; spec: ExerciseSpec; now?: Clock; onDone(): void }) {
  const [finished, setFinished] = useState(false)
  switch (spec.type) {
    case 'atencion':
      return (
        <div className="space-y-4">
          <AttentionPage embedded minutes={spec.minutes} now={now} onDone={() => setFinished(true)} />
          {finished && <DoneButton onClick={onDone} />}
        </div>
      )
    case 'enfoque':
      return (
        <FocusChecklist
          onReady={async (goal) => {
            await setSetting(`program:goal:${day}`, goal).catch(() => {})
            onDone()
          }}
        />
      )
    case 'hojeo':
      return <Skim textId={spec.textId} seconds={spec.seconds} onDone={onDone} />
    case 'escaneo':
      return <Scan textId={spec.textId} onDone={onDone} />
    case 'preguntas':
      return <Questions day={day} count={spec.count} onDone={onDone} />
    case 'mapa':
      return <ConceptMap onDone={onDone} />
    case 'explicar':
      return <Explain seconds={spec.seconds} onDone={onDone} />
    case 'fichas':
      return <MakeCards count={spec.count} onDone={onDone} />
    case 'repaso':
      return (
        <div className="space-y-4">
          <ReviewPage embedded />
          <DoneButton onClick={onDone} />
        </div>
      )
    case 'esquema':
      return <Outline onDone={onDone} />
    case 'ninguno':
      return null
  }
}
