import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getPracticeText } from '../../content'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { completeDay, completeStep, getProgramDays, startDay } from '../../lib/storage/program'
import * as programRepo from '../../lib/storage/program'
import { getSetting } from '../../lib/storage/settings'
import { saveSession } from '../../lib/storage/repo'
import { DayViewRoute } from './DayView'

let now = 0

function renderDay(day: number) {
  return render(
    <MemoryRouter initialEntries={[`/programa/dia/${day}`]}>
      <Routes>
        <Route path="/programa/dia/:day" element={<DayViewRoute now={() => now} />} />
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
    fireEvent.click(await screen.findByRole('button', { name: t('attention.start') }))
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
    await screen.findByRole('button', { name: t('attention.start') })
    unmount()
    renderDay(2)
    expect(await screen.findByRole('button', { name: t('attention.start') })).toBeInTheDocument()
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

  it('repara un día con todos los pasos hechos pero sin marcar como completado', async () => {
    await unlockUntil(2)
    await startDay(2)
    for (const step of ['lesson', 'exercise', 'reading'] as const) await completeStep(2, step)
    renderDay(2)
    expect(await screen.findByText(t('program.dayCompleted', { day: 2 }))).toBeInTheDocument()
    await act(async () => {})
    expect((await getProgramDays()).find((d) => d.day === 2)?.completedAt).toBeGreaterThan(0)
  })

  it('al pasar al día siguiente no muestra el estado del día anterior', async () => {
    await unlockUntil(3)
    renderDay(2)
    fireEvent.click(await screen.findByRole('link', { name: t('program.next', { day: 3 }) }))
    expect(await screen.findByRole('button', { name: t('program.lessonDone') })).toBeInTheDocument()
    expect(screen.queryByText(t('program.dayCompleted', { day: 3 }))).not.toBeInTheDocument()
  })

  it('un día que no existe muestra un mensaje', async () => {
    renderDay(99)
    expect(await screen.findByText(t('program.invalidDay'))).toBeInTheDocument()
  })

  it('si no se puede leer el progreso, lo dice', async () => {
    vi.spyOn(programRepo, 'getProgramDays').mockRejectedValueOnce(new Error('x'))
    renderDay(1)
    expect(await screen.findByRole('alert')).toHaveTextContent(t('program.loadError'))
    vi.restoreAllMocks()
  })

  it('marca el paso actual y anuncia el avance', async () => {
    await unlockUntil(2)
    renderDay(2)
    const current = await screen.findByText(t('program.stepMinutes', { step: t('program.step.lesson'), minutes: 3 }))
    expect(current).toHaveAttribute('aria-current', 'step')
    fireEvent.click(screen.getByRole('button', { name: t('program.lessonDone') }))
    expect(await screen.findByText(t('program.nowStep', { step: t('program.step.exercise') }))).toBeInTheDocument()
  })

  it('el día 1 tiene un solo encabezado principal', async () => {
    renderDay(1)
    fireEvent.click(await screen.findByRole('button', { name: t('program.lessonDone') }))
    await screen.findByText(t('diag.intro'))
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('el objetivo del bloque de enfoque se guarda y se ve durante la lectura del día', async () => {
    await unlockUntil(4)
    renderDay(4)
    fireEvent.click(await screen.findByRole('button', { name: t('program.lessonDone') }))
    for (const box of await screen.findAllByRole('checkbox')) fireEvent.click(box)
    fireEvent.change(screen.getByLabelText(t('focus.goal')), { target: { value: 'Entender la idea central' } })
    fireEvent.click(screen.getByRole('button', { name: t('focus.start') }))
    expect(await screen.findByText(t('program.goal', { goal: 'Entender la idea central' }))).toBeInTheDocument()
    expect(await getSetting('program:goal:4')).toBe('Entender la idea central')
  })

  it('el ejercicio de preguntas muestra el título del texto que se leerá', async () => {
    await unlockUntil(6)
    renderDay(6)
    fireEvent.click(await screen.findByRole('button', { name: t('program.lessonDone') }))
    expect(await screen.findByText(t('questions.forText', { title: getPracticeText('practica-5')!.title }))).toBeInTheDocument()
  })
})
