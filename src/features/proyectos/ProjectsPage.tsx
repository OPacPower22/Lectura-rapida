import { PenLine } from 'lucide-react'
import { PageTitle } from '../../ui/PageTitle'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { currentLang, t, tPlural } from '../../i18n'
import type { Project, ProjectKind } from '../../lib/storage/db'
import { createProject, listProjects, PROJECT_KINDS } from '../../lib/storage/projects'
import { input, primaryButton } from '../../ui/styles'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<ProjectKind>('trazado')
  const navigate = useNavigate()

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [])

  const date = new Intl.DateTimeFormat(currentLang(), { dateStyle: 'medium' })

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageTitle Icon={PenLine} marker="writing">{t('projects.title')}</PageTitle>
      <p>{t('projects.lead')}</p>
      <form
        className="grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!title.trim()) return
          const id = await createProject({ title: title.trim(), kind })
          navigate(`/proyectos/${id}`)
        }}
      >
        <label>
          <span className="block text-sm font-medium">{t('projects.newTitle')}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className={input} />
        </label>
        <label>
          <span className="block text-sm font-medium">{t('projects.kind')}</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as ProjectKind)} className={input}>
            {PROJECT_KINDS.map((k) => (
              <option key={k} value={k}>{t(`project.kind.${k}`)}</option>
            ))}
          </select>
        </label>
        <button type="submit" className={primaryButton}>{t('projects.create')}</button>
      </form>
      {projects !== null && projects.length === 0 && <p>{t('projects.empty')}</p>}
      <ul className="space-y-3">
        {projects?.map((p) => (
          <li key={p.id}>
            <Link to={`/proyectos/${p.id}`} className="block rounded-lg border border-line bg-surface p-4 hover:border-accent">
              <span className="block text-lg font-semibold">{p.title}</span>
              <span className="block text-sm text-muted">
                {t(`project.kind.${p.kind}`)} · {tPlural('projects.sections', p.sections.length)} · {t('projects.updated', { date: date.format(p.updatedAt) })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
