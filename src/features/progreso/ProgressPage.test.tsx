import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { saveSession } from '../../lib/storage/repo'
import { ProgressPage } from './ProgressPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const page = () => render(<MemoryRouter><ProgressPage /></MemoryRouter>)

describe('ProgressPage', () => {
  it('sin datos muestra el estado vacío, no gráficas', async () => {
    page()
    expect(await screen.findByText(t('progress.empty'))).toBeInTheDocument()
    expect(screen.queryByRole('figure')).toBeNull()
  })

  it('con datos muestra las gráficas, la retención y permite ver el historial', async () => {
    const now = Date.now()
    await saveSession({
      session: { kind: 'practica', textId: 'practica-1', textKind: 'expositivo', lang: 'es', startedAt: now, endedAt: now, activeMs: 120000, words: 400, wpm: 200 },
      probes: [{ at: 1, answer: 'texto' }],
      quiz: { textId: 'practica-1', answers: [], correct: 4, total: 5, deferred: false, at: now },
    })
    page()
    expect(await screen.findByRole('figure', { name: t('progress.chart.ppm') })).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: t('progress.chart.comprehension') })).toBeInTheDocument()
    expect(screen.getByRole('figure', { name: t('progress.chart.minutes') })).toBeInTheDocument()
    expect(screen.getByText(t('progress.retention.d1'))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('progress.exportCsv') })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: t('progress.tab.history') }))
    expect(screen.getByRole('tab', { name: t('progress.tab.history') })).toHaveAttribute('aria-selected', 'true')
    expect(await within(screen.getByRole('tabpanel')).findByText('200')).toBeInTheDocument()
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
  })
})
