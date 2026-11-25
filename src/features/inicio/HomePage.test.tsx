import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { HomePage } from './HomePage'

const control = vi.hoisted(() => ({ persisted: true }))
vi.mock('../../lib/storage/persist', () => ({
  requestPersistentStorage: async () => control.persisted,
}))

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('HomePage', () => {
  it('invita a hacer el diagnóstico cuando no hay ninguno', async () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    expect(await screen.findByRole('link', { name: t('home.diagnosticCta') })).toBeInTheDocument()
  })

  it('avisa si el almacenamiento no es persistente', async () => {
    control.persisted = false
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    expect(await screen.findByText(t('storage.notPersistent'))).toBeInTheDocument()
  })
})
