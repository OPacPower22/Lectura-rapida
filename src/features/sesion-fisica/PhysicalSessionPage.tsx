import { useEffect, useRef, useState } from 'react'
import { t } from '../../i18n'
import { LANGS, type Lang } from '../../i18n/langs'
import { computeWpm } from '../../lib/metrics'
import { estimateWordsPerPage, physicalWords } from '../../lib/physical'
import { PROBE_RANGE_PROGRAMA } from '../../lib/probes'
import type { Source } from '../../lib/storage/db'
import { addSource, listPhysicalBooks } from '../../lib/storage/library'
import { addNote } from '../../lib/storage/notes'
import { saveSession } from '../../lib/storage/repo'
import { getSetting, setSetting } from '../../lib/storage/settings'
import type { Clock } from '../../lib/stopwatch'
import { usePreferences } from '../../app/preferencesContext'
import { playChime, vibrate } from '../../lib/sound'
import { keepScreenOn } from '../../lib/wakeLock'
import { ResultsCard, type ResultsData } from '../diagnostico/ResultsCard'
import { computeResults } from '../diagnostico/results'
import { LeaveGuard } from '../lector/LeaveGuard'
import { ProbeDialog } from '../lector/ProbeDialog'
import { useFocusAfterProbe } from '../lector/readerUtils'
import { useReadingSession, type SessionOutcome } from '../lector/useReadingSession'

type Step = 'book' | 'start' | 'wpp' | 'ready' | 'reading' | 'finish' | 'results'

const primary = 'rounded-md bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:bg-disabled'
const outline = 'rounded-md border border-line-strong px-4 py-2 hover:bg-hover'
const field = 'w-full rounded border border-line-strong bg-surface p-2'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  )
}

const toInt = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : NaN)

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function PhysicalSessionPage({ now }: { now?: Clock }) {
  const [step, setStep] = useState<Step>('book')
  const [books, setBooks] = useState<Source[]>([])
  const [choice, setChoice] = useState<number | 'new' | null>(null)
  const [book, setBook] = useState({ title: '', author: '', year: '', publisher: '' })
  const [source, setSource] = useState<Source | null>(null)
  const [startPage, setStartPage] = useState('')
  const [purpose, setPurpose] = useState('')
  const [lines, setLines] = useState(['', '', ''])
  const [linesPerPage, setLinesPerPage] = useState('')
  const [wpp, setWpp] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [notePage, setNotePage] = useState('')
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null)
  const [endPage, setEndPage] = useState('')
  const [recall, setRecall] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [implausible, setImplausible] = useState<{ pages: number; wpm: number } | null>(null)
  const [results, setResults] = useState<ResultsData | null>(null)
  const [saveError, setSaveError] = useState(false)

  const [lang, setLang] = useState<Lang>('es')
  const { prefs } = usePreferences()
  const session = useReadingSession({ probeRange: PROBE_RANGE_PROGRAMA, now, pauseWhenHidden: false })
  const distractedRef = useRef<HTMLButtonElement>(null)
  useFocusAfterProbe(session.probeOpen, distractedRef)

  useEffect(() => {
    listPhysicalBooks().then(setBooks).catch(() => setBooks([]))
  }, [])

  useEffect(() => {
    if (session.probeOpen) {
      if (prefs.sound) playChime()
      if (prefs.vibration) vibrate()
    }
  }, [session.probeOpen, prefs.sound, prefs.vibration])

  useEffect(() => {
    if (session.status !== 'reading') return
    return keepScreenOn()
  }, [session.status])

  useEffect(() => {
    if (session.status !== 'reading') return
    const id = setInterval(() => setElapsed(session.elapsedMs()), 1000)
    return () => clearInterval(id)
  }, [session])

  const lineCounts = lines.map(toInt)
  const estimate =
    lineCounts.every((n) => n > 0) && toInt(linesPerPage) > 0 ? estimateWordsPerPage(lineCounts, toInt(linesPerPage)) : null

  async function confirmBook() {
    let chosen: Source | undefined
    if (choice === 'new') {
      const data = {
        type: 'libro' as const,
        title: book.title.trim(),
        author: book.author.trim() || undefined,
        year: book.year.trim() || undefined,
        publisher: book.publisher.trim() || undefined,
      }
      const id = await addSource(data)
      chosen = { ...data, id, createdAt: Date.now() }
    } else {
      chosen = books.find((b) => b.id === choice)
    }
    if (!chosen) return
    setSource(chosen)
    setWpp((await getSetting<number>(`wpp:${chosen.id}`)) ?? null)
    setLang((await getSetting<Lang>(`lang:${chosen.id}`)) ?? 'es')
    setStep('start')
  }

  async function confirmWpp() {
    if (!estimate || !source) return
    await setSetting(`wpp:${source.id}`, estimate)
    setWpp(estimate)
    setStep('ready')
  }

  function finishReading() {
    setOutcome(session.finish())
    setEndPage('')
    setStep('finish')
  }

  async function saveQuickNote() {
    if (!source || !noteText.trim()) return
    await addNote({
      sourceId: source.id!,
      page: toInt(notePage) > 0 ? toInt(notePage) : undefined,
      kind: 'idea',
      text: noteText.trim(),
      lang,
    })
    setNoteText('')
    setNoteOpen(false)
  }

  async function saveReading(confirmed = false) {
    if (!outcome || !source || !wpp) return
    const from = toInt(startPage)
    const to = toInt(endPage)
    let words: number
    try {
      if (!(to > 0)) throw new RangeError()
      words = physicalWords(from, to, wpp)
    } catch {
      setError('physical.endBeforeStart')
      return
    }
    setError(null)
    const pages = to - from + 1
    const speed = computeWpm(words, outcome.activeMs)
    // Más de 100 páginas o más de 1000 ppm: probablemente un error al escribir la página.
    if (!confirmed && (pages > 100 || (speed !== null && speed > 1000))) {
      setImplausible({ pages, wpm: speed ?? 0 })
      return
    }
    setImplausible(null)
    const data = computeResults({ ...outcome, words })
    setResults(data)
    setStep('results')
    try {
      await saveSession({
        session: {
          kind: 'fisico',
          title: source.title,
          sourceId: source.id,
          lang,
          pages: { from, to },
          purpose: purpose.trim() || undefined,
          recall: recall.trim() || undefined,
          startedAt: outcome.startedAt,
          endedAt: outcome.endedAt,
          activeMs: outcome.activeMs,
          words,
          wpm: computeWpm(words, outcome.activeMs),
        },
        probes: outcome.probes,
      })
    } catch {
      setSaveError(true)
    }
  }

  return (
    <section className="mx-auto max-w-prose space-y-5">
      <LeaveGuard active={step === 'reading' || step === 'finish'} />
      <h1 className="text-3xl font-bold">{t('physical.title')}</h1>

      {step === 'book' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            confirmBook()
          }}
        >
          <p>{t('physical.intro')}</p>
          <fieldset className="space-y-1">
            <legend className="mb-1 font-medium">{t('physical.chooseBook')}</legend>
            {books.map((b) => (
              <label key={b.id} className="flex items-center gap-2">
                <input type="radio" name="book" checked={choice === b.id} onChange={() => setChoice(b.id!)} />
                {b.title}
              </label>
            ))}
            <label className="flex items-center gap-2">
              <input type="radio" name="book" checked={choice === 'new'} onChange={() => setChoice('new')} />
              {t('physical.newBook')}
            </label>
          </fieldset>
          {choice === 'new' && (
            <div className="space-y-3">
              <Field label={t('physical.bookTitle')}>
                <input value={book.title} onChange={(e) => setBook({ ...book, title: e.target.value })} className={field} />
              </Field>
              <Field label={t('physical.bookAuthor')}>
                <input value={book.author} onChange={(e) => setBook({ ...book, author: e.target.value })} className={field} />
              </Field>
              <Field label={t('physical.bookYear')}>
                <input value={book.year} onChange={(e) => setBook({ ...book, year: e.target.value })} className={field} />
              </Field>
              <Field label={t('physical.bookPublisher')}>
                <input value={book.publisher} onChange={(e) => setBook({ ...book, publisher: e.target.value })} className={field} />
              </Field>
            </div>
          )}
          <button type="submit" className={primary} disabled={choice === null || (choice === 'new' && !book.title.trim())}>
            {t('diag.continue')}
          </button>
        </form>
      )}

      {step === 'start' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (source) setSetting(`lang:${source.id}`, lang).catch(() => {})
            setStep(wpp ? 'ready' : 'wpp')
          }}
        >
          <p className="text-xl font-medium">«{source?.title}»</p>
          <Field label={t('physical.startPage')}>
            <input inputMode="numeric" value={startPage} onChange={(e) => setStartPage(e.target.value)} className={field} />
          </Field>
          <Field label={t('physical.bookLang')}>
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="rounded border border-line-strong bg-surface p-2">
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {t(`lang.${l}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('diag.purposeLabel')}>
            <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} className={field} />
          </Field>
          <p className="text-sm text-muted">{t('diag.purposeHelp')}</p>
          <button type="submit" className={primary} disabled={!(toInt(startPage) > 0)}>
            {t('diag.continue')}
          </button>
        </form>
      )}

      {step === 'wpp' && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            confirmWpp()
          }}
        >
          <h2 className="text-xl font-semibold">{t('physical.wppTitle')}</h2>
          <p>{t('physical.wppHelp')}</p>
          {lines.map((value, i) => (
            <Field key={i} label={t('physical.wordsInLine', { n: i + 1 })}>
              <input
                inputMode="numeric"
                value={value}
                onChange={(e) => setLines(lines.map((l, j) => (j === i ? e.target.value : l)))}
                className={field}
              />
            </Field>
          ))}
          <Field label={t('physical.linesPerPage')}>
            <input inputMode="numeric" value={linesPerPage} onChange={(e) => setLinesPerPage(e.target.value)} className={field} />
          </Field>
          {estimate && <p className="font-medium">{t('physical.wppResult', { wpp: estimate })}</p>}
          <button type="submit" className={primary} disabled={!estimate}>
            {t('diag.continue')}
          </button>
        </form>
      )}

      {step === 'ready' && (
        <div className="space-y-4">
          <p>{t('physical.ready')}</p>
          {wpp && <p className="text-sm text-muted">{t('physical.wppResult', { wpp })}</p>}
          <button type="button" className="text-accent-ink underline" onClick={() => setStep('wpp')}>
            {t('physical.reestimate')}
          </button>
          <button
            type="button"
            className={primary}
            onClick={() => {
              session.start()
              setElapsed(0)
              setStep('reading')
            }}
          >
            {t('reader.start')}
          </button>
        </div>
      )}

      {step === 'reading' && (
        <div className="space-y-5">
          <div inert={session.probeOpen || undefined} className="space-y-5">
            <p className="text-center">
              <span className="block text-sm text-muted">{t('physical.elapsed')}</span>
              <span className="text-5xl font-semibold tabular-nums" aria-live="off">
                {formatTime(elapsed)}
              </span>
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className={outline} onClick={() => setNoteOpen((o) => !o)}>
                {t('physical.quickNote')}
              </button>
              <button ref={distractedRef} type="button" className="rounded-md border border-warn-strong px-4 py-2 text-warn-ink" onClick={session.markDistracted}>
                {t('reader.distracted')}
              </button>
              <button type="button" className={primary} onClick={finishReading}>
                {t('reader.finish')}
              </button>
            </div>
            {noteOpen && (
              <form
                className="space-y-2 rounded-lg border border-line bg-surface p-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  saveQuickNote()
                }}
              >
                <Field label={t('annot.text')}>
                  <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} className={field} autoFocus />
                </Field>
                <Field label={t('physical.notePage')}>
                  <input inputMode="numeric" value={notePage} onChange={(e) => setNotePage(e.target.value)} className={field} />
                </Field>
                <button type="submit" className={primary}>
                  {t('annot.save')}
                </button>
              </form>
            )}
          </div>
          {session.probeOpen && <ProbeDialog onAnswer={session.answerProbe} />}
        </div>
      )}

      {step === 'finish' && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveReading()
          }}
        >
          <Field label={t('physical.endPage')}>
            <input inputMode="numeric" value={endPage} onChange={(e) => setEndPage(e.target.value)} className={field} />
          </Field>
          <Field label={t('physical.recall')}>
            <textarea value={recall} onChange={(e) => setRecall(e.target.value)} rows={4} className={field} />
          </Field>
          {error && (
            <p role="alert" className="rounded border border-err-line bg-err-bg p-3 text-err-ink">
              {t('physical.endBeforeStart')}
            </p>
          )}
          {implausible && (
            <div role="alert" className="space-y-2 rounded border border-warn-line bg-warn-bg p-3 text-warn-ink">
              <p>{t('physical.implausible', implausible)}</p>
              <div className="flex gap-2">
                <button type="button" className="rounded border border-warn-strong px-3 py-1" onClick={() => setImplausible(null)}>
                  {t('physical.review')}
                </button>
                <button type="button" className="rounded border border-warn-strong px-3 py-1" onClick={() => saveReading(true)}>
                  {t('physical.saveAnyway')}
                </button>
              </div>
            </div>
          )}
          <button type="submit" className={primary}>
            {t('physical.save')}
          </button>
        </form>
      )}

      {step === 'results' && results && (
        <div className="space-y-4">
          <ResultsCard data={results} saveError={saveError} purpose={purpose.trim() || undefined} />
          <button
            type="button"
            className={outline}
            onClick={() => {
              setStartPage(endPage ? String(toInt(endPage) + 1) : '')
              setEndPage('')
              setRecall('')
              setPurpose('')
              setStep('start')
            }}
          >
            {t('physical.another')}
          </button>
        </div>
      )}
    </section>
  )
}
