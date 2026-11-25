import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getPracticeText } from '../../content'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { completeDay, getProgramDays, startDay } from '../../lib/storage/program'
import { saveSession } from '../../lib/storage/repo'
import { DayView } from './DayView'

let now = 0

function renderDay(day: number) {
  return render(
    <MemoryRouter initialEntries={[`/programa/dia/${day}`]}>
      <Routes>
        <Route path="/programa/dia/:day" element={<DayView now={() => now} />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function unlockUntil(day: number) {
  for (let d = 1; d < day; d++) {
    await startDay(d)
    await completeDay(d)
  }
}

beforeEach(async () => {
  now = 0
  await db.delete()
  await db.open()
})

describe('DayView', () => {
  it('completa el día 2: lección, atención y lectura con cuestionario', async () => {
    await unlockUntil(2)
    renderDay(2)
    fireEvent.click(await screen.findByRole('button', { name: t('program.lessonDone') }))
    fireEvent.click(await screen.findByRole('button', { name: t('attention.returned') }))
    now = 30000
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('attention.finishEarly') }))
    })
    fireEvent.click(await screen.findByRole('button', { name: t('program.exerciseDone') }))
    fireEvent.click(await screen.findByRole('button', { name: t('diag.continue') }))
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    now = 200000
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    const text = getPracticeText('practica-1')!
    for (const q of text.questions) fireEvent.click(screen.getByLabelText(q.options[q.answerIndex]))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('quiz.submit') }))
    })
    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: t('flow.continue') }))
    })
    expect(await screen.findByText(t('program.dayCompleted', { day: 2 }))).toBeInTheDocument()
    const days = await getProgramDays()
    expect(days.find((d) => d.day === 2)?.completedAt).toBeGreaterThan(0)
  })

  it('al volver a un día a medias, conserva los pasos hechos', async () => {
    await unlockUntil(2)
    const { unmount } = renderDay(2)
    fireEvent.click(await screen.findByRole('button', { name: t('program.lessonDone') }))
    await screen.findByRole('button', { name: t('attention.returned') })
    unmount()
    renderDay(2)
    expect(await screen.findByRole('button', { name: t('attention.returned') })).toBeInTheDocument()
    expect(screen.getByText(t('program.stepDone', { step: t('program.step.lesson') }))).toBeInTheDocument()
  })

  it('no deja saltar a un día futuro', async () => {
    renderDay(5)
    expect(await screen.findByText(t('program.locked', { day: 1 }))).toBeInTheDocument()
  })

  it('lectura propia: «Ya leí» solo completa si hay una sesión de ese día', async () => {
    await unlockUntil(9)
    renderDay(9)
    fireEvent.click(await screen.findByRole('button', { name: t('program.lessonDone') }))
    expect(await screen.findByText(t('program.emptyLibrary'))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('program.ownDone') }))
    expect(await screen.findByText(t('program.ownMissing'))).toBeInTheDocument()
    await saveSession({
      session: { kind: 'libre', lang: 'es', startedAt: Date.now() + 1000, endedAt: Date.now() + 2000, activeMs: 60000, words: 200, wpm: 200 },
      probes: [],
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('program.ownDone') }))
    })
    expect(await screen.findByText(t('program.dayCompleted', { day: 9 }))).toBeInTheDocument()
  })
})
