import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { t } from '../../i18n'
import { addCard, listCards } from '../../lib/storage/cards'
import { db } from '../../lib/storage/db'
import { CardsPage } from './CardsPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})
afterEach(() => vi.restoreAllMocks())

describe('CardsPage', () => {
  it('edita y borra fichas propias', async () => {
    await addCard({ kind: 'ficha', front: 'Antes', back: 'Respuesta', lang: 'es' })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<CardsPage />)
    const item = (await screen.findByDisplayValue('Antes')).closest('li')!
    fireEvent.change(within(item).getByLabelText(t('cards.front')), { target: { value: 'Después' } })
    fireEvent.click(within(item).getByRole('button', { name: t('annot.save') }))
    await waitFor(async () => expect((await listCards())[0].front).toBe('Después'))
    fireEvent.click(within(item).getByRole('button', { name: t('notes.delete') }))
    await waitFor(async () => expect(await listCards()).toEqual([]))
  })
})
