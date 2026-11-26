import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { addSource } from '../../lib/storage/library'
import { addNote } from '../../lib/storage/notes'
import { createProject, getProject } from '../../lib/storage/projects'
import { NotebookPage } from './NotebookPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

async function seed() {
  const a = await addSource({ type: 'libro', title: 'Libro A', author: 'Pérez' })
  const b = await addSource({ type: 'web', title: 'Artículo B' })
  await addNote({ sourceId: a, kind: 'cita', quote: 'La atención es limitada', text: '', page: 12, lang: 'es', tags: ['tesis'] })
  await addNote({ sourceId: a, kind: 'idea', text: 'Conectar con el trazado', lang: 'es' })
  await addNote({ sourceId: b, kind: 'parafrasis', text: 'Resumen del artículo', lang: 'es', tags: ['tesis', 'método'] })
  await addNote({ sourceId: 999, kind: 'idea', text: 'Nota huérfana', lang: 'es' })
  return { a, b }
}

const show = () => render(<MemoryRouter><NotebookPage /></MemoryRouter>)
const notes = () => screen.getAllByRole('article')

describe('NotebookPage', () => {
  it('lista todas las notas con su fuente y marca las de fuentes eliminadas', async () => {
    await seed()
    show()
    expect(await screen.findAllByRole('article')).toHaveLength(4)
    expect(screen.getByText('«La atención es limitada»')).toBeInTheDocument()
    const orphan = notes().find((n) => n.textContent?.includes('Nota huérfana'))!
    expect(within(orphan).getByText(t('notebook.sourceDeleted'))).toBeInTheDocument()
  })

  it('filtra por fuente y por etiqueta', async () => {
    const { b } = await seed()
    show()
    await screen.findAllByRole('article')
    await userEvent.selectOptions(screen.getByLabelText(t('notebook.filter.source')), String(b))
    expect(notes()).toHaveLength(1)
    await userEvent.selectOptions(screen.getByLabelText(t('notebook.filter.source')), '')
    await userEvent.selectOptions(screen.getByLabelText(t('notebook.filter.tag')), 'tesis')
    expect(notes()).toHaveLength(2)
  })

  it('busca sin distinguir acentos', async () => {
    await seed()
    show()
    await screen.findAllByRole('article')
    await userEvent.type(screen.getByLabelText(t('notebook.search')), 'ATENCION')
    expect(await screen.findAllByRole('article')).toHaveLength(1)
  })

  it('edita etiquetas y tipo', async () => {
    await seed()
    show()
    const note = (await screen.findAllByRole('article')).find((n) => n.textContent?.includes('Conectar'))!
    await userEvent.click(within(note).getByRole('button', { name: t('notes.edit') }))
    const tags = within(note).getByLabelText(t('notebook.tags'))
    await userEvent.clear(tags)
    await userEvent.type(tags, 'plancha,  tesis , plancha')
    await userEvent.selectOptions(within(note).getByLabelText(t('notebook.kind')), 'parafrasis')
    await userEvent.click(within(note).getByRole('button', { name: t('notebook.save') }))
    const saved = (await db.notes.toArray()).find((n) => n.text === 'Conectar con el trazado')!
    expect(saved.tags).toEqual(['plancha', 'tesis'])
    expect(saved.kind).toBe('parafrasis')
  })

  it('añade una nota a la sección elegida de un proyecto', async () => {
    await seed()
    const projectId = await createProject({ title: 'Mi trazado', kind: 'trazado' })
    const project = (await getProject(projectId))!
    show()
    const note = (await screen.findAllByRole('article')).find((n) => n.textContent?.includes('Resumen del artículo'))!
    await userEvent.click(within(note).getByRole('button', { name: t('notebook.addToProject') }))
    await userEvent.selectOptions(within(note).getByLabelText(t('notebook.project')), String(projectId))
    await userEvent.selectOptions(within(note).getByLabelText(t('notebook.section')), project.sections[0].id)
    await userEvent.click(within(note).getByRole('button', { name: t('notebook.add') }))
    expect(await within(note).findByText(t('notebook.added', { project: 'Mi trazado' }))).toBeInTheDocument()
    const noteId = (await db.notes.toArray()).find((n) => n.text === 'Resumen del artículo')!.id
    expect((await getProject(projectId))!.sections[0].items).toEqual([{ type: 'note', noteId }])
  })
})
