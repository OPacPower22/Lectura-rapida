# Fase 2 — Formatos y lectura activa: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leer y anotar dentro de la app PDF, EPUB, artículos web y texto pegado; medir sesiones de libro físico; subrayar, tomar notas con su fuente y página, capturar vocabulario; marcapasos opcional. Además, cerrar los pendientes del lector que dejó la fase 1.

**Architecture:** Los importadores (`src/lib/formats/`) convierten cada formato en un `ImportedDocument` común (capítulos → párrafos, con número de página en PDF). Los documentos, fuentes, notas y glosario se guardan en Dexie (esquema v2 con migración). El lector de documentos reutiliza la lógica de sesión de `ReadingView` extraída a un hook. Las anotaciones se anclan por `(capítulo, párrafo, inicio, fin)` sobre el texto extraído, que no cambia una vez guardado.

**Tech Stack:** el de la fase 1 + `pdfjs-dist` (6.x, carga diferida), `jszip`, `@mozilla/readability`; `pdf-lib` solo en desarrollo (fixtures).

**Spec:** `docs/superpowers/specs/2026-11-25-lectura-rapida-design.md` — secciones 7.3, 7.4, 7.6 (glosario), 7.7 (notas con fuente), 8, 8 bis, 8 ter, 12.

## Global Constraints

- Todo lo de la fase 1 sigue vigente (textos vía `t()`, `lang` en todo registro, `countWords()` para contar, sin metas de ppm, ILE solo con comprensión objetiva, colores solo semánticos: `bg-page`, `bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-accent`, etc.).
- Los documentos del usuario **nunca salen del dispositivo**; nada se envía a la red.
- Selección para anotar: **dentro de un solo párrafo** en v1 (si cruza párrafos, la app lo indica).
- PDF sin capa de texto → error `no-text` y oferta de usar el **modo libro físico**.
- EPUB con DRM (`META-INF/encryption.xml` con contenido cifrado) → error `drm` con explicación.
- Tamaño máximo de archivo importado: **200 MB** → error `too-large`.
- La velocidad de un documento se calcula con las palabras entre el párrafo inicial y el último párrafo leído (confirmado por el usuario al terminar).
- Libro físico: páginas leídas = página final − página inicial + 1; palabras por página = promedio de palabras en 3 líneas × líneas por página.
- Sondeos en libro físico: **sonido suave** por defecto, vibración solo si el navegador la soporta.
- `pdfjs-dist` se carga solo al importar un PDF (import dinámico); su worker se incluye en el precache para importar sin conexión.
- Commit **y push** al cerrar cada tarea.

## Review Focus

1. **PDF de varias columnas, con encabezados/pies repetidos o guiones de fin de línea** → párrafos legibles, sin palabras cortadas, con el número de página correcto en cada párrafo (tests en Tarea 5).
2. **Archivo dañado, con DRM, vacío o enorme** → mensaje claro, sin bloquear la app ni guardar un documento vacío (tests en Tareas 4, 5 y 6).
3. **El usuario sale de la lectura (otra sección, cerrar pestaña, recargar)** → aviso antes de perder la sesión; la posición en el documento se conserva (tests en Tareas 2 y 7).
4. **Selección de texto sobre un subrayado existente o que cruza párrafos** → anclas correctas o aviso, nunca un subrayado desplazado (tests en Tarea 7).
5. **Base de datos de la fase 1 con datos** → la migración a v2 conserva todas las sesiones, sondeos y cuestionarios (test en Tarea 1).

---

### Task 1: Esquema v2 de almacenamiento (fuentes, documentos, notas, glosario)

**Files:**
- Modify: `src/lib/storage/db.ts`
- Create: `src/lib/storage/library.ts`, `library.test.ts`, `src/lib/storage/notes.ts`, `notes.test.ts`, `src/lib/storage/glossary.ts`, `glossary.test.ts`, `src/lib/storage/migration.test.ts`

**Interfaces:**
- Produces (en `db.ts`):
  - `ReadingSession.kind: 'diagnostico' | 'libre' | 'documento' | 'fisico'` y campos opcionales nuevos `title?: string; purpose?: string; recall?: string; documentId?: number; sourceId?: number; pages?: { from: number; to: number }`
  - `type SourceType = 'libro' | 'articulo' | 'web' | 'documento'`
  - `interface Source { id?: number; type: SourceType; title: string; author?: string; year?: string; publisher?: string; url?: string; createdAt: number }`
  - `type DocumentFormat = 'pdf' | 'epub' | 'web' | 'texto'`
  - `interface Chapter { title: string; paragraphs: string[]; pages?: number[] }` (`pages[i]` = página del párrafo `i`, solo PDF)
  - `interface DocPosition { chapter: number; paragraph: number }`
  - `interface StoredDocument { id?: number; sourceId: number; format: DocumentFormat; lang: string; title: string; chapters: Chapter[]; words: number; file?: Blob; position: DocPosition; createdAt: number; lastOpenedAt: number }`
  - `interface TextAnchor { chapter: number; paragraph: number; start: number; end: number }`
  - `type NoteKind = 'subrayado' | 'cita' | 'parafrasis' | 'idea'`
  - `interface Note { id?: number; sourceId: number; documentId?: number; anchor?: TextAnchor; page?: number; kind: NoteKind; quote?: string; text: string; lang: string; createdAt: number }`
  - `interface GlossaryEntry { id?: number; term: string; lang: string; definition: string; translation?: string; context?: string; sourceId?: number; createdAt: number }`
  - Dexie **versión 2**: `readingSessions: '++id, kind, textId, lang, startedAt, documentId, sourceId'`, `sources: '++id, type, createdAt'`, `documents: '++id, sourceId, lastOpenedAt'`, `notes: '++id, sourceId, documentId, kind, createdAt'`, `glossary: '++id, lang, term, sourceId'` (las tablas de v1 se conservan).
- Produces (repos):
  - `library.ts`: `addDocument(input: { source: Omit<Source,'id'|'createdAt'>; doc: Omit<StoredDocument,'id'|'sourceId'|'createdAt'|'lastOpenedAt'|'position'> }): Promise<number>`; `addSource(s: Omit<Source,'id'|'createdAt'>): Promise<number>`; `listDocuments(): Promise<{ doc: StoredDocument; source: Source }[]>` (más reciente `lastOpenedAt` primero); `getDocument(id: number): Promise<{ doc: StoredDocument; source: Source } | undefined>`; `savePosition(id: number, position: DocPosition): Promise<void>` (actualiza también `lastOpenedAt`); `deleteDocument(id: number): Promise<void>` (borra documento, sus notas y su fuente; las sesiones quedan en el historial).
  - `notes.ts`: `addNote(n: Omit<Note,'id'|'createdAt'>): Promise<number>`; `listNotes(filter: { documentId: number } | { sourceId: number }): Promise<Note[]>` (orden de lectura: por capítulo, párrafo, inicio; o por página; luego `createdAt`); `updateNoteText(id: number, text: string): Promise<void>`; `deleteNote(id: number): Promise<void>`.
  - `glossary.ts`: `addGlossaryEntry(e: Omit<GlossaryEntry,'id'|'createdAt'>): Promise<number>`; `listGlossary(lang?: string): Promise<GlossaryEntry[]>` (alfabético con `localeCompare(…, lang)`); `updateGlossaryEntry(id: number, patch: Partial<Pick<GlossaryEntry,'definition'|'translation'|'context'>>): Promise<void>`; `deleteGlossaryEntry(id: number): Promise<void>`.

- [ ] **Step 1: Tests que fallan**

```ts
// migration.test.ts: crear una Dexie 'lectura-rapida' versión 1 con el esquema de la fase 1,
// insertar 1 sesión + 2 sondeos + 1 cuestionario, cerrarla, abrir `db` (v2):
expect(await db.readingSessions.count()).toBe(1)
expect(await db.probes.count()).toBe(2)
expect(await db.quizResults.count()).toBe(1)
expect(db.verno).toBe(2)

// library.test.ts
const id = await addDocument({ source: { type: 'documento', title: 'T' }, doc: { format: 'texto', lang: 'es', title: 'T', chapters: [{ title: '', paragraphs: ['a b'] }], words: 2 } })
expect((await getDocument(id))?.doc.position).toEqual({ chapter: 0, paragraph: 0 })
await savePosition(id, { chapter: 0, paragraph: 3 }) // y lastOpenedAt aumenta
// listDocuments: el abierto más recientemente va primero
// deleteDocument: elimina documento, sus notas y su fuente; la sesión con ese documentId sigue existiendo

// notes.test.ts: listNotes({documentId}) devuelve en orden (cap 0 párr 2) antes que (cap 1 párr 0); notas por página ordenadas por page
// glossary.test.ts: listGlossary('es') ordena 'ábaco' antes que 'zeta'; updateGlossaryEntry cambia definition
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL.
- [ ] **Step 3: Implementar** `db.version(2).stores({...})` sin `upgrade()` (los campos nuevos son opcionales) y los tres repos. `addDocument` en una transacción; `position` inicial `{0,0}`.
- [ ] **Step 4: Ejecutar** `npm test` → PASS.
- [ ] **Step 5: Commit y push** — `feat: esquema v2 con fuentes, documentos, notas y glosario`

---

### Task 2: Sesión de lectura reutilizable y pendientes del lector

**Files:**
- Create: `src/features/lector/useReadingSession.ts`, `useReadingSession.test.tsx`, `src/features/lector/ReadingToolbar.tsx`
- Modify: `ReadingView.tsx`, `ReadingView.test.tsx`, `ProbeDialog.tsx`, `src/lib/probes.ts` (+ test), `DiagnosticPage.tsx` (+ test), `ResultsCard.tsx` (+ test), `PasteReadPage.tsx` (+ test), `HistoryPage.tsx` (+ test), `HomePage.tsx` (+ test), `src/i18n/es.ts`

**Interfaces:**
- Consumes: T1 (`ReadingSession` con `purpose`, `title`).
- Produces:
  - `useReadingSession(opts: { probeRange: ProbeRange; now?: Clock; rng?: () => number }): { status: 'idle' | 'reading' | 'done'; probeOpen: boolean; start(): void; finish(): { startedAt: number; endedAt: number; activeMs: number; probes: { at: number; answer: ProbeAnswer }[] }; markDistracted(): void; answerProbe(a: Exclude<ProbeAnswer,'auto'>): void; pause(): void; resume(): void }`. Incluye la pausa por visibilidad.
  - **El sondeo reanuda el tiempo restante** al volver a la pestaña, no reinicia la cuenta: `createProbeTimer(range, rng, schedule?)` en `probes.ts` con `{ start(): void; pause(): void; resume(): void; cancel(): void }`, que guarda los ms restantes.
  - `ReadingToolbar(props: { fontIndex: number; onFont: (delta: -1 | 1) => void; onDistracted(): void; onFinish(): void; extra?: ReactNode })`. Los botones de letra tienen nombre accesible que contiene el texto visible: `aria-label="A− (reducir letra)"` y `"A+ (aumentar letra)"`.
  - `ProbeDialog`: mientras está abierto, el contenido de fondo lleva el atributo `inert`; Escape no lo cierra (exige respuesta); al cerrarse, el foco vuelve al botón «Me distraje».
  - `ReadingView` conserva su API pública y pasa a usar el hook.
  - `DiagnosticPage`: guarda `purpose` en la sesión y lo muestra en los resultados como «Tu pregunta: …» con la invitación a responderla de memoria.
  - `ResultsCard` acepta la prop `purpose?: string`.
  - `PasteReadPage`: guarda `title`; `countWords` se calcula con `useMemo`.
  - `HistoryPage`: si falla la lectura del almacenamiento, muestra `t('history.loadError')`, no el historial vacío. Muestra `title` cuando existe.
  - `HomePage`: el aviso de almacenamiento no persistente se puede cerrar («Entendido») y no vuelve a mostrarse en ese dispositivo (clave `lectura-rapida.persistNoticeDismissed` en `localStorage`, con try/catch).

- [ ] **Step 1: Tests que fallan**

```ts
// probes.test: createProbeTimer con reloj falso; pausar a los 30 s de un intervalo de 45 s y reanudar → dispara 15 s después
// ReadingView.test: ocultar la pestaña a los 30 s y volver → el sondeo aparece 15 s después de volver (no 45 s)
// ReadingView.test: con el diálogo abierto, el contenedor del artículo tiene el atributo inert; Escape no lo cierra; tras responder, document.activeElement es «Me distraje»
// ReadingView.test: getByRole('button', { name: /A−/ }) existe
// DiagnosticPage.test: escribir la pregunta "¿Cuánto mide la Tierra?" → aparece en resultados y queda guardada en session.purpose
// PasteReadPage.test: el título "Mi artículo" queda en session.title
// HistoryPage.test: listSessions rechaza → muestra t('history.loadError')
// HomePage.test: pulsar «Entendido» oculta el aviso; al volver a montar, no aparece
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL (solo los nuevos; los de la fase 1 siguen en verde).
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Ejecutar** `npm test && npm run lint` → PASS.
- [ ] **Step 5: Commit y push** — `refactor: sesión de lectura reutilizable; sondeo reanudable, diálogo accesible y pendientes de la fase 1`

---

### Task 3: Aviso antes de abandonar una lectura en curso

**Files:**
- Modify: `src/app/App.tsx` (pasa a `createHashRouter` + `RouterProvider`, necesario para `useBlocker`), `src/features/lector/useReadingSession.ts`
- Create: `src/features/lector/useLeaveGuard.ts`, `src/app/App.test.tsx`

**Interfaces:**
- Produces: `useLeaveGuard(active: boolean): void`. Mientras `active` es verdadero:
  - una navegación interna muestra un `confirm` nativo con `t('reader.leaveConfirm')`;
  - `beforeunload` pide confirmación al cerrar o recargar.
  
  `ReadingView` y el lector de documentos lo activan con `status === 'reading'`, y también en el cuestionario del diagnóstico.

- [ ] **Step 1: Test que falla** (App con `createMemoryRouter` en el test):

```ts
// iniciar una lectura en /diagnostico y pulsar el enlace «Progreso» con window.confirm → false: sigue en la lectura
// con window.confirm → true: navega a /progreso
// un evento beforeunload durante la lectura tiene defaultPrevented === true
```

- [ ] **Step 2-4:** FAIL → implementar → PASS (`npm test`), y el e2e de la fase 1 sigue en verde (`npm run e2e`).
- [ ] **Step 5: Commit y push** — `feat: aviso antes de abandonar una lectura en curso`

---

### Task 4: Importar texto y artículos web

**Files:**
- Create: `src/lib/formats/types.ts`, `src/lib/formats/text.ts`, `text.test.ts`, `src/lib/formats/web.ts`, `web.test.ts`, `src/lib/formats/share.ts`, `share.test.ts`

**Interfaces:**
- Produces:
  - `interface ImportedDocument { title: string; author?: string; lang?: string; chapters: Chapter[]; source: Omit<Source, 'id' | 'createdAt'> }`
  - `class ImportError extends Error { constructor(public code: 'no-content' | 'no-text' | 'drm' | 'invalid' | 'too-large') }`
  - `MAX_IMPORT_BYTES = 200 * 1024 * 1024`
  - `importPlainText(text: string, opts?: { title?: string; url?: string }): ImportedDocument`: un capítulo con `splitParagraphs`; `no-content` si no hay palabras.
  - `importHtml(html: string, opts?: { url?: string }): ImportedDocument`: `DOMParser` + `Readability`; párrafos desde `p, h1-h6, li, blockquote, pre` del contenido extraído; los encabezados h1-h3 abren capítulo nuevo; `byline` → `author`; `source.type = 'web'`. Lanza `no-content` si queda vacío.
  - `shareTargetToImportHash(location: { pathname: string; search: string }, base: string): string | null`: convierte `/<base>/compartir?title&text&url` en `#/biblioteca/importar?title=…&text=…&url=…`; devuelve `null` en otra ruta.

- [ ] **Step 1: Tests que fallan**

```ts
expect(importPlainText('Uno dos.\n\nTres.').chapters[0].paragraphs).toEqual(['Uno dos.', 'Tres.'])
expect(() => importPlainText('  \n ')).toThrow(ImportError) // code 'no-content'
// importHtml de una página con <nav>, <aside class="ads">, <article><h1>Título</h1><p>…5 párrafos…</p></article>:
//   title 'Título'; ningún párrafo contiene el texto del nav ni del aside; 5 párrafos
// importHtml('<html><body></body></html>') lanza no-content
expect(shareTargetToImportHash({ pathname: '/Lectura-rapida/compartir', search: '?title=A&url=https%3A%2F%2Fx.org' }, '/Lectura-rapida/'))
  .toBe('#/biblioteca/importar?title=A&url=https%3A%2F%2Fx.org')
expect(shareTargetToImportHash({ pathname: '/Lectura-rapida/', search: '' }, '/Lectura-rapida/')).toBeNull()
```

- [ ] **Step 2-4:** FAIL → implementar (instalar `@mozilla/readability`) → PASS.
- [ ] **Step 5: Commit y push** — `feat: importar texto y artículos web`

---

### Task 5: Importar PDF

**Files:**
- Create: `src/lib/formats/pdf.ts`, `src/lib/formats/pdfLayout.ts`, `pdfLayout.test.ts`, `pdf.test.ts`, `scripts/make-fixtures.mjs`, `tests/fixtures/muestra.pdf`, `tests/fixtures/escaneado.pdf`

**Interfaces:**
- Produces:
  - `interface PdfLine { text: string; x: number; y: number; height: number; page: number }`
  - `paragraphsFromLines(lines: PdfLine[]): { text: string; page: number }[]` (función pura):
    - agrupa en párrafos cuando el salto vertical supera 1,5 × la altura de línea, o al cambiar de página tras una línea que termina en punto;
    - une guiones de fin de línea (`compren-` + `sión` → `comprensión`);
    - descarta líneas que se repiten idénticas en la misma posición `y` en más del 50 % de las páginas (encabezados y pies);
    - ordena columnas: dentro de cada página, por `x` de columna (umbral: mitad del ancho) y luego por `y`.
  - `importPdf(data: ArrayBuffer, opts?: { onProgress?: (page: number, total: number) => void; getDocument?: typeof import('pdfjs-dist').getDocument }): Promise<ImportedDocument>`:
    - un capítulo por esquema (outline) si existe, o uno solo;
    - `pages` por párrafo; título desde los metadatos o el nombre del archivo;
    - lanza `no-text` si el promedio es menor de 20 caracteres por página, e `invalid` si el PDF está dañado.
  - El worker se configura con `import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`.
  - Añadir `mjs` a `workbox.globPatterns` y `maximumFileSizeToCacheInBytes: 5 * 1024 * 1024`.

- [ ] **Step 1: Fixtures.** `scripts/make-fixtures.mjs` (con `pdf-lib` como devDependency) genera:
  - `muestra.pdf`: 3 páginas, encabezado repetido «Revista de prueba», una palabra partida con guion entre líneas, y un párrafo que continúa en la página siguiente;
  - `escaneado.pdf`: solo un rectángulo, sin texto.
  
  Script: `npm run fixtures`. Los fixtures se versionan.
- [ ] **Step 2: Tests que fallan**

```ts
// pdfLayout.test (puro): líneas sintéticas →
//   'compren-' + 'sión del texto' → 'comprensión del texto'
//   encabezado repetido en 3/3 páginas desaparece
//   dos columnas (x=50 y x=320) se leen la izquierda completa antes que la derecha
//   salto vertical de 2× la altura → párrafo nuevo; cada párrafo conserva su página
// pdf.test (// @vitest-environment node, getDocument de 'pdfjs-dist/legacy/build/pdf.mjs'):
//   importPdf(muestra.pdf) → sin 'Revista de prueba' en los párrafos; contiene 'comprensión'; pages incluye 1, 2 y 3
//   importPdf(escaneado.pdf) lanza ImportError 'no-text'
//   importPdf(bytes aleatorios) lanza ImportError 'invalid'
```

- [ ] **Step 3-5:** FAIL → implementar (instalar `pdfjs-dist`) → PASS (`npm test && npm run build`; el build debe emitir el worker y precachearlo).
- [ ] **Step 6: Commit y push** — `feat: importar PDF con reconstrucción de párrafos y páginas`

---

### Task 6: Importar EPUB

**Files:**
- Create: `src/lib/formats/epub.ts`, `epub.test.ts`, `tests/fixtures/muestra.epub` (generado por `scripts/make-fixtures.mjs` con `jszip`)

**Interfaces:**
- Produces: `importEpub(data: ArrayBuffer): Promise<ImportedDocument>`. Pasos:
  1. Lee `META-INF/container.xml` → ruta del OPF.
  2. Del OPF: `dc:title`, `dc:creator`, `dc:language` → `lang`, `dc:date` → `year`, manifest y spine.
  3. Recorre la spine en orden; cada XHTML es un capítulo con título igual al primer `h1-h3` (o al del `nav`/`toc.ncx`). Párrafos desde `p, h1-h6, li, blockquote`.
  4. Omite capítulos sin texto.
  
  Errores: `drm` si existe `META-INF/encryption.xml` con `EncryptedData`; `invalid` si falta el contenedor o el OPF; `no-content` si no hay texto. `source.type = 'libro'`.

- [ ] **Step 1: Fixture** `muestra.epub` (EPUB 3): 2 capítulos con `h1`, un `nav`, metadatos `dc:title`, `dc:creator` y `dc:language` (`es`). También `drm.epub`, que incluye `encryption.xml`.
- [ ] **Step 2: Tests que fallan**

```ts
const doc = await importEpub(muestraBytes)
expect(doc.title).toBe('Libro de muestra'); expect(doc.author).toBe('Autora de Prueba'); expect(doc.lang).toBe('es')
expect(doc.chapters.map(c => c.title)).toEqual(['Capítulo uno', 'Capítulo dos'])
await expect(importEpub(drmBytes)).rejects.toMatchObject({ code: 'drm' })
await expect(importEpub(new ArrayBuffer(10))).rejects.toMatchObject({ code: 'invalid' })
```

- [ ] **Step 3-5:** FAIL → implementar (instalar `jszip`) → PASS.
- [ ] **Step 6: Commit y push** — `feat: importar EPUB`

---

### Task 7: Biblioteca y lector de documentos con anotaciones

**Files:**
- Create: `src/features/biblioteca/LibraryPage.tsx` (+ test), `ImportPage.tsx` (+ test), `src/features/lector/DocumentReaderPage.tsx` (+ test), `src/features/lector/anchors.ts` (+ test), `src/features/lector/AnnotationBar.tsx`, `src/features/lector/NotesPanel.tsx`
- Modify: `src/app/App.tsx`, `src/app/Layout.tsx`, `src/main.tsx` (redirección de «Compartir»), `vite.config.ts` (`share_target` en el manifest), `src/i18n/es.ts`

**Interfaces:**
- Consumes: T1 repos, T2 `useReadingSession` y `ReadingToolbar`, T3 `useLeaveGuard`, T4-T6 importadores.
- Produces:
  - Rutas: `/biblioteca`, `/biblioteca/importar`, `/biblioteca/:id`, `/glosario` (Tarea 9).
  - Navegación: Inicio · Diagnóstico · Biblioteca · Progreso · Glosario. La medición rápida de texto pegado (`/leer`) queda accesible desde Biblioteca.
  - `anchors.ts`:
    - `rangeToAnchor(range: Range, chapter: number): TextAnchor | 'cross-paragraph' | null`: los párrafos llevan `data-paragraph`; los desplazamientos se calculan sobre el texto plano del párrafo, recorriendo sus nodos de texto, así que son correctos aunque haya `<mark>` dentro.
    - `segmentsWithMarks(text: string, marks: { start: number; end: number; id: number }[]): { text: string; markId?: number }[]`: los solapamientos se resuelven con la marca más reciente.
  - **ImportPage:**
    - pestañas Archivo (PDF/EPUB), Pegar (texto o HTML: en el evento `paste` se usa `text/html` si existe) y Libro físico (lleva a la Tarea 8);
    - campos de título, autor e idioma editables antes de guardar, y URL si viene de «Compartir»;
    - muestra el progreso de importación de PDF;
    - los errores se muestran con `t('import.error.<code>')`; para `no-text` hay un botón «Usar modo libro físico».
  - **LibraryPage:** lista con título, autor, formato, % leído (párrafo actual / total), «Continuar» y «Eliminar» (con confirmación).
  - **DocumentReaderPage:**
    - índice de capítulos y posición restaurada;
    - lectura con `useReadingSession`;
    - el contenido es visible antes de empezar, pero solo cuenta lo leído entre «Empezar sesión» y «Terminé»;
    - al terminar, confirmación del último párrafo leído (propuesto por `IntersectionObserver`, ajustable con «‹ / ›») → `words` con `countWords`, y se guarda la sesión `kind: 'documento'`;
    - `savePosition` al terminar y al cambiar de capítulo.
  - **AnnotationBar:** barra fija inferior cuando hay selección dentro del artículo, con «Subrayar», «Nota» (abre un campo: tipo cita/paráfrasis/idea + texto) y «Glosario» (término = selección, contexto = oración que la contiene, definición).
  - **NotesPanel:** notas del documento en orden de lectura, con página si existe; al pulsar una, se desplaza al párrafo. Permite editar y borrar.
  - **Página original (PDF):** botón «Ver página original» en el párrafo actual. Abre un diálogo que dibuja en un `<canvas>` la página `chapters[c].pages[p]` desde el `file` guardado, con `pdfjs-dist` en carga diferida. Sirve para revisar figuras, tablas o un orden de texto dudoso.

- [ ] **Step 1: Tests que fallan**

```ts
// anchors.test: párrafo "Hola <mark>mundo</mark> cruel": seleccionar "cruel" → { start: 11, end: 16 }
// anchors.test: selección que empieza en el párrafo 0 y acaba en el 1 → 'cross-paragraph'
// anchors.test: segmentsWithMarks('abcdef', [{start:1,end:3,id:1}]) → ['a', 'bc'(1), 'def']
// ImportPage.test: pegar HTML de artículo → guardar → listDocuments() tiene 1 documento format 'web'
// ImportPage.test: importar escaneado.pdf → muestra t('import.error.no-text') y el botón del modo libro físico
// DocumentReaderPage.test: abrir un documento de 3 capítulos en posición {1,2} → se muestra el capítulo 2 y el párrafo 2 recibe scrollIntoView
// DocumentReaderPage.test: Empezar → Terminé → confirmar último párrafo 4 desde inicio 2 → sesión con words = palabras de los párrafos 2..4
// DocumentReaderPage.test: seleccionar texto y «Subrayar» → aparece <mark> y listNotes devuelve kind 'subrayado' con quote igual al texto
// main/share: navegar a /Lectura-rapida/compartir?url=… redirige al hash de importación (test de shareTargetToImportHash + manifest contiene share_target)
```

- [ ] **Step 2-4:** FAIL → implementar → PASS (`npm test && npm run lint && npm run build`).
- [ ] **Step 5: Commit y push** — `feat: biblioteca, importación y lector de documentos con subrayado y notas`

---

### Task 8: Sesión de libro físico

**Files:**
- Create: `src/features/sesion-fisica/PhysicalSessionPage.tsx` (+ test), `src/lib/physical.ts` (+ test), `src/lib/sound.ts`
- Modify: rutas (`/biblioteca/fisico`, `/biblioteca/fisico/:sourceId`), `src/i18n/es.ts`

**Interfaces:**
- Produces:
  - `estimateWordsPerPage(wordsPerLine: number[], linesPerPage: number): number` = `Math.round(promedio × linesPerPage)`.
  - `physicalWords(from: number, to: number, wordsPerPage: number): number` = `(to − from + 1) × wordsPerPage`; lanza `RangeError` si `to < from`.
  - `playChime(): void` (Web Audio, 440 Hz, 0,3 s, volumen 0,1; no hace nada si no hay `AudioContext`); `vibrate()` solo si existe `navigator.vibrate`.
  - Flujo de PhysicalSessionPage:
    1. Libro (nuevo con título/autor/año/editorial, o una fuente existente de tipo `libro`).
    2. Página inicial.
    3. Propósito (L).
    4. Estimación de palabras por página, solo la primera vez por libro (guardada en `settings` con la clave `wpp:<sourceId>`).
    5. Temporizador con sondeos (`PROBE_RANGE_PROGRAMA`, `playChime`) y «Nota rápida» (texto + página → `addNote` con `page`).
    6. Al terminar: página final, recuerdo libre (R) → sesión `kind: 'fisico'` con `pages`, `purpose`, `recall`, `words` y `wpm`.

- [ ] **Step 1: Tests que fallan**

```ts
expect(estimateWordsPerPage([10, 12, 11], 30)).toBe(330)
expect(physicalWords(10, 19, 300)).toBe(3000)
expect(() => physicalWords(20, 19, 300)).toThrow(RangeError)
// PhysicalSessionPage.test (now controlado): libro nuevo, pág. 10, wpp por líneas [10,10,10]×30, leer 10 min,
//   terminar en pág. 19 → sesión kind 'fisico', pages {10,19}, words 3000, wpm 300
// Nota rápida con página 12 → listNotes({sourceId}) contiene { page: 12 }
// página final menor que la inicial → mensaje de error y no guarda
```

- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: sesión guiada de libro físico`

---

### Task 9: Marcapasos opcional y glosario

**Files:**
- Create: `src/lib/pacer.ts` (+ test), `src/features/lector/Pacer.tsx`, `src/features/glosario/GlossaryPage.tsx` (+ test)
- Modify: `DocumentReaderPage.tsx` (control del marcapasos), `ReadingView.tsx` (marcapasos también en texto pegado), `HistoryPage.tsx` (etiquetas de `documento` y `fisico`), `src/i18n/es.ts`

**Interfaces:**
- Produces:
  - `PACER_WINDOW = 4`
  - `tokenize(paragraph: string): string[]`: separa por espacios y conserva la puntuación; se usa solo para el resaltado.
  - `pacerPosition(activeMs: number, wpm: number, wordCounts: number[]): { paragraph: number; word: number } | null`: devuelve `null` al acabar; `wordCounts` son los tokens por párrafo desde el párrafo de inicio.
  - `Pacer`:
    - resalta una ventana de `PACER_WINDOW` palabras del párrafo actual (`bg-accent-soft`) y desplaza el párrafo a la vista;
    - avanza con el tiempo activo de `useReadingSession`, de modo que se detiene con sondeos y con la pestaña oculta;
    - control de ppm de 100 a 800 en pasos de 10, desactivado por defecto;
    - muestra el texto `t('pacer.note')`: «El marcapasos es opcional; si tu comprensión baja, reduce la velocidad».
  - `GlossaryPage`: lista por idioma con término, definición, traducción, contexto y fuente; permite edición en línea y borrado.
  - `HistoryPage`: las sesiones `documento` muestran el título, y las `fisico` el título y «págs. 10-19».

- [ ] **Step 1: Tests que fallan**

```ts
expect(pacerPosition(0, 240, [10, 10])).toEqual({ paragraph: 0, word: 0 })
expect(pacerPosition(3000, 240, [10, 10])).toEqual({ paragraph: 1, word: 2 })   // 12 palabras en 3 s a 240 ppm
expect(pacerPosition(6000, 240, [10, 10])).toBeNull()
// Pacer en ReadingView: con un sondeo abierto, avanzar el reloj no mueve el resaltado
// GlossaryPage.test: 2 entradas (es, en) → dos grupos; editar la definición la persiste; borrar la quita
// HistoryPage.test: sesión fisico con pages {10,19} muestra "págs. 10-19"
```

- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: marcapasos opcional y glosario personal`

---

### Task 10: Criterio de salida (e2e), documentación y publicación

**Files:**
- Create: `tests/e2e/fase2.spec.ts`
- Modify: `docs/PLANO.md`, `README.md`, `DESCRIPTION.md` (tiempos verbales honestos), `docs/METODO.md` (citar Hu y Nation en el texto o retirar la referencia), plan de fases 0-1 (nota: ESLint → oxlint), `vite.config.ts` (`base` desde `VITE_BASE`, con `'/Lectura-rapida/'` por defecto; quitar `includeAssets` duplicados)

- [ ] **Step 1: e2e que falla** (`tests/e2e/fase2.spec.ts`), con un caso por formato:
  1. Importar `muestra.pdf` → abrir → subrayar una frase → la nota aparece en el panel con su página. «Ver página original» muestra un `canvas` con dimensiones mayores que cero.
  2. Importar `muestra.epub` → cambiar al capítulo 2 → «Empezar sesión», esperar 6 s, «Terminé», confirmar → el Progreso muestra una sesión de documento.
  3. Pegar el HTML de un artículo → añadir al glosario una palabra → aparece en `/glosario`.
  4. Sesión de libro físico de 6 s → el Progreso muestra «págs.».
  5. Sin conexión: recargar → la Biblioteca sigue listando los 3 documentos.
- [ ] **Step 2:** `npm run e2e` → FAIL antes de los ajustes finales; PASS después.
- [ ] **Step 3: Documentación:** fase 2 marcada como completada en `PLANO.md`; README y DESCRIPTION describen lo que ya existe en presente y lo futuro como futuro.
- [ ] **Step 4: Verificación final:** `npm run lint && npm test && npm run build && npm run e2e` → todo en verde.
- [ ] **Step 5: Commit y push** — `feat: criterio de salida de la fase 2 (e2e), documentación y base configurable`
