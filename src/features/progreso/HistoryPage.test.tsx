import { render, screen, within } from '@testing-library/react'
import { db, type ReadingSession } from '../../lib/storage/db'
import { saveSession } from '../../lib/storage/repo'
import { HistoryPage } from './HistoryPage'

const session: Omit<ReadingSession, 'id'> = {
  kind: 'diagnostico',
  textId: 'diag-expositivo',
  textKind: 'expositivo',
  lang: 'es',
  startedAt: Date.UTC(2026, 0, 1),
  endedAt: Date.UTC(2026, 0, 1) + 180000,
  activeMs: 180000,
  words: 600,
  wpm: 200,
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('HistoryPage', () => {
  it('lista las sesiones de la más reciente a la más antigua', async () => {
    await saveSession({
      session,
      probes: [{ at: 1, answer: 'otra-cosa' }, { at: 2, answer: 'texto' }],
      quiz: { textId: 'diag-expositivo', answers: [], correct: 8, total: 10, deferred: false, at: 1 },
    })
    await saveSession({
      session: { ...session, kind: 'libre', textId: undefined, textKind: undefined, lang: 'en', startedAt: Date.UTC(2026, 0, 2), wpm: 300 },
      probes: [],
    })
    render(<HistoryPage />)
    const rows = await screen.findAllByRole('row')
    const [, newest, oldest] = rows
    expect(within(newest).getByText('300')).toBeInTheDocument()
    expect(within(newest).getByText('en')).toBeInTheDocument()
    expect(within(newest).getAllByText('—').length).toBeGreaterThanOrEqual(2)
    expect(within(oldest).getByText('Diagnóstico · Expositivo')).toBeInTheDocument()
    expect(within(newest).getByText('Texto propio')).toBeInTheDocument()
    expect(within(oldest).getByText('200')).toBeInTheDocument()
    expect(within(oldest).getByText('80 %')).toBeInTheDocument()
    expect(within(oldest).getByText('160')).toBeInTheDocument()
    expect(within(oldest).getByText('50 %')).toBeInTheDocument()
  })
})
