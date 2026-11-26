import { NotebookPen } from 'lucide-react'
import { PageTitle } from '../../ui/PageTitle'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t, tPlural } from '../../i18n'
import { db, type Note, type NoteKind, type Project, type Source } from '../../lib/storage/db'
import { listSources } from '../../lib/storage/library'
import { listAllNotes, listTags, updateNote, type NoteFilter } from '../../lib/storage/notes'
import { addNoteToProject, listProjects } from '../../lib/storage/projects'
import { input, outlineButton, primaryButton, smallButton } from '../../ui/styles'
import { parseTags } from './tags'

const KINDS: NoteKind[] = ['subrayado', 'cita', 'parafrasis', 'idea']

interface Ctx {
  sources: Map<number, Source>
  documents: Set<number>
  projects: Project[]
  reload(): void
}

function EditForm({ note, onDone }: { note: Note; onDone(changed: boolean): void }) {
  const [text, setText] = useState(note.text)
  const [kind, setKind] = useState<NoteKind>(note.kind)
  const [tags, setTags] = useState((note.tags ?? []).join(', '))
  const [error, setError] = useState(false)
  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={async (e) => {
        e.preventDefault()
        try {
          await updateNote(note.id!, { text: text.trim(), kind, tags: parseTags(tags) })
        } catch {
          setError(true)
          return
        }
        onDone(true)
      }}
    >
      <label className="block">
        <span className="text-sm font-medium">{t('notebook.text')}</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={input} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">{t('notebook.kind')}</span>
        <select value={kind} onChange={(e) => setKind(e.target.value as NoteKind)} className={input}>
          {KINDS.map((k) => (
            <option key={k} value={k}>{t(`note.kind.${k}`)}</option>
          ))}
        </select>
      </label>
      <div>
        <label className="block">
          <span className="text-sm font-medium">{t('notebook.tags')}</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={input} aria-describedby={`tags-help-${note.id}`} />
        </label>
        <p id={`tags-help-${note.id}`} className="text-sm text-muted">{t('notebook.tagsHelp')}</p>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={primaryButton}>{t('notebook.save')}</button>
        <button type="button" className={outlineButton} onClick={() => onDone(false)}>{t('notebook.cancel')}</button>
      </div>
      {error && <p role="alert" className="text-err-ink">{t('notebook.saveError')}</p>}
    </form>
  )
}

function AddToProject({ note, projects }: { note: Note; projects: Project[] }) {
  const [projectId, setProjectId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [added, setAdded] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const project = projects.find((p) => String(p.id) === projectId)
  if (!projects.length) {
    return (
      <p className="mt-2 text-sm">
        {t('notebook.noProjects')} <Link to="/proyectos" className="underline">{t('notebook.createProject')}</Link>
      </p>
    )
  }
  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!project || !sectionId) return
        try {
          await addNoteToProject(project.id!, sectionId, note.id!)
          setAdded(project.title)
          setError(false)
        } catch {
          setError(true)
        }
      }}
    >
      <label>
        <span className="block text-sm font-medium">{t('notebook.project')}</span>
        <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setSectionId(''); setAdded(null) }} className={input}>
          <option value="">{t('notebook.choose')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="block text-sm font-medium">{t('notebook.section')}</span>
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={input} disabled={!project}>
          <option value="">{t('notebook.choose')}</option>
          {project?.sections.map((s) => (
            <option key={s.id} value={s.id}>{s.title || t('project.untitledSection')}</option>
          ))}
        </select>
      </label>
      <button type="submit" className={primaryButton} disabled={!project || !sectionId}>{t('notebook.add')}</button>
      {added && <p role="status" className="w-full text-sm">{t('notebook.added', { project: added })}</p>}
      {error && <p role="alert" className="w-full text-sm text-err-ink">{t('notebook.addError')}</p>}
    </form>
  )
}

function NoteCard({ note, ctx }: { note: Note; ctx: Ctx }) {
  const [mode, setMode] = useState<'view' | 'edit' | 'project'>('view')
  const source = ctx.sources.get(note.sourceId)
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-accent-ink">
        {t(`note.kind.${note.kind}`)}
        {note.page !== undefined && ` · ${t('notes.page', { page: note.page })}`}
      </p>
      {note.quote && <blockquote className="italic">«{note.quote}»</blockquote>}
      {mode === 'edit' ? (
        <EditForm note={note} onDone={(changed) => { setMode('view'); if (changed) ctx.reload() }} />
      ) : (
        note.text && <p className="whitespace-pre-wrap">{note.text}</p>
      )}
      <p className="mt-1 text-sm text-muted">
        {source ? source.title : t('notebook.sourceDeleted')}
      </p>
      {note.tags && note.tags.length > 0 && (
        <ul className="mt-1 flex flex-wrap gap-1" aria-label={t('notebook.tags')}>
          {note.tags.map((tag) => (
            <li key={tag} className="rounded bg-accent-soft px-2 text-sm text-accent-ink">{tag}</li>
          ))}
        </ul>
      )}
      {mode !== 'edit' && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={smallButton} onClick={() => setMode('edit')}>{t('notes.edit')}</button>
          <button type="button" className={smallButton} aria-expanded={mode === 'project'} onClick={() => setMode(mode === 'project' ? 'view' : 'project')}>
            {t('notebook.addToProject')}
          </button>
          {note.documentId !== undefined && ctx.documents.has(note.documentId) && (
            <Link to={`/biblioteca/${note.documentId}`} className={smallButton}>{t('notebook.goToDocument')}</Link>
          )}
        </div>
      )}
      {mode === 'project' && <AddToProject note={note} projects={ctx.projects} />}
    </article>
  )
}

export function NotebookPage() {
  const [filter, setFilter] = useState<NoteFilter>({})
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [ctx, setCtx] = useState<Omit<Ctx, 'reload'>>({ sources: new Map(), documents: new Set(), projects: [] })
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    Promise.all([listSources(), db.documents.toCollection().primaryKeys(), listProjects(), listTags()])
      .then(([sources, docs, projects, allTags]) => {
        setCtx({ sources: new Map(sources.map((s) => [s.id!, s])), documents: new Set(docs as number[]), projects })
        setTags(allTags)
      })
      .catch(() => {})
  }, [version])

  useEffect(() => {
    let live = true
    listAllNotes(filter)
      .then((n) => live && setNotes(n))
      .catch(() => live && setNotes([]))
    return () => {
      live = false
    }
  }, [filter, version])

  const sources = [...ctx.sources.values()]
  const filtering = !!(filter.query || filter.sourceId || filter.kind || filter.tag)

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <PageTitle Icon={NotebookPen} marker="writing">{t('notebook.title')}</PageTitle>
      <p>{t('notebook.lead')}</p>
      <div className="flex flex-wrap gap-2">
        <Link to="/fuentes" className={outlineButton}>{t('notebook.sources')}</Link>
        <Link to="/proyectos" className={outlineButton}>{t('dashboard.act.projects')}</Link>
      </div>
      <div className="grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="block text-sm font-medium">{t('notebook.search')}</span>
          <input type="search" value={filter.query ?? ''} onChange={(e) => setFilter({ ...filter, query: e.target.value })} className={input} />
        </label>
        <label>
          <span className="block text-sm font-medium">{t('notebook.filter.source')}</span>
          <select value={filter.sourceId ?? ''} onChange={(e) => setFilter({ ...filter, sourceId: e.target.value ? Number(e.target.value) : undefined })} className={input}>
            <option value="">{t('notebook.all')}</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-sm font-medium">{t('notebook.filter.kind')}</span>
          <select value={filter.kind ?? ''} onChange={(e) => setFilter({ ...filter, kind: (e.target.value || undefined) as NoteKind | undefined })} className={input}>
            <option value="">{t('notebook.all')}</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>{t(`note.kind.${k}`)}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-sm font-medium">{t('notebook.filter.tag')}</span>
          <select value={filter.tag ?? ''} onChange={(e) => setFilter({ ...filter, tag: e.target.value || undefined })} className={input}>
            <option value="">{t('notebook.all')}</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </label>
      </div>
      {notes !== null && (
        <p role="status" className="text-sm text-muted">{tPlural('notebook.count', notes.length)}</p>
      )}
      {notes !== null && notes.length === 0 && <p>{filtering ? t('notebook.noMatches') : t('notebook.empty')}</p>}
      <div className="space-y-3">
        {notes?.map((note) => (
          <NoteCard key={note.id} note={note} ctx={{ ...ctx, reload }} />
        ))}
      </div>
    </section>
  )
}
