import { db } from './db'
import { addNoteToProject, createProject, deleteProject, getProject, listProjects, saveProject } from './projects'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('proyectos', () => {
  it('crea un proyecto con una sección inicial', async () => {
    const id = await createProject({ title: 'Trazado', kind: 'trazado' })
    const p = await getProject(id)
    expect(p).toMatchObject({ title: 'Trazado', kind: 'trazado', topic: '', thesis: '', lang: 'es' })
    expect(p!.sections).toHaveLength(1)
    expect(p!.sections[0]).toMatchObject({ title: 'Introducción', items: [] })
    expect(typeof p!.sections[0].id).toBe('string')
  })

  it('saveProject actualiza updatedAt y listProjects ordena por el más reciente', async () => {
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(1000)
    const a = await createProject({ title: 'A', kind: 'ensayo' })
    now.mockReturnValue(2000)
    await createProject({ title: 'B', kind: 'plancha' })
    now.mockReturnValue(3000)
    const pa = (await getProject(a))!
    await saveProject({ ...pa, thesis: 'tesis' })
    now.mockRestore()
    const saved = (await getProject(a))!
    expect(saved.updatedAt).toBe(3000)
    expect(saved.thesis).toBe('tesis')
    expect((await listProjects()).map((p) => p.title)).toEqual(['A', 'B'])
  })

  it('borra', async () => {
    const id = await createProject({ title: 'X', kind: 'estudio' })
    await deleteProject(id)
    expect(await getProject(id)).toBeUndefined()
  })

  it('addNoteToProject añade la nota al final de la sección', async () => {
    const id = await createProject({ title: 'X', kind: 'trazado' })
    const section = (await getProject(id))!.sections[0].id
    await addNoteToProject(id, section, 5)
    await addNoteToProject(id, section, 7)
    expect((await getProject(id))!.sections[0].items).toMatchObject([{ type: 'note', noteId: 5 }, { type: 'note', noteId: 7 }])
  })
})
