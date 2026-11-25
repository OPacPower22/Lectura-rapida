import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { completeDay, startDay } from '../../lib/storage/program'
import { ProgramPage } from './ProgramPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/programa']}>
      <Routes>
        <Route path="/programa" element={<ProgramPage />} />
        <Route path="/programa/dia/:day" element={<p>Vista del día</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProgramPage', () => {
  it('sin progreso propone el día 1', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('link', { name: t('program.start', { day: 1 }) }))
    expect(await screen.findByText('Vista del día')).toBeInTheDocument()
  })

  it('tras completar días, propone el siguiente', async () => {
    for (const d of [1, 2]) {
      await startDay(d)
      await completeDay(d)
    }
    renderPage()
    expect(await screen.findByRole('link', { name: t('program.start', { day: 3 }) })).toBeInTheDocument()
  })
})
