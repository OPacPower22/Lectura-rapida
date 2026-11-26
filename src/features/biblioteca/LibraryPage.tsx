import { LibraryBig } from 'lucide-react'
import { PageTitle } from '../../ui/PageTitle'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../i18n'
import type { Source, StoredDocument } from '../../lib/storage/db'
import { deleteDocument, listDocuments } from '../../lib/storage/library'

function percentRead(doc: StoredDocument): number {
  const total = doc.chapters.reduce((s, c) => s + c.paragraphs.length, 0)
  if (total === 0) return 0
  const before =
    doc.chapters.slice(0, doc.position.chapter).reduce((s, c) => s + c.paragraphs.length, 0) + doc.position.paragraph
  return Math.round((before / total) * 100)
}

const linkButton = 'rounded-md border border-line-strong px-4 py-2 hover:bg-hover'

export function LibraryPage() {
  const [items, setItems] = useState<{ doc: StoredDocument; source: Source }[] | null>(null)

  const load = () => listDocuments().then(setItems).catch(() => setItems([]))
  useEffect(() => {
    load()
  }, [])

  async function remove(doc: StoredDocument) {
    if (!window.confirm(t('library.confirmDelete', { title: doc.title }))) return
    await deleteDocument(doc.id!)
    await load()
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <PageTitle Icon={LibraryBig} marker="read">{t('library.title')}</PageTitle>
      <div className="flex flex-wrap gap-2">
        <Link to="/biblioteca/importar" className="rounded-md bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover">
          {t('library.add')}
        </Link>
        <Link to="/biblioteca/fisico" className={linkButton}>
          {t('library.physical')}
        </Link>
        <Link to="/leer" className={linkButton}>
          {t('library.quick')}
        </Link>
      </div>
      {items?.length === 0 && <p>{t('library.empty')}</p>}
      <ul className="space-y-3">
        {items?.map(({ doc, source }) => (
          <li key={doc.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{doc.title}</p>
              <p className="text-sm text-muted">
                {[source.author, t(`format.${doc.format}`), t('library.progress', { value: percentRead(doc) })]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <Link to={`/biblioteca/${doc.id}`} className="rounded-md bg-accent px-4 py-2 text-on-accent hover:bg-accent-hover">
              {t('library.continue')}
            </Link>
            <button type="button" onClick={() => remove(doc)} className="rounded-md border border-err-line px-3 py-2 text-err-ink">
              {t('library.delete')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
