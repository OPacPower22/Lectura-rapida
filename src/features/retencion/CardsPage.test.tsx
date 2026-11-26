import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { t } from '../../i18n'
import { addCard, listCards } from '../../lib/storage/cards'
import { db } from '../../lib/storage/db'
import { addSource } from '../../lib/storage/library'
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

  it('no guarda una ficha vaciada al editar', async () => {
    await addCard({ kind: 'ficha', front: 'Antes', back: 'Respuesta', lang: 'es' })
    render(<CardsPage />)
    const item = (await screen.findByDisplayValue('Antes')).closest('li')!
    fireEvent.change(within(item).getByLabelText(t('cards.front')), { target: { value: '   ' } })
    expect(within(item).getByRole('button', { name: t('annot.save') })).toBeDisabled()
  })

  it('muestra la fuente de la ficha o que se eliminó', async () => {
    const source = await addSource({ type: 'libro', title: 'Libro vivo' })
    await addCard({ kind: 'ficha', front: 'Con fuente', back: 'r', lang: 'es', sourceId: source })
    await addCard({ kind: 'ficha', front: 'Huérfana', back: 'r', lang: 'es', sourceId: 999 })
    render(<CardsPage />)
    const alive = (await screen.findByDisplayValue('Con fuente')).closest('li')!
    expect(within(alive).getByText(/Libro vivo/)).toBeInTheDocument()
    const orphan = screen.getByDisplayValue('Huérfana').closest('li')!
    expect(within(orphan).getByText(new RegExp(t('cards.sourceDeleted')))).toBeInTheDocument()
  })
})
