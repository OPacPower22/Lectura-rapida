import { useState, type ClipboardEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { t } from '../../i18n'
import { LANGS, normalizeLang, type Lang } from '../../i18n/langs'
import { importPdf } from '../../lib/formats/pdf'
import { importEpub } from '../../lib/formats/epub'
import { importPlainText } from '../../lib/formats/text'
import { ImportError, MAX_IMPORT_BYTES, type ImportedDocument } from '../../lib/formats/types'
import { importHtml } from '../../lib/formats/web'
import type { DocumentFormat } from '../../lib/storage/db'
import * as library from '../../lib/storage/library'
import { countWords } from '../../lib/text'

type Tab = 'file' | 'paste'

interface Pending {
  imported: ImportedDocument
  format: DocumentFormat
  file?: Blob
}

const button = 'rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:bg-disabled'
const field = 'w-full rounded border border-line-strong bg-surface p-2'

export function ImportPage() {
  const [params] = useSearchParams()
  const sharedUrl = params.get('url') ?? undefined
  const sharedTitle = params.get('title') ?? undefined
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>(sharedUrl || params.get('text') ? 'paste' : 'file')
  const [pasted, setPasted] = useState(params.get('text') && !sharedUrl ? params.get('text')! : '')
  const [pastedHtml, setPastedHtml] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ page: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [lang, setLang] = useState<Lang>('es')
  const [saving, setSaving] = useState(false)

  function review(p: Pending) {
    setPending(p)
    setTitle(p.imported.title)
    setAuthor(p.imported.author ?? '')
    setLang(normalizeLang(p.imported.lang) ?? 'es')
    setError(null)
  }

  function fail(e: unknown) {
    setPending(null)
    setError(e instanceof ImportError ? e.code : 'invalid')
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setPending(null)
    if (file.size > MAX_IMPORT_BYTES) return fail(new ImportError('too-large'))
    const name = file.name.toLowerCase()
    try {
      const data = await file.arrayBuffer()
      if (name.endsWith('.pdf') || file.type === 'application/pdf') {
        const imported = await importPdf(data, {
          fileName: file.name,
          onProgress: (page, total) => setProgress({ page, total }),
        })
        review({ imported, format: 'pdf', file })
      } else if (name.endsWith('.epub') || file.type === 'application/epub+zip') {
        review({ imported: await importEpub(data), format: 'epub', file })
      } else {
        setError('unsupported')
      }
    } catch (e) {
      fail(e)
    } finally {
      setProgress(null)
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData('text/html')
    if (html) {
      e.preventDefault()
      setPastedHtml(html)
      setPasted(e.clipboardData.getData('text/plain') || pasted)
    }
  }

  function processPaste() {
    try {
      if (pastedHtml) {
        const imported = importHtml(pastedHtml, { url: sharedUrl })
        if (sharedTitle) imported.title = sharedTitle
        review({ imported, format: 'web' })
      } else {
        const imported = importPlainText(pasted, { title: sharedTitle, url: sharedUrl })
        review({ imported, format: sharedUrl ? 'web' : 'texto' })
      }
    } catch (e) {
      fail(e)
    }
  }

  async function save() {
    if (!pending) return
    setSaving(true)
    const { imported, format, file } = pending
    const finalTitle = title.trim() || imported.title
    const words = imported.chapters.reduce(
      (sum, c) => sum + c.paragraphs.reduce((s, p) => s + countWords(p, lang), 0),
      0,
    )
    try {
      const id = await library.addDocument({
        source: { ...imported.source, title: finalTitle, author: author.trim() || undefined },
        doc: { format, lang, title: finalTitle, chapters: imported.chapters, words, file },
      })
      navigate(`/biblioteca/${id}`)
    } catch {
      setError('storage')
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-prose space-y-5">
      <h1 className="text-3xl font-bold">{t('import.title')}</h1>

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label={t('import.title')} className="flex flex-wrap gap-2">
          {(['file', 'paste'] as const).map((id, i, all) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              type="button"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                const next = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]
                setTab(next)
                document.getElementById(`tab-${next}`)?.focus()
              }}
              className={`rounded px-3 py-2 ${tab === id ? 'bg-accent text-on-accent' : 'border border-line-strong'}`}
            >
              {t(id === 'file' ? 'import.tab.file' : 'import.tab.paste')}
            </button>
          ))}
        </div>
        <Link to="/biblioteca/fisico" className="rounded border border-line-strong px-3 py-2 hover:bg-hover">
          {t('import.tab.physical')}
        </Link>
      </div>

      {tab === 'file' && (
        <div role="tabpanel" id="panel-file" aria-labelledby="tab-file" className="space-y-2">
          <label className="block">
            <span className="mb-1 block font-medium">{t('import.fileLabel')}</span>
            <input
              type="file"
              accept=".pdf,.epub,application/pdf,application/epub+zip"
              onChange={(e) => onFile(e.target.files?.[0])}
              className="block"
            />
          </label>
          <p className="text-sm text-muted">{t('import.fileHelp')}</p>
          {progress && <p role="status">{t('import.progress', progress)}</p>}
        </div>
      )}

      {tab === 'paste' && (
        <div role="tabpanel" id="panel-paste" aria-labelledby="tab-paste" className="space-y-2">
          {sharedUrl && <p className="rounded border border-line bg-accent-soft p-3 text-accent-ink">{t('import.sharedUrl', { url: sharedUrl })}</p>}
          <label className="block">
            <span className="mb-1 block font-medium">{t('import.pasteLabel')}</span>
            <textarea
              value={pasted}
              onPaste={onPaste}
              onChange={(e) => {
                setPasted(e.target.value)
                setPastedHtml(null)
              }}
              rows={10}
              className={field}
            />
          </label>
          <p className="text-sm text-muted">{t('import.pasteHelp')}</p>
          <button type="button" className={button} disabled={!pasted.trim() && !pastedHtml} onClick={processPaste}>
            {t('import.process')}
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="space-y-2 rounded border border-err-line bg-err-bg p-3 text-err-ink">
          <p>{t(`import.error.${error}` as Parameters<typeof t>[0])}</p>
          {error === 'no-text' && (
            <button type="button" className="rounded border border-err-line px-3 py-1" onClick={() => navigate('/biblioteca/fisico')}>
              {t('import.usePhysical')}
            </button>
          )}
        </div>
      )}

      {pending && (
        <form
          className="space-y-3 rounded-lg border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <h2 className="text-xl font-semibold">{t('import.reviewTitle')}</h2>
          <p className="text-sm text-muted">
            {t('import.summary', {
              chapters: pending.imported.chapters.length,
              words: pending.imported.chapters.reduce((s, c) => s + c.paragraphs.reduce((w, p) => w + countWords(p, lang), 0), 0),
            })}
          </p>
          <label className="block">
            <span className="mb-1 block font-medium">{t('import.field.title')}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">{t('import.field.author')}</span>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">{t('import.field.lang')}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded border border-line-strong bg-surface p-2">
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {t(`lang.${l}`)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={button} disabled={saving}>
            {t('import.save')}
          </button>
        </form>
      )}
    </section>
  )
}
