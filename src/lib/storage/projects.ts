import { currentLang, t } from '../../i18n'
import { db, type Project, type ProjectKind, type ProjectSection } from './db'

export function newSection(title: string): ProjectSection {
  return { id: crypto.randomUUID(), title, items: [] }
}

export async function createProject(p: Pick<Project, 'title' | 'kind'>): Promise<number> {
  const now = Date.now()
  return (await db.projects.add({
    title: p.title,
    kind: p.kind,
    topic: '',
    thesis: '',
    sections: [newSection(t('project.firstSection'))],
    lang: currentLang(),
    createdAt: now,
    updatedAt: now,
  })) as number
}

export async function getProject(id: number): Promise<Project | undefined> {
  return db.projects.get(id)
}

export async function listProjects(): Promise<Project[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray()
}

export async function saveProject(p: Project): Promise<void> {
  await db.projects.put({ ...p, updatedAt: Date.now() })
}

export async function deleteProject(id: number): Promise<void> {
  await db.projects.delete(id)
}

export const PROJECT_KINDS: ProjectKind[] = ['trazado', 'plancha', 'instruccion', 'ensayo', 'estudio']
