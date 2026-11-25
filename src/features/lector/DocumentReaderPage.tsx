import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { t } from '../../i18n'
import { computeWpm } from '../../lib/metrics'
import { PROBE_RANGE_PROGRAMA } from '../../lib/probes'
import type { Note, NoteKind, Source, StoredDocument, TextAnchor } from '../../lib/storage/db'
import { addGlossaryEntry } from '../../lib/storage/glossary'
import { addCard } from '../../lib/storage/cards'
import { getDocument, savePosition } from '../../lib/storage/library'
import { addNote, deleteNote, listNotes, updateNoteText } from '../../lib/storage/notes'
import { saveSession } from '../../lib/storage/repo'
import type { Clock } from '../../lib/stopwatch'
import { countWords } from '../../lib/text'
import { ResultsCard, type ResultsData } from '../diagnostico/ResultsCard'
import { computeResults } from '../diagnostico/results'
import { rangeToAnchor, segmentsWithMarks, sentenceAround } from './anchors'
import { AnnotationBar } from './AnnotationBar'
import { LeaveGuard } from './LeaveGuard'
import { NotesPanel } from './NotesPanel'
import { PacedParagraph, PacerControls, PacerNote } from './Pacer'
import { PdfPageDialog } from './PdfPageDialog'
import { ProbeDialog } from './ProbeDialog'
import { FONT_SIZES, useFocusAfterProbe } from './readerUtils'
import { ReadingToolbar } from './ReadingToolbar'
import { usePacer } from './usePacer'
import { useReadingSession, type SessionOutcome } from './useReadingSession'

type Phase = 'free' | 'confirm' | 'results'

const NO_PARAGRAPHS: string[] = []

/** Sin diseño calculado (elementos ocultos o entorno sin layout) no se puede medir la posición. */
function hasLayout(els: (HTMLElement | null)[]): boolean {
  const first = els.find(Boolean)
  return !!first && first.getBoundingClientRect().height > 0
}

const outline = 'rounded border border-line-strong px-3 py-1 hover:bg-hover disabled:opacity-50'
const primary = 'rounded-md bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover'

export function DocumentReaderPage({ now }: { now?: Clock }) {
  const docId = Number(useParams().id)
  const [data, setData] = useState<{ doc: StoredDocument; source: Source } | null | undefined>(undefined)
  const [chapter, setChapter] = useState(0)
  const [notes, setNotes] = useState<Note[]>([])
  const [fontIndex, setFontIndex] = useState(1)
  const [selection, setSelection] = useState<{ anchor: TextAnchor; quote: string } | null>(null)
  const [crossWarning, setCrossWarning] = useState(false)
  const [phase, setPhase] = useState<Phase>('free')
  const [startParagraph, setStartParagraph] = useState(0)
  const [endParagraph, setEndParagraph] = useState(0)
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null)
  const [results, setResults] = useState<ResultsData | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [pdfPage, setPdfPage] = useState<number | null>(null)

  const session = useReadingSession({ probeRange: PROBE_RANGE_PROGRAMA, now })
  const distractedRef = useRef<HTMLButtonElement>(null)
  useFocusAfterProbe(session.probeOpen, distractedRef)

  const articleRef = useRef<HTMLElement>(null)
  const paragraphRefs = useRef<(HTMLElement | null)[]>([])
  const pendingScroll = useRef<number | null>(null)
  const visible = useRef(0)
  const lastSeen = useRef(0)
  const chapterRef = useRef(0)
  const loaded = useRef(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const sessionReading = useRef(false)
  useEffect(() => {
    sessionReading.current = session.status === 'reading'
  }, [session.status])
  useEffect(() => {
    chapterRef.current = chapter
  }, [chapter])

  const [pacerOn, setPacerOn] = useState(false)
  const [pacerWpm, setPacerWpm] = useState(250)
  const pacer = usePacer({
    enabled: pacerOn && session.status === 'reading',
    wpm: pacerWpm,
    paragraphs: data ? data.doc.chapters[chapter].paragraphs : NO_PARAGRAPHS,
    startParagraph,
    elapsedMs: session.elapsedMs,
  })
  useEffect(() => {
    if (pacer) paragraphRefs.current[pacer.paragraph]?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  }, [pacer?.paragraph]) // eslint-disable-line react-hooks/exhaustive-deps -- solo al cambiar de párrafo

  /** Alto ocupado arriba por la cabecera y la barra fijas. */
  const topOffset = useCallback(() => {
    const header = document.querySelector('header')?.offsetHeight ?? 0
    const bar = toolbarRef.current?.offsetHeight ?? 0
    return header + bar
  }, [])

  const reloadNotes = useCallback(() => listNotes({ documentId: docId }).then(setNotes), [docId])

  useEffect(() => {
    getDocument(docId)
      .then((found) => {
        setData(found ?? null)
        if (found) {
          loaded.current = true
          setChapter(found.doc.position.chapter)
          visible.current = found.doc.position.paragraph
          pendingScroll.current = found.doc.position.paragraph
        }
      })
      .catch(() => setData(null))
    reloadNotes().catch(() => setNotes([]))
    return () => {
      if (loaded.current) savePosition(docId, { chapter: chapterRef.current, paragraph: visible.current }).catch(() => {})
      loaded.current = false
    }
  }, [docId, reloadNotes])

  useEffect(() => {
    const target = pendingScroll.current
    if (target === null) return
    const el = paragraphRefs.current[target]
    if (el) {
      el.style.scrollMarginTop = `${topOffset() + 8}px`
      el.scrollIntoView({ block: 'start' })
      pendingScroll.current = null
    }
  }, [data, chapter, topOffset])

  /** Primer párrafo cuyo centro queda por debajo de la barra fija (búsqueda binaria). */
  const computeVisible = useCallback((): number => {
    const els = paragraphRefs.current
    if (!hasLayout(els)) return visible.current
    const offset = topOffset()
    let lo = 0
    let hi = els.length - 1
    let found = els.length - 1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const r = els[mid]?.getBoundingClientRect()
      if (r && (r.top + r.bottom) / 2 > offset) {
        found = mid
        hi = mid - 1
      } else lo = mid + 1
    }
    return Math.max(0, found)
  }, [topOffset])

  /** Último párrafo visible por completo (para proponer hasta dónde se leyó). */
  const computeLastSeen = useCallback((): number => {
    const els = paragraphRefs.current
    if (!hasLayout(els)) return visible.current
    let lo = 0
    let hi = els.length - 1
    let found = 0
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const r = els[mid]?.getBoundingClientRect()
      if (r && r.bottom <= window.innerHeight) {
        found = mid
        lo = mid + 1
      } else hi = mid - 1
    }
    return found
  }, [])

  const persistPosition = useCallback(() => {
    if (!loaded.current) return
    savePosition(docId, { chapter: chapterRef.current, paragraph: visible.current }).catch(() => {})
  }, [docId])

  useEffect(() => {
    if (!data) return
    let frame = 0
    let saveTimer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        visible.current = computeVisible()
        if (sessionReading.current) lastSeen.current = Math.max(lastSeen.current, computeLastSeen())
      })
      clearTimeout(saveTimer)
      saveTimer = setTimeout(persistPosition, 1500)
    }
    const onHide = () => {
      if (document.visibilityState !== 'hidden') return
      visible.current = computeVisible()
      persistPosition()
    }
    const onPageHide = () => {
      visible.current = computeVisible()
      persistPosition()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(saveTimer)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [data, chapter, computeVisible, computeLastSeen, persistPosition])

  const captureSelection = useCallback(() => {
    if (!data) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    if (sel.isCollapsed) {
      // Un clic en el texto sin seleccionar cierra la barra y el aviso (no si se escribe en la barra).
      if (sel.anchorNode && articleRef.current?.contains(sel.anchorNode)) {
        setSelection(null)
        setCrossWarning(false)
      }
      return
    }
    const range = sel.getRangeAt(0)
    if (!articleRef.current?.contains(range.commonAncestorContainer)) return
    const anchor = rangeToAnchor(range, chapter)
    if (anchor === 'cross-paragraph') {
      setCrossWarning(true)
      setSelection(null)
      return
    }
    if (!anchor) return
    setCrossWarning(false)
    const text = data.doc.chapters[chapter].paragraphs[anchor.paragraph]
    setSelection({ anchor, quote: text.slice(anchor.start, anchor.end) })
  }, [chapter, data])

  useEffect(() => {
    document.addEventListener('selectionchange', captureSelection)
    return () => document.removeEventListener('selectionchange', captureSelection)
  }, [captureSelection])

  if (data === undefined) return null
  if (data === null) return <p className="mx-auto max-w-prose">{t('docreader.notFound')}</p>

  const { doc, source } = data
  const current = doc.chapters[chapter]
  const reading = session.status === 'reading'
  const pageOf = (paragraph: number) => current.pages?.[paragraph]

  function goToChapter(c: number) {
    if (c < 0 || c >= doc.chapters.length) return
    setChapter(c)
    visible.current = 0
    pendingScroll.current = 0
    setSelection(null)
    savePosition(docId, { chapter: c, paragraph: 0 }).catch(() => {})
  }

  function start() {
    visible.current = computeVisible()
    setStartParagraph(visible.current)
    lastSeen.current = Math.max(visible.current, computeLastSeen())
    setPhase('free')
    session.start()
  }

  function finish() {
    const o = session.finish()
    setOutcome(o)
    setEndParagraph(Math.min(current.paragraphs.length - 1, Math.max(lastSeen.current, startParagraph)))
    setPhase('confirm')
  }

  async function confirmEnd() {
    if (!outcome) return
    const words = current.paragraphs
      .slice(startParagraph, endParagraph + 1)
      .reduce((sum, p) => sum + countWords(p, doc.lang), 0)
    const data = computeResults({ ...outcome, words })
    setResults(data)
    setPhase('results')
    try {
      await saveSession({
        session: {
          kind: 'documento',
          title: doc.title,
          documentId: docId,
          sourceId: doc.sourceId,
          lang: doc.lang,
          startedAt: outcome.startedAt,
          endedAt: outcome.endedAt,
          activeMs: outcome.activeMs,
          words,
          wpm: computeWpm(words, outcome.activeMs),
        },
        probes: outcome.probes,
      })
      await savePosition(docId, { chapter, paragraph: endParagraph })
      visible.current = endParagraph
    } catch {
      setSaveError(true)
    }
  }

  async function annotate(kind: NoteKind, text: string) {
    if (!selection) return
    await addNote({
      sourceId: doc.sourceId,
      documentId: docId,
      anchor: selection.anchor,
      page: pageOf(selection.anchor.paragraph),
      kind,
      quote: selection.quote,
      text,
      lang: doc.lang,
    })
    window.getSelection()?.removeAllRanges()
    setSelection(null)
    await reloadNotes()
  }

  async function addToGlossary(entry: { term: string; definition: string; translation?: string }) {
    if (!selection) return
    await addGlossaryEntry({
      ...entry,
      lang: doc.lang,
      sourceId: doc.sourceId,
      context: sentenceAround(current.paragraphs[selection.anchor.paragraph], selection.anchor.start),
    })
    window.getSelection()?.removeAllRanges()
    setSelection(null)
  }

  function goToNote(note: Note) {
    if (!note.anchor) return
    if (note.anchor.chapter !== chapter) {
      // Durante una sesión cronometrada no se cambia de capítulo (la medición es de un capítulo).
      if (reading || phase === 'confirm') return
      setChapter(note.anchor.chapter)
      pendingScroll.current = note.anchor.paragraph
    } else {
      const el = paragraphRefs.current[note.anchor.paragraph]
      if (el) {
        el.style.scrollMarginTop = `${topOffset() + 8}px`
        el.scrollIntoView({ block: 'start' })
      }
    }
  }

  const changeFont = (d: -1 | 1) => setFontIndex((i) => Math.min(FONT_SIZES.length - 1, Math.max(0, i + d)))
  const pdfButton =
    doc.format === 'pdf' && doc.file && current.pages ? (
      <button type="button" className={outline} onClick={() => setPdfPage(pageOf(visible.current) ?? current.pages![0])}>
        {t('docreader.viewPage')}
      </button>
    ) : null

  return (
    <section className="mx-auto max-w-prose space-y-4 pb-40">
      <LeaveGuard active={reading || phase === 'confirm'} />
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{doc.title}</h1>
        {source.author && <p className="text-muted">{source.author}</p>}
        {doc.chapters.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={outline} disabled={reading || chapter === 0} onClick={() => goToChapter(chapter - 1)}>
              {t('docreader.prevChapter')}
            </button>
            <select
              aria-label={t('docreader.chapter')}
              value={chapter}
              disabled={reading || phase === 'confirm'}
              onChange={(e) => goToChapter(Number(e.target.value))}
              className="max-w-[14rem] rounded border border-line-strong bg-surface p-1"
            >
              {doc.chapters.map((c, i) => (
                <option key={i} value={i}>
                  {c.title || `${t('docreader.chapter')} ${i + 1}`}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={outline}
              disabled={reading || chapter === doc.chapters.length - 1}
              onClick={() => goToChapter(chapter + 1)}
            >
              {t('docreader.nextChapter')}
            </button>
          </div>
        )}
      </header>

      {phase === 'confirm' && (
        <section aria-labelledby="end-title" className="space-y-3 rounded-lg border border-accent bg-accent-soft p-4">
          <h2 id="end-title" className="text-lg font-semibold">
            {t('docreader.endTitle')}
          </h2>
          <p>{t('docreader.endHelp')}</p>
          <blockquote className="italic">«{current.paragraphs[endParagraph].slice(0, 160)}…»</blockquote>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={outline} disabled={endParagraph <= startParagraph} onClick={() => setEndParagraph((p) => p - 1)}>
              {t('docreader.prevParagraph')}
            </button>
            <button
              type="button"
              className={outline}
              disabled={endParagraph >= current.paragraphs.length - 1}
              onClick={() => setEndParagraph((p) => p + 1)}
            >
              {t('docreader.nextParagraph')}
            </button>
            <button type="button" className={primary} onClick={confirmEnd}>
              {t('docreader.confirmEnd')}
            </button>
          </div>
        </section>
      )}

      {phase === 'results' && results && (
        <div className="space-y-3">
          <ResultsCard data={results} saveError={saveError} />
          <button type="button" className={primary} onClick={() => setPhase('free')}>
            {t('docreader.continueReading')}
          </button>
        </div>
      )}

      {!reading && phase === 'free' && <p className="text-sm text-muted">{t('docreader.startHelp')}</p>}
      <div inert={session.probeOpen || pdfPage !== null || undefined}>
        <div ref={toolbarRef} className="sticky top-[var(--header-h,0px)] z-[1] bg-page">
        {reading ? (
          <>
            <ReadingToolbar
              sticky={false}
              ref={distractedRef}
              onFont={changeFont}
              onDistracted={session.markDistracted}
              onFinish={finish}
              extra={
                <>
                  <PacerControls enabled={pacerOn} wpm={pacerWpm} onEnabled={setPacerOn} onWpm={setPacerWpm} />
                  {pdfButton}
                </>
              }
            />
            {pacerOn && <PacerNote />}
          </>
        ) : (
          phase === 'free' && (
            <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-line py-2 text-sm sm:text-base">
              <button type="button" onClick={() => changeFont(-1)} aria-label={t('reader.fontSmaller')} className={outline}>
                A−
              </button>
              <button type="button" onClick={() => changeFont(1)} aria-label={t('reader.fontLarger')} className={outline}>
                A+
              </button>
              {pdfButton}
              <span className="flex-1" />
              <button type="button" className={primary} onClick={start}>
                {t('docreader.start')}
              </button>
            </div>
          )
        )}
        </div>

        <article
          ref={articleRef}
          lang={doc.lang}
          style={{ fontSize: FONT_SIZES[fontIndex] }}
          className="space-y-4 leading-relaxed"
          onMouseUp={captureSelection}
          onKeyUp={captureSelection}
          onTouchEnd={captureSelection}
        >
          {current.title && <h2 className="text-[1.3em] font-semibold">{current.title}</h2>}
          {current.paragraphs.map((text, i) => {
            const marks = notes
              .filter((n) => n.anchor && n.anchor.chapter === chapter && n.anchor.paragraph === i)
              .map((n) => ({ start: n.anchor!.start, end: n.anchor!.end, id: n.id! }))
            return (
              <p
                key={i}
                data-paragraph={i}

                ref={(el) => {
                  paragraphRefs.current[i] = el
                }}
              >
                {pacer?.paragraph === i ? (
                  <PacedParagraph text={text} word={pacer.word} />
                ) : (
                  segmentsWithMarks(text, marks).map((seg, j) =>
                  seg.markId === undefined ? seg.text : (
                    <mark key={j} className="rounded-sm bg-mark text-ink">
                      {seg.text}
                    </mark>
                  ),
                  )
                )}
              </p>
            )
          })}
        </article>
        <NotesPanel
          notes={notes}
          onGoTo={goToNote}
          canGoTo={(note) => !(reading || phase === 'confirm') || note.anchor?.chapter === chapter}
          onUpdate={(id, text) => updateNoteText(id, text).then(reloadNotes)}
          onDelete={(id) => deleteNote(id).then(reloadNotes)}
          onCard={(note, front, back) => addCard({ kind: 'ficha', front, back, lang: note.lang, sourceId: note.sourceId })}
        />
      </div>



      {crossWarning && (
        <p role="status" className="fixed inset-x-0 bottom-0 z-20 border-t border-warn-line bg-warn-bg p-3 text-center text-warn-ink">
          {t('annot.crossParagraph')}
        </p>
      )}
      {selection && !session.probeOpen && (
        <AnnotationBar
          key={`${selection.anchor.paragraph}-${selection.anchor.start}-${selection.anchor.end}`}
          quote={selection.quote}
          onHighlight={() => annotate('subrayado', '')}
          onNote={(kind, text) => annotate(kind, text)}
          onGlossary={addToGlossary}
          onCard={async (front, back) => {
            await addCard({ kind: 'ficha', front, back, lang: doc.lang, sourceId: doc.sourceId })
            window.getSelection()?.removeAllRanges()
            setSelection(null)
          }}
          onCancel={() => {
            window.getSelection()?.removeAllRanges()
            setSelection(null)
          }}
        />
      )}
      {session.probeOpen && <ProbeDialog onAnswer={session.answerProbe} />}
      {pdfPage !== null && doc.file && <PdfPageDialog file={doc.file} page={pdfPage} onClose={() => setPdfPage(null)} />}
    </section>
  )
}
