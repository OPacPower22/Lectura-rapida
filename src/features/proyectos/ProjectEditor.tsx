import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { t } from '../../i18n'
import { inTextCitation } from '../../lib/citation'
import { downloadBlob, slugify } from '../../lib/download'
import { buildProjectDocument, toMarkdown } from '../../lib/exportProject'
import { db, type Note, type Project, type ProjectItem, type ProjectKind, type ProjectSection, type Source } from '../../lib/storage/db'
import { listSources } from '../../lib/storage/library'
import { fold } from '../../lib/storage/notes'
import { deleteProject, getProject, newSection, PROJECT_KINDS, saveProject } from '../../lib/storage/projects'
import { input, outlineButton, primaryButton, smallButton } from '../../ui/styles'
import { appendItems, moveItem, moveSection, removeItem, renameSection, transferItem, updateItem } from './ops'

const AUTOSAVE_MS = 800

interface Lookup {
  notes: Map<number, Note>
  sources: Map<number, Source>
}

function NotePicker({ lookup, onAdd, onCancel }: { lookup: Lookup; onAdd(ids: number[]): void; onCancel(): void }) {
  const [query, setQuery] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [picked, setPicked] = useState<number[]>([])
  const q = fold(query.trim())
  const notes = [...lookup.notes.values()]
    .filter((n) => !sourceId || n.sourceId === Number(sourceId))
    .filter((n) => !q || fold(`${n.quote ?? ''} ${n.text}`).includes(q))
    .sort((a, b) => b.createdAt - a.createdAt)
  return (
    <fieldset className="space-y-3 rounded border border-line-strong p-3">
      <legend className="px-1 font-medium">{t('project.pickNotes')}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <label>
          <span className="block text-sm">{t('notebook.search')}</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} className={input} />
        </label>
        <label>
          <span className="block text-sm">{t('notebook.filter.source')}</span>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className={input}>
            <option value="">{t('notebook.all')}</option>
            {[...lookup.sources.values()].map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </label>
      </div>
      {notes.length === 0 && <p className="text-sm text-muted">{t('project.noNotes')}</p>}
      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {notes.map((n) => (
          <li key={n.id}>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={picked.includes(n.id!)}
                onChange={(e) => setPicked(e.target.checked ? [...picked, n.id!] : picked.filter((id) => id !== n.id))}
              />
              <span>
                <span className="text-xs uppercase text-muted">{t(`note.kind.${n.kind}`)} </span>
                {n.quote ? `«${n.quote}» ` : ''}
                {n.text} <span className="text-muted">{inTextCitation(lookup.sources.get(n.sourceId), n.page)}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryButton} disabled={!picked.length} onClick={() => onAdd(picked)}>
          {t('project.addSelected', { count: picked.length })}
        </button>
        <button type="button" className={outlineButton} onClick={onCancel}>{t('notebook.cancel')}</button>
      </div>
    </fieldset>
  )
}

function ItemView({ item, n, lookup }: { item: Extract<ProjectItem, { type: 'note' }>; n: number; lookup: Lookup }) {
  const note = lookup.notes.get(item.noteId)
  if (!note) return <p className="text-err-ink" data-n={n}>{t('project.noteDeleted')}</p>
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{t(`note.kind.${note.kind}`)}</p>
      {note.quote && <blockquote className="italic">«{note.quote}»</blockquote>}
      {note.text && <p className="whitespace-pre-wrap">{note.text}</p>}
      <p className="text-sm text-muted">{inTextCitation(lookup.sources.get(note.sourceId), note.page)}</p>
    </div>
  )
}

function SectionEditor({
  project,
  section,
  index,
  lookup,
  update,
  onMoved,
}: {
  project: Project
  section: ProjectSection
  index: number
  lookup: Lookup
  update(p: Project): void
  onMoved(itemId: string, message: string): void
}) {
  const [picking, setPicking] = useState(false)
  const [targets, setTargets] = useState<Record<string, string>>({})
  const name = section.title || t('project.untitledSection')
  const others = project.sections.filter((s) => s.id !== section.id)
  return (
    <section aria-label={name} className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-48 flex-1">
          <span className="block text-sm font-medium">{t('project.sectionTitle')}</span>
          <input value={section.title} onChange={(e) => update(renameSection(project, section.id, e.target.value))} className={input} />
        </label>
        <button type="button" className={smallButton} disabled={index === 0} onClick={() => update(moveSection(project, index, -1))}>
          {t('project.sectionUp')}
        </button>
        <button type="button" className={smallButton} disabled={index === project.sections.length - 1} onClick={() => update(moveSection(project, index, 1))}>
          {t('project.sectionDown')}
        </button>
        <button
          type="button"
          className={smallButton}
          disabled={project.sections.length === 1}
          onClick={() => {
            if (section.items.length && !window.confirm(t('project.confirmDeleteSection', { title: name }))) return
            update({ ...project, sections: project.sections.filter((s) => s.id !== section.id) })
          }}
        >
          {t('project.sectionDelete')}
        </button>
      </div>
      {section.items.length === 0 && <p className="text-sm text-muted">{t('project.emptySection')}</p>}
      <ol className="space-y-3">
        {section.items.map((item, i) => {
          const itemId = item.id ?? `${section.id}-${i}`
          const n = i + 1
          const move = (delta: -1 | 1) => {
            update(moveItem(project, section.id, i, delta))
            onMoved(itemId, t('project.movedTo', { n: n + delta }))
          }
          return (
            <li key={itemId} data-item={itemId} className="space-y-2 border-l-4 border-accent pl-3">
              {item.type === 'note' ? (
                <ItemView item={item} n={n} lookup={lookup} />
              ) : (
                <label className="block">
                  <span className="block text-sm font-medium">{t('project.paragraph', { n })}</span>
                  <textarea
                    value={item.text}
                    rows={4}
                    onChange={(e) => update(updateItem(project, section.id, i, { ...item, type: 'text', text: e.target.value }))}
                    className={input}
                  />
                </label>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" data-action="up" aria-label={t('project.itemUpN', { n })} className={smallButton} disabled={i === 0} onClick={() => move(-1)}>
                  {t('project.itemUp')}
                </button>
                <button
                  type="button"
                  data-action="down"
                  aria-label={t('project.itemDownN', { n })}
                  className={smallButton}
                  disabled={i === section.items.length - 1}
                  onClick={() => move(1)}
                >
                  {t('project.itemDown')}
                </button>
                {others.length > 0 && (
                  <>
                    <label className="flex items-center gap-1 text-sm">
                      <span aria-hidden="true">{t('project.moveTo')}</span>
                      <select
                        aria-label={t('project.moveToN', { n })}
                        value={targets[itemId] ?? ''}
                        onChange={(e) => setTargets({ ...targets, [itemId]: e.target.value })}
                        className="rounded border border-line-strong bg-surface px-2 py-1"
                      >
                        <option value="">{t('notebook.choose')}</option>
                        {others.map((s) => (
                          <option key={s.id} value={s.id}>{s.title || t('project.untitledSection')}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      aria-label={t('project.moveN', { n })}
                      className={smallButton}
                      disabled={!targets[itemId]}
                      onClick={() => {
                        const to = others.find((s) => s.id === targets[itemId])
                        if (!to) return
                        update(transferItem(project, section.id, i, to.id))
                        onMoved(itemId, t('project.movedToSection', { title: to.title || t('project.untitledSection') }))
                      }}
                    >
                      {t('project.move')}
                    </button>
                  </>
                )}
                <button type="button" aria-label={t('project.itemRemoveN', { n })} className={smallButton} onClick={() => update(removeItem(project, section.id, i))}>
                  {t('project.itemRemove')}
                </button>
              </div>
            </li>
          )
        })}
      </ol>
      {picking ? (
        <NotePicker
          lookup={lookup}
          onCancel={() => setPicking(false)}
          onAdd={(ids) => {
            update(appendItems(project, section.id, ids.map((noteId) => ({ type: 'note', noteId, id: crypto.randomUUID() }))))
            setPicking(false)
          }}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={outlineButton} onClick={() => setPicking(true)}>{t('project.addNotes')}</button>
          <button type="button" className={outlineButton} onClick={() => update(appendItems(project, section.id, [{ type: 'text', text: '', id: crypto.randomUUID() }]))}>
            {t('project.addParagraph')}
          </button>
        </div>
      )}
    </section>
  )
}

export function ProjectEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null | undefined>(undefined)
  const [lookup, setLookup] = useState<Lookup>({ notes: new Map(), sources: new Map() })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [exporting, setExporting] = useState<'idle' | 'working' | 'error'>('idle')
  const [announce, setAnnounce] = useState('')
  const focusItem = useRef<string | null>(null)
  const focusAction = useRef<string | undefined>(undefined)

  // Tras mover un elemento, el foco lo sigue: mismo botón si sigue activo; si no, el otro.
  useEffect(() => {
    const target = focusItem.current
    if (!target) return
    focusItem.current = null
    const li = document.querySelector<HTMLElement>(`[data-item="${CSS.escape(target)}"]`)
    const buttons = li ? [...li.querySelectorAll<HTMLButtonElement>('button[data-action]')] : []
    ;(buttons.find((b) => !b.disabled && b.dataset.action === focusAction.current) ?? buttons.find((b) => !b.disabled))?.focus()
  }, [project])
  const pending = useRef<Project | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    Promise.all([getProject(Number(id)), db.notes.toArray(), listSources()])
      .then(([p, notes, sources]) => {
        setLookup({ notes: new Map(notes.map((n) => [n.id!, n])), sources: new Map(sources.map((s) => [s.id!, s])) })
        // Los elementos sin id (versiones anteriores) reciben uno estable.
        setProject(
          p
            ? { ...p, sections: p.sections.map((sec) => ({ ...sec, items: sec.items.map((it) => (it.id ? it : { ...it, id: crypto.randomUUID() })) })) }
            : null,
        )
      })
      .catch(() => setProject(null))
  }, [id])

  // Al salir, guarda lo pendiente sin esperar la pausa.
  useEffect(
    () => () => {
      clearTimeout(timer.current)
      if (pending.current) void saveProject(pending.current)
    },
    [],
  )

  function update(next: Project) {
    setProject(next)
    pending.current = next
    setStatus('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const toSave = pending.current
      if (!toSave) return
      saveProject(toSave)
        .then(() => {
          if (pending.current === toSave) pending.current = null
          setStatus('saved')
        })
        .catch(() => setStatus('error'))
    }, AUTOSAVE_MS)
  }

  async function exportAs(format: 'docx' | 'md') {
    if (!project) return
    setExporting('working')
    try {
      const doc = buildProjectDocument(project, lookup.notes, lookup.sources)
      const blob =
        format === 'md'
          ? new Blob([toMarkdown(doc)], { type: 'text/markdown;charset=utf-8' })
          : await (await import('../../lib/exportDocx')).toDocx(doc)
      downloadBlob(blob, `${slugify(project.title)}.${format}`)
      setExporting('idle')
    } catch {
      setExporting('error')
    }
  }

  if (project === undefined) return null
  if (project === null) {
    return (
      <section className="mx-auto max-w-prose space-y-3">
        <p role="alert">{t('project.notFound')}</p>
        <Link to="/proyectos" className="underline">{t('project.back')}</Link>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/proyectos" className="underline">{t('project.back')}</Link>
        <p role="status" className="text-sm text-muted">
          {status === 'saving' ? t('project.saving') : status === 'saved' ? t('project.saved') : status === 'error' ? t('project.saveError') : ''}
        </p>
      </div>
      <h1 className="text-3xl font-bold">{project.title || t('project.untitled')}</h1>
      <p aria-live="polite" className="sr-only">{announce}</p>
      <div className="grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2">
        <label>
          <span className="block text-sm font-medium">{t('project.titleLabel')}</span>
          <input value={project.title} onChange={(e) => update({ ...project, title: e.target.value })} className={input} />
        </label>
        <label>
          <span className="block text-sm font-medium">{t('projects.kind')}</span>
          <select value={project.kind} onChange={(e) => update({ ...project, kind: e.target.value as ProjectKind })} className={input}>
            {PROJECT_KINDS.map((k) => (
              <option key={k} value={k}>{t(`project.kind.${k}`)}</option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="block text-sm font-medium">{t('project.topic')}</span>
          <input value={project.topic} onChange={(e) => update({ ...project, topic: e.target.value })} className={input} />
        </label>
        <label className="sm:col-span-2">
          <span className="block text-sm font-medium">{t('project.thesis')}</span>
          <textarea value={project.thesis} rows={3} onChange={(e) => update({ ...project, thesis: e.target.value })} className={input} />
        </label>
      </div>
      {project.sections.map((section, i) => (
        <SectionEditor
          key={section.id}
          project={project}
          section={section}
          index={i}
          lookup={lookup}
          update={update}
          onMoved={(itemId, message) => {
            focusAction.current = (document.activeElement as HTMLElement | null)?.dataset?.action
            focusItem.current = itemId
            setAnnounce(message)
          }}
        />
      ))}
      <section aria-labelledby="export-title" className="space-y-2 rounded-lg border border-line bg-surface p-4">
        <h2 id="export-title" className="font-semibold">{t('export.title')}</h2>
        <p className="text-sm text-muted">{t('export.help')}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primaryButton} disabled={exporting === 'working'} onClick={() => exportAs('docx')}>
            {t('export.word')}
          </button>
          <button type="button" className={outlineButton} disabled={exporting === 'working'} onClick={() => exportAs('md')}>
            {t('export.markdown')}
          </button>
        </div>
        {exporting === 'working' && <p role="status">{t('export.working')}</p>}
        {exporting === 'error' && <p role="alert" className="text-err-ink">{t('export.error')}</p>}
      </section>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={outlineButton} onClick={() => update({ ...project, sections: [...project.sections, newSection('')] })}>
          {t('project.addSection')}
        </button>
        <button
          type="button"
          className={outlineButton}
          onClick={async () => {
            if (!window.confirm(t('project.confirmDelete', { title: project.title }))) return
            clearTimeout(timer.current)
            pending.current = null
            await deleteProject(project.id!)
            navigate('/proyectos')
          }}
        >
          {t('project.delete')}
        </button>
      </div>
    </div>
  )
}
