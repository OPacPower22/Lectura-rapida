import { useEffect, useState } from 'react'
import { t } from '../../i18n'
import { db, type GlossaryEntry, type Source } from '../../lib/storage/db'
import { deleteGlossaryEntry, listGlossary, updateGlossaryEntry } from '../../lib/storage/glossary'

function EntryItem({ entry, source, onChanged }: { entry: GlossaryEntry; source?: Source; onChanged(): void }) {
  const [definition, setDefinition] = useState(entry.definition)
  const [translation, setTranslation] = useState(entry.translation ?? '')
  const dirty = definition !== entry.definition || translation !== (entry.translation ?? '')

  return (
    <li className="space-y-2 rounded-lg border border-line bg-surface p-4">
      <p className="text-lg font-semibold" lang={entry.lang}>
        {entry.term}
      </p>
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault()
          await updateGlossaryEntry(entry.id!, { definition: definition.trim(), translation: translation.trim() || undefined })
          onChanged()
        }}
      >
        <input
          aria-label={t('glossary.definitionOf', { term: entry.term })}
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder={t('annot.definition')}
          className="w-full rounded border border-line-strong bg-surface p-2"
        />
        <input
          aria-label={t('glossary.translationOf', { term: entry.term })}
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder={t('annot.translation')}
          className="w-full rounded border border-line-strong bg-surface p-2"
        />
        <div className="flex gap-3 text-sm">
          {dirty && (
            <button type="submit" className="rounded bg-accent px-3 py-1 text-on-accent">
              {t('annot.save')}
            </button>
          )}
          <button
            type="button"
            className="text-err-ink underline"
            onClick={async () => {
              if (!window.confirm(t('glossary.confirmDelete', { term: entry.term }))) return
              await deleteGlossaryEntry(entry.id!)
              onChanged()
            }}
          >
            {t('notes.delete')}
          </button>
        </div>
      </form>
      {entry.context && (
        <p className="italic text-muted" lang={entry.lang}>
          {entry.context}
        </p>
      )}
      {source && <p className="text-sm text-muted">{t('glossary.source', { title: source.title })}</p>}
    </li>
  )
}

async function fetchGlossary(): Promise<{ list: GlossaryEntry[]; map: Map<number, Source> }> {
  const list = await listGlossary()
  const ids = [...new Set(list.map((e) => e.sourceId).filter((id): id is number => id !== undefined))]
  const found = await db.sources.bulkGet(ids)
  return { list, map: new Map(found.filter((s): s is Source => !!s).map((s) => [s.id!, s])) }
}

export function GlossaryPage() {
  const [entries, setEntries] = useState<GlossaryEntry[] | null>(null)
  const [sources, setSources] = useState<Map<number, Source>>(new Map())

  const load = () =>
    fetchGlossary()
      .then(({ list, map }) => {
        setSources(map)
        setEntries(list)
      })
      .catch(() => setEntries([]))
  useEffect(() => {
    load()
  }, [])

  const groups = new Map<string, GlossaryEntry[]>()
  for (const e of entries ?? []) groups.set(e.lang, [...(groups.get(e.lang) ?? []), e])

  return (
    <section className="mx-auto max-w-prose space-y-5">
      <h1 className="text-3xl font-bold">{t('glossary.title')}</h1>
      {entries?.length === 0 && <p>{t('glossary.empty')}</p>}
      {[...groups].map(([lang, items]) => (
        <section key={lang} className="space-y-3">
          <h2 className="text-xl font-semibold">{t(`lang.${lang}` as Parameters<typeof t>[0]) ?? lang}</h2>
          <ul className="space-y-3">
            {items.map((entry) => (
              <EntryItem key={`${entry.id}-${entry.definition}-${entry.translation}`} entry={entry} source={entry.sourceId ? sources.get(entry.sourceId) : undefined} onChanged={load} />
            ))}
          </ul>
        </section>
      ))}
    </section>
  )
}
