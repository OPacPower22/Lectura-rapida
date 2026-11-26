import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { t, tPlural } from '../../i18n'
import { db } from '../../lib/storage/db'
import { addSource } from '../../lib/storage/library'
import { addNote } from '../../lib/storage/notes'
import { SourcesPage } from './SourcesPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('SourcesPage', () => {
  it('muestra cada fuente con su número de notas y guarda el año', async () => {
    const id = await addSource({ type: 'libro', title: 'Libro A' })
    await addNote({ sourceId: id, kind: 'idea', text: 'x', lang: 'es' })
    await addNote({ sourceId: id, kind: 'idea', text: 'y', lang: 'es' })
    render(<MemoryRouter><SourcesPage /></MemoryRouter>)
    const item = await screen.findByRole('article')
    expect(within(item).getByText(tPlural('sources.notes', 2))).toBeInTheDocument()
    await userEvent.type(within(item).getByLabelText(t('sources.year')), '2020')
    await userEvent.type(within(item).getByLabelText(t('sources.author')), 'Pérez, A.')
    await userEvent.click(within(item).getByRole('button', { name: t('sources.save') }))
    expect(await within(item).findByText(t('sources.saved'))).toBeInTheDocument()
    expect(await db.sources.get(id)).toMatchObject({ year: '2020', author: 'Pérez, A.' })
    const preview = await within(item).findByText((_, el) => el?.getAttribute('data-reference') !== null && el?.textContent === 'Pérez, A. (2020). Libro A.')
    expect(within(preview).getByText('Libro A').tagName).toBe('I')
  })

  it('sin fuentes explica de dónde salen', async () => {
    render(<MemoryRouter><SourcesPage /></MemoryRouter>)
    expect(await screen.findByText(t('sources.empty'))).toBeInTheDocument()
  })

  it('no guarda un título vacío y muestra los errores al guardar', async () => {
    const id = await addSource({ type: 'libro', title: 'Libro A' })
    render(<MemoryRouter><SourcesPage /></MemoryRouter>)
    const item = await screen.findByRole('article')
    const title = within(item).getByLabelText(t('sources.title'))
    await userEvent.clear(title)
    await userEvent.type(title, '   ')
    await userEvent.click(within(item).getByRole('button', { name: t('sources.save') }))
    expect(await within(item).findByRole('alert')).toHaveTextContent(t('sources.titleRequired'))
    expect((await db.sources.get(id))!.title).toBe('Libro A')

    const library = await import('../../lib/storage/library')
    vi.spyOn(library, 'updateSource').mockRejectedValueOnce(new Error('x'))
    await userEvent.clear(title)
    await userEvent.type(title, 'Nuevo')
    await userEvent.click(within(item).getByRole('button', { name: t('sources.save') }))
    expect(await within(item).findByRole('alert')).toHaveTextContent(t('sources.saveError'))
    vi.restoreAllMocks()
  })
})
