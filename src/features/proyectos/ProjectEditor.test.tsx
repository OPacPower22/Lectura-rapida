import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { addSource } from '../../lib/storage/library'
import { addNote } from '../../lib/storage/notes'
import { createProject, getProject } from '../../lib/storage/projects'
import { ProjectEditor } from './ProjectEditor'

const downloads = vi.hoisted(() => [] as { blob: Blob; name: string }[])
vi.mock('../../lib/download', async (orig) => ({
  ...(await orig<typeof import('../../lib/download')>()),
  downloadBlob: (blob: Blob, name: string) => downloads.push({ blob, name }),
}))

beforeEach(async () => {
  await db.delete()
  await db.open()
})

function open(id: number) {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${id}`]}>
      <Routes>
        <Route path="/proyectos/:id" element={<ProjectEditor />} />
        <Route path="/proyectos" element={<p>lista</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function seed() {
  const s = await addSource({ type: 'libro', title: 'Libro', author: 'Pérez, A.', year: '2020' })
  const n1 = await addNote({ sourceId: s, kind: 'cita', quote: 'Primera cita', text: '', page: 4, lang: 'es' })
  const n2 = await addNote({ sourceId: s, kind: 'idea', text: 'Segunda idea', lang: 'es' })
  const id = await createProject({ title: 'Trazado', kind: 'trazado' })
  return { n1, n2, id }
}

const saved = async (id: number) => (await getProject(id))!

describe('ProjectEditor', () => {
  it('añade sección, notas y párrafo; reordena y mueve entre secciones', async () => {
    const { n1, n2, id } = await seed()
    open(id)
    const intro = await screen.findByRole('region', { name: t('project.firstSection') })
    await userEvent.click(within(intro).getByRole('button', { name: t('project.addNotes') }))
    const picker = within(intro).getByRole('group', { name: t('project.pickNotes') })
    await userEvent.click(within(picker).getByRole('checkbox', { name: /Primera cita/ }))
    await userEvent.click(within(picker).getByRole('checkbox', { name: /Segunda idea/ }))
    await userEvent.click(within(intro).getByRole('button', { name: t('project.addSelected', { count: 2 }) }))
    expect(within(intro).getByText('(Pérez, 2020, p. 4)')).toBeInTheDocument()

    await userEvent.click(within(intro).getByRole('button', { name: t('project.addParagraph') }))
    await userEvent.type(within(intro).getByLabelText(t('project.paragraph', { n: 3 })), 'Mi párrafo')

    // Subir la idea por encima de la cita.
    await userEvent.click(within(intro).getByRole('button', { name: t('project.itemUpN', { n: 2 }) }))

    await userEvent.click(screen.getByRole('button', { name: t('project.addSection') }))
    const sections = screen.getAllByRole('region')
    const second = sections[1]
    await userEvent.type(within(second).getByLabelText(t('project.sectionTitle')), 'Desarrollo')

    // Mover el párrafo a la segunda sección.
    const intro2 = screen.getByRole('region', { name: t('project.firstSection') })
    await userEvent.selectOptions(within(intro2).getByLabelText(t('project.moveToN', { n: 3 })), 'Desarrollo')
    expect(within(intro2).getByLabelText(t('project.paragraph', { n: 3 }))).toBeInTheDocument()
    await userEvent.click(within(intro2).getByRole('button', { name: t('project.moveN', { n: 3 }) }))

    await waitFor(
      async () => {
        const p = await saved(id)
        expect(p.sections.map((s) => s.title)).toEqual([t('project.firstSection'), 'Desarrollo'])
        expect(p.sections[0].items).toMatchObject([
          { type: 'note', noteId: n2 },
          { type: 'note', noteId: n1 },
        ])
        expect(p.sections[1].items).toMatchObject([{ type: 'text', text: 'Mi párrafo' }])
        expect(new Set(p.sections.flatMap((s) => s.items.map((i) => i.id))).size).toBe(3)
      },
      { timeout: 3000 },
    )
  })

  it('guarda automáticamente tras una pausa, no en cada tecla', async () => {
    const { id } = await seed()
    open(id)
    const thesis = await screen.findByLabelText(t('project.thesis'))
    await userEvent.type(thesis, 'La atención se entrena')
    expect((await saved(id)).thesis).toBe('')
    await waitFor(async () => expect((await saved(id)).thesis).toBe('La atención se entrena'), { timeout: 3000 })
    expect(await screen.findByText(t('project.saved'))).toBeInTheDocument()
  })

  it('una nota borrada del cuaderno se muestra con aviso', async () => {
    const { n1, id } = await seed()
    const p = (await getProject(id))!
    p.sections[0].items.push({ type: 'note', noteId: n1 }, { type: 'note', noteId: 9999 })
    await db.projects.put(p)
    open(id)
    expect(await screen.findByText(t('project.noteDeleted'))).toBeInTheDocument()
    expect(screen.getByText('«Primera cita»')).toBeInTheDocument()
  })

  it('un proyecto inexistente muestra un mensaje', async () => {
    open(42)
    expect(await screen.findByText(t('project.notFound'))).toBeInTheDocument()
  })

  it('exporta a Markdown y a Word con el estado actual del proyecto', async () => {
    downloads.length = 0
    const { n1, id } = await seed()
    const p = (await getProject(id))!
    p.sections[0].items.push({ type: 'note', noteId: n1 })
    await db.projects.put(p)
    open(id)
    await userEvent.click(await screen.findByRole('button', { name: t('export.markdown') }))
    await waitFor(() => expect(downloads).toHaveLength(1))
    expect(downloads[0].name).toBe('trazado.md')
    const md = await downloads[0].blob.text()
    expect(md).toContain('> «Primera cita» (Pérez, 2020, p. 4)')
    expect(md).toContain('Pérez, A. (2020). *Libro*.')
    await userEvent.click(screen.getByRole('button', { name: t('export.word') }))
    await waitFor(() => expect(downloads).toHaveLength(2), { timeout: 5000 })
    expect(downloads[1].name).toBe('trazado.docx')
    expect(downloads[1].blob.size).toBeGreaterThan(1000)
  })

  it('con el teclado, el foco sigue al elemento movido y se anuncia su nueva posición', async () => {
    const { n1, n2, id } = await seed()
    const p = (await getProject(id))!
    p.sections[0].items.push({ type: 'note', noteId: n1 }, { type: 'note', noteId: n2 })
    await db.projects.put(p)
    open(id)
    const intro = await screen.findByRole('region', { name: t('project.firstSection') })
    await userEvent.click(within(intro).getByRole('button', { name: t('project.itemDownN', { n: 1 }) }))
    // «Primera cita» pasa a la posición 2: «Bajar» se desactiva y el foco queda en su «Subir».
    const up2 = within(intro).getByRole('button', { name: t('project.itemUpN', { n: 2 }) })
    expect(document.activeElement).toBe(up2)
    expect(up2.closest('li')).toHaveTextContent('Primera cita')
    expect(screen.getByText(t('project.movedTo', { n: 2 }))).toBeInTheDocument()
  })

  it('al ocultar o cerrar la página guarda lo pendiente sin esperar la pausa', async () => {
    const { id } = await seed()
    open(id)
    const thesis = await screen.findByLabelText(t('project.thesis'))
    fireEvent.change(thesis, { target: { value: 'Tesis urgente' } })
    window.dispatchEvent(new Event('pagehide'))
    await waitFor(async () => expect((await saved(id)).thesis).toBe('Tesis urgente'), { timeout: 500 })
  })

  it('quitar un párrafo propio con texto pide confirmación', async () => {
    const { id } = await seed()
    const p = (await getProject(id))!
    p.sections[0].items.push({ id: 'x', type: 'text', text: 'Mi párrafo valioso' })
    await db.projects.put(p)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    open(id)
    await userEvent.click(await screen.findByRole('button', { name: t('project.itemRemoveN', { n: 1 }) }))
    expect(confirm).toHaveBeenCalled()
    expect(screen.getByDisplayValue('Mi párrafo valioso')).toBeInTheDocument()
    confirm.mockRestore()
  })

  it('si no se puede borrar el proyecto, lo dice', async () => {
    const { id } = await seed()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const projects = await import('../../lib/storage/projects')
    vi.spyOn(projects, 'deleteProject').mockRejectedValueOnce(new Error('x'))
    open(id)
    await userEvent.click(await screen.findByRole('button', { name: t('project.delete') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(t('project.deleteError'))
    vi.restoreAllMocks()
  })
})
