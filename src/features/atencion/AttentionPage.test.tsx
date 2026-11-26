import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { t } from '../../i18n'
import { listAttentionSessions } from '../../lib/storage/attention'
import { db } from '../../lib/storage/db'
import { AttentionPage } from './AttentionPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('AttentionPage', () => {
  it('guarda la sesión al terminar', async () => {
    let now = 0
    render(<AttentionPage now={() => now} />)
    fireEvent.click(await screen.findByRole('button', { name: t('attention.minutes', { minutes: 2 }) }))
    fireEvent.click(screen.getByRole('button', { name: t('attention.returned') }))
    now = 40000
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('attention.finishEarly') }))
    })
    await waitFor(async () => {
      const [s] = await listAttentionSessions()
      expect(s).toMatchObject({ plannedMinutes: 2, durationMs: 40000, returns: 1 })
    })
    expect(await screen.findByText('Sesión de 1 min · 1 regreso a la respiración')).toBeInTheDocument()
  })
})
