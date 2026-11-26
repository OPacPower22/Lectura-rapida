import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../i18n'
import { db, type Source, type SourceType } from '../../lib/storage/db'
import { listSources, updateSource } from '../../lib/storage/library'
import { Reference } from '../../ui/Reference'
import { input, outlineButton, primaryButton } from '../../ui/styles'

const TYPES: SourceType[] = ['libro', 'articulo', 'web', 'documento']

function SourceForm({ source, notes }: { source: Source; notes: number }) {
  const [draft, setDraft] = useState(source)
  const [saved, setSaved] = useState(false)
  const [stored, setStored] = useState(source)
  const field = (key: 'title' | 'author' | 'year' | 'publisher' | 'url', label: string, type = 'text') => (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={draft[key] ?? ''}
        onChange={(e) => {
          setDraft({ ...draft, [key]: e.target.value })
          setSaved(false)
        }}
        className={input}
        required={key === 'title'}
      />
    </label>
  )
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault()
          const trim = (v?: string) => v?.trim() || undefined
          const patch = {
            type: draft.type,
            title: draft.title.trim(),
            author: trim(draft.author),
            year: trim(draft.year),
            publisher: trim(draft.publisher),
            url: trim(draft.url),
          }
          await updateSource(source.id!, patch)
          setStored({ ...stored, ...patch })
          setSaved(true)
        }}
      >
        <div className="sm:col-span-2">{field('title', t('sources.title'))}</div>
        <label className="block">
          <span className="text-sm font-medium">{t('sources.type')}</span>
          <select value={draft.type} onChange={(e) => { setDraft({ ...draft, type: e.target.value as SourceType }); setSaved(false) }} className={input}>
            {TYPES.map((type) => (
              <option key={type} value={type}>{t(`sources.type.${type}`)}</option>
            ))}
          </select>
        </label>
        {field('author', t('sources.author'))}
        {field('year', t('sources.year'))}
        {field('publisher', t('sources.publisher'))}
        <div className="sm:col-span-2">{field('url', t('sources.url'), 'url')}</div>
        <p className="text-sm text-muted sm:col-span-2">{t('sources.authorHelp')}</p>
        <div className="rounded bg-hover p-2 text-sm sm:col-span-2">
          <p className="text-muted">{t('sources.preview')}</p>
          <p className="pl-6 -indent-6"><Reference source={stored} /></p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" className={primaryButton}>{t('sources.save')}</button>
          <span className="text-sm text-muted">{t('sources.notes', { count: notes })}</span>
          {saved && <span role="status" className="text-sm">{t('sources.saved')}</span>}
        </div>
      </form>
    </article>
  )
}

export function SourcesPage() {
  const [sources, setSources] = useState<{ source: Source; notes: number }[] | null>(null)

  useEffect(() => {
    Promise.all([listSources(), db.notes.toArray()])
      .then(([list, notes]) =>
        setSources(list.map((source) => ({ source, notes: notes.filter((n) => n.sourceId === source.id).length }))),
      )
      .catch(() => setSources([]))
  }, [])

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold">{t('sources.pageTitle')}</h1>
      <p>{t('sources.lead')}</p>
      <Link to="/cuaderno" className={`inline-block ${outlineButton}`}>{t('sources.back')}</Link>
      {sources !== null && sources.length === 0 && <p>{t('sources.empty')}</p>}
      <div className="space-y-4">
        {sources?.map(({ source, notes }) => (
          <SourceForm key={source.id} source={source} notes={notes} />
        ))}
      </div>
    </section>
  )
}
