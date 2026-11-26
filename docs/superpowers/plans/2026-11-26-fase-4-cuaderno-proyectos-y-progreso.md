# Fase 4 — Cuaderno, proyectos, progreso y tablero: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tablero de inicio con botones por actividad y estadísticas guardadas; progreso con gráficas por semana y exportación CSV; cuaderno de notas y fuentes; proyectos de escritura (trazado, plancha, proyecto de instrucción, ensayo) exportables a **Word (.docx)** y Markdown con bibliografía; respaldo y restauración en un archivo; ajustes. Además, cerrar los pendientes de la fase 3.

**Architecture:**
- **Lógica pura** en `src/lib/`: `stats.ts` (agregaciones), `citation.ts` (APA simplificado), `exportProject.ts` (Markdown y docx) y `backup.ts` (ZIP versionado).
- **Interfaz** en `src/features/{inicio,progreso,cuaderno,proyectos,ajustes}`.
- **Gráficas** en SVG propio, sin librería, siempre con una tabla de datos equivalente.
- **Bajo demanda:** `docx` y `jszip` se cargan solo al exportar o respaldar.

**Tech Stack:** el de las fases anteriores + `docx` 9.x.

**Spec:** `docs/superpowers/specs/2026-11-25-lectura-rapida-design.md` — secciones 3, 7.1 (tablero), 7.7 (cuaderno y proyectos), 7.8 (progreso), 7.10 (ajustes y respaldo), 8, 8 bis, 12.

## Global Constraints

- Todo lo de fases anteriores sigue vigente: textos vía `t()`, `lang` en registros, colores semánticos con contraste AA, sin metas de ppm, ILE solo con comprensión objetiva, datos solo en el dispositivo.
- **Sin rachas que castiguen** (anti-meta del diseño). El tablero muestra "días con práctica en los últimos 7" en lugar de una racha que se rompe.
- **Gráficas:** antes de escribirlas se carga la skill `dataviz` y se siguen sus reglas de forma, color y accesibilidad. Cada gráfica tiene título, unidades y una tabla de datos alternativa (`<details>`). Sin dependencias de gráficas.
- **Exportar no es publicar:** los archivos se generan en el navegador y se descargan; nada sale a la red.
- **Bibliografía en APA simplificado** (7.ª ed., adaptado):
  - libro: `Autor. (Año). *Título*. Editorial.`;
  - artículo o web: `Autor. (Año). Título. URL`;
  - sin autor, el título ocupa su lugar; sin año, `(s. f.)`;
  - orden alfabético por autor o título.
  
  Citas en el texto: `(Autor, Año, p. N)`, con `p.` solo si hay página.
- **Respaldo:**
  - es un `.zip` con `datos.json` (`{ formato: 'lectura-rapida-respaldo', version: 1, esquema, exportadoEl, tablas }`) y `archivos/<documentId>` para los PDF/EPUB (opcional excluirlos);
  - las fechas se serializan como `{ "$date": ISO }` y se restauran como `Date`;
  - restaurar **reemplaza** todos los datos, previa confirmación explícita;
  - un respaldo de versión mayor que la soportada se rechaza con un mensaje.
- **Recordatorio de respaldo:** si hay datos y han pasado 7 días desde el último respaldo (o nunca se hizo).
- Commit y push al cerrar cada tarea, **solo si la verificación de la tarea termina con código 0**.

## Review Focus

1. **Restaurar un respaldo** antiguo, dañado, de otra app o de una versión futura → mensaje claro y ningún dato borrado (Tarea 2).
2. **Proyecto con notas cuyo documento o fuente se borró** → se exporta igual, con la nota y la fuente marcadas como "fuente eliminada", sin romper (Tareas 7 y 8).
3. **Usuario sin datos** → tablero, progreso y cuaderno muestran estados vacíos útiles, no gráficas en blanco ni `NaN` (Tareas 3, 4 y 5).
4. **Texto con caracteres especiales** (comillas, «», acentos, saltos de línea, `*` o `#`) en notas y títulos → el Markdown y el .docx los conservan sin romper el formato (Tarea 8).
5. **Respaldo grande** con PDF de decenas de MB → la opción de excluir archivos funciona y el ZIP se genera sin bloquear la pestaña con base64 (Tarea 2).

---

### Task 1: Esquema v4 (proyectos y etiquetas de notas) y repositorios

**Files:**
- Modify: `src/lib/storage/db.ts`, `src/lib/storage/notes.ts` (+ test), `src/lib/storage/library.ts` (+ test), `migration.test.ts`
- Create: `src/lib/storage/projects.ts` (+ test)

**Interfaces:**
- Produces:
  - `Note.tags?: string[]`
  - `type ProjectKind = 'trazado' | 'plancha' | 'instruccion' | 'ensayo' | 'estudio'`
  - `type ProjectItem = { type: 'note'; noteId: number } | { type: 'text'; text: string }`
  - `interface ProjectSection { id: string; title: string; items: ProjectItem[] }`
  - `interface Project { id?: number; title: string; kind: ProjectKind; topic: string; thesis: string; sections: ProjectSection[]; lang: string; createdAt: number; updatedAt: number }`
  - Dexie **v4**: `projects: '++id, updatedAt'`, `notes: '++id, sourceId, documentId, kind, createdAt, *tags'`
  - `notes.ts`:
    - `listAllNotes(filter?: { sourceId?: number; kind?: NoteKind; tag?: string; query?: string }): Promise<Note[]>`, ordenadas por `createdAt` desc; `query` busca sin distinguir mayúsculas ni acentos en `text` y `quote`;
    - `updateNote(id, patch: Partial<Pick<Note,'text'|'kind'|'tags'|'page'>>)`;
    - `listTags(): Promise<string[]>`
  - `library.ts`: `listSources(): Promise<Source[]>`, `updateSource(id, patch: Partial<Omit<Source,'id'|'createdAt'>>)`.
  - `projects.ts`:
    - `createProject(p: Pick<Project,'title'|'kind'>): Promise<number>`, con una sección inicial «Introducción»;
    - `getProject(id)`, `listProjects()` (por `updatedAt` desc), `saveProject(p: Project)` (actualiza `updatedAt`), `deleteProject(id)`.

- [ ] **Step 1: Tests que fallan**
  - Migración v3 → v4 conserva fichas, programa y notas; las notas antiguas sin `tags` siguen listándose.
  - `listAllNotes({ query: 'atencion' })` encuentra «Atención»; `{ tag: 'tesis' }` filtra.
  - `createProject` → `getProject` tiene una sección; `saveProject` cambia `updatedAt`; `listProjects` en orden.
  - `updateSource` persiste el año.
- [ ] **Step 2-4:** FAIL → implementar → PASS (`npm test`).
- [ ] **Step 5: Commit y push** — `feat: esquema v4 con proyectos de escritura y etiquetas de notas`

---

### Task 2: Respaldo y restauración

**Files:**
- Create: `src/lib/backup.ts` (+ test)
- Modify: `src/lib/storage/settings.ts` (claves `backup:lastAt`)

**Interfaces:**
- Produces:
  - `BACKUP_FORMAT = 'lectura-rapida-respaldo'`, `BACKUP_VERSION = 1`
  - `exportBackup(opts: { includeFiles: boolean }): Promise<Blob>`:
    - un ZIP con JSZip cargado bajo demanda;
    - recorre todas las tablas de `db`;
    - los `Blob` de documentos van a `archivos/<id>` y en `datos.json` se guarda `file: { "$file": "archivos/<id>" }`, o se omite si `includeFiles` es false;
    - las fechas se guardan como `{ "$date": ISO }`;
    - al terminar, `setSetting('backup:lastAt', Date.now())`.
  - `type RestoreError = 'not-a-backup' | 'unsupported-version' | 'corrupt'`
  - `inspectBackup(file: Blob): Promise<{ ok: true; summary: Record<string, number>; exportedAt: string } | { ok: false; error: RestoreError }>`: lee y valida sin escribir nada.
  - `restoreBackup(file: Blob): Promise<void>`:
    - valida primero;
    - después, en una sola transacción, vacía todas las tablas y escribe los datos, restaurando `Date` y `Blob`;
    - si algo falla, la transacción se revierte y no se pierde nada.
  - `backupDue(now: number, lastAt: number | undefined, hasData: boolean): boolean`: verdadero si hay datos y nunca se respaldó o pasaron ≥ 7 días.

- [ ] **Step 1: Tests que fallan**
  - Ida y vuelta: sesión, nota, ficha (`fsrs.due` y `last_review` vuelven como `Date` y `dueCards` las encuentra), documento con `Blob` (mismo tamaño y contenido), programa y ajustes.
  - Con `includeFiles: false`, el documento se restaura sin `file` y todo lo demás intacto.
  - Un ZIP sin `datos.json`, un JSON de otra app o `version: 2` → `inspectBackup` devuelve el error correspondiente y `restoreBackup` lanza sin modificar los datos existentes (se comprueba que siguen ahí).
  - `backupDue`: sin datos → false; nunca respaldado con datos → true; 6 días → false; 7 días → true.
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: respaldo y restauración en un archivo ZIP versionado`

---

### Task 3: Motor de estadísticas

**Files:**
- Create: `src/lib/stats.ts` (+ test)

**Interfaces:**
- Produces (funciones puras sobre `SessionSummary[]`, `AttentionSession[]` y `QuizResult[]`):
  - `weekKey(ts: number): string`: lunes de la semana en ISO `YYYY-MM-DD`, en hora local.
  - `weeklySeries(sessions, from, to)` → `{ week: string; ppm: Record<TextKind, number | null>; comprehension: number | null; wandering: number | null; minutes: number }[]`. Usa la mediana de ppm por tipo de texto, solo lecturas con cuestionario (no hojeo); la comprensión es la media de los cuestionarios inmediatos; los minutos son la suma de `activeMs` de todas las sesiones más la atención.
  - `retentionSummary(quizzes)` → `{ d1: number | null; d7: number | null }`: media de retención diferida, sobre las mismas 5 preguntas.
  - `dashboardStats(input, now)` →
    `{ lastPpm: Record<TextKind, number | null>; avgComprehension: number | null; retention: { d1; d7 }; wandering: number | null; practiceDays7: number; minutesWeek: number; ileSeries: { at: number; ile: number }[] }`.
    - `avgComprehension` son las 5 últimas lecturas con cuestionario;
    - `practiceDays7` son los días distintos con alguna sesión de lectura o atención en los últimos 7;
    - `ileSeries` son las últimas 12 lecturas con cuestionario.
  - Sin datos, todo es `null`, 0 o un array vacío, nunca `NaN`.

- [ ] **Step 1: Tests que fallan.** Datos sintéticos de 3 semanas que verifican:
  - medianas por tipo;
  - exclusión del hojeo;
  - minutos con atención;
  - `practiceDays7` con dos sesiones el mismo día, que cuentan como 1;
  - entrada vacía → sin `NaN` (`JSON.stringify` no contiene `NaN` ni `null` en los números de conteo);
  - semanas que cruzan el cambio de año.
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: motor de estadísticas para tablero y progreso`

---

### Task 4: Progreso con gráficas y CSV

**Files:**
- Create: `src/features/progreso/charts/LineChart.tsx`, `BarChart.tsx`, `Sparkline.tsx` (+ tests), `src/features/progreso/ProgressPage.tsx` (+ test), `src/lib/csv.ts` (+ test)
- Modify: `HistoryPage.tsx` (pasa a ser la pestaña «Historial»), rutas, `src/index.css` (tokens de series si la skill dataviz lo indica)

**Interfaces:**
- **Antes de escribir las gráficas, cargar la skill `dataviz`** y aplicar su método de forma, color y marcas.
- `LineChart({ title, unit, series: { name: string; points: { x: string; y: number | null }[] }[] })` y `BarChart({ title, unit, bars: { x: string; y: number }[] })`:
  - SVG responsivo y colores desde tokens semánticos por tema;
  - huecos donde `y` es `null`;
  - `<figure>` con `<figcaption>`, `role="img"` con `aria-label` resumido, y `<details>` con la tabla de datos.
- `Sparkline({ points: number[]; label: string })`.
- `ProgressPage`:
  - pestañas «Resumen» y «Historial»;
  - Resumen: ppm por tipo de texto (líneas), comprensión % y divagación % (líneas), minutos por semana (barras), retención 24 h y 7 días (cifras);
  - rango de las últimas 12 semanas;
  - botón «Exportar CSV».
- `sessionsToCsv(rows: SessionSummary[]): string`:
  - columnas `fecha,tipo,titulo,idioma,tipo_texto,ppm,comprension,ile,divagacion,minutos,paginas`;
  - separador `,`, comillas dobles escapadas, saltos de línea `\r\n` y BOM UTF-8 para que Excel lea los acentos.

- [ ] **Step 1: Tests que fallan.** CSV:
  - un título con comas y comillas sale bien escapado;
  - empieza con BOM;
  - una fila por sesión.
  
  `LineChart`:
  - con un punto `null` hay dos segmentos;
  - la tabla de `<details>` contiene todos los valores.
  
  `ProgressPage` sin datos muestra `t('progress.empty')`, no gráficas.
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: progreso con gráficas por semana y exportación CSV`

---

### Task 5: Tablero de inicio y práctica con textos

**Files:**
- Create: `src/features/inicio/Dashboard.tsx` (+ test), `src/features/practica/PracticePage.tsx` (+ test)
- Modify: `HomePage.tsx` (pasa a renderizar `Dashboard`), `Layout.tsx` (navegación reorganizada), rutas (`/practica`, `/practica/:textId`), `src/i18n/es.ts`

**Interfaces:**
- **Dashboard:**
  - **Hoy:** día del programa (o mantenimiento) con botón, fichas pendientes, retención pendiente (`RetentionCheck`) y aviso de respaldo si `backupDue` (con enlace a Ajustes);
  - **Actividades:** botones grandes con icono de texto y descripción breve:
    - Programa del día
    - Prueba de velocidad (diagnóstico)
    - Lectura de comprensión (práctica)
    - Repasar fichas (n)
    - Atención
    - Mi biblioteca
    - Libro físico
    - Glosario
    - Cuaderno
    - Proyectos
    - Progreso
  - **Tus estadísticas:**
    - última ppm por tipo de texto;
    - comprensión media de las 5 últimas;
    - retención a 24 h y 7 días;
    - divagación;
    - días con práctica en los últimos 7 (no una racha);
    - minutos de esta semana;
    - minigráfica del ILE (`Sparkline`).
  - Sin datos: invitación al diagnóstico y estadísticas sustituidas por `t('dashboard.noData')`.
- **PracticePage (`/practica`):**
  - lista los textos de práctica con tipo, palabras y estado («Sin leer» o «Leído · X %»);
  - los no leídos aparecen primero;
  - al elegir uno, `TextTestFlow` con `role: 'practica'`;
  - avisa si el texto ya se leyó: la comprensión de una relectura no cuenta para la progresión.
- **Navegación:** Inicio · Programa · Biblioteca · Repasar (n) · Cuaderno · Progreso · Ajustes. Diagnóstico, Atención y Glosario quedan accesibles desde el tablero.

- [ ] **Step 1: Tests que fallan.**
  - Dashboard sin datos → invitación y sin `NaN`.
  - Dashboard con 2 sesiones y 1 ficha vencida → «Repasar fichas (1)» y la ppm correcta por tipo.
  - Aviso de respaldo cuando nunca se respaldó y hay datos.
  - PracticePage marca un texto leído con su comprensión, y abrir uno no leído inicia el flujo.
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: tablero de inicio con actividades y estadísticas; práctica con textos`

---

### Task 6: Fuentes y cuaderno

**Files:**
- Create: `src/features/cuaderno/NotebookPage.tsx` (+ test), `src/features/cuaderno/SourcesPage.tsx` (+ test)
- Modify: rutas (`/cuaderno`, `/fuentes`), `src/i18n/es.ts`

**Interfaces:**
- **NotebookPage:**
  - todas las notas, con filtros por fuente, tipo y etiqueta, y búsqueda;
  - cada nota muestra su tipo, la cita, el texto, la fuente con su página y sus etiquetas;
  - se puede editar el texto, el tipo y las etiquetas (campo con comas);
  - «Añadir a un proyecto» abre un selector de proyecto y sección;
  - «Ir al documento» lleva al lector si existe `documentId`;
  - la nota de una fuente eliminada se muestra con `t('notebook.sourceDeleted')`.
- **SourcesPage:** lista de fuentes con tipo, título, autor, año, editorial y URL editables; muestra el número de notas por fuente y la vista previa de su entrada bibliográfica (`formatReference`, Tarea 8). Se completa la Tarea 8 antes si se necesita, o se muestra la vista previa al terminarla.

- [ ] **Step 1: Tests que fallan.**
  - Filtrar por fuente y por etiqueta.
  - Buscar sin acentos.
  - Editar etiquetas persiste.
  - «Añadir a un proyecto» añade un `ProjectItem` de nota a la sección elegida.
  - Editar el año de una fuente persiste.
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: cuaderno de notas y gestión de fuentes`

---

### Task 7: Proyectos de escritura

**Files:**
- Create: `src/features/proyectos/ProjectsPage.tsx` (+ test), `src/features/proyectos/ProjectEditor.tsx` (+ test)
- Modify: rutas (`/proyectos`, `/proyectos/:id`), `src/i18n/es.ts`

**Interfaces:**
- **ProjectsPage:** lista los proyectos y permite crear uno nuevo (título y tipo: trazado, plancha, proyecto de instrucción, ensayo o trabajo de estudio).
- **ProjectEditor** (guardado automático con `saveProject` a los 800 ms del último cambio):
  - título, tipo, tema y tesis;
  - secciones con título editable: añadir, borrar (con confirmación si tiene elementos), subir y bajar;
  - elementos de cada sección:
    - una nota del cuaderno, mostrada con tipo, cita, texto y referencia breve `(Autor, Año, p. N)`;
    - un párrafo propio editable;
  - cada elemento se puede subir, bajar, mover a otra sección o quitar;
  - «Añadir notas» abre un selector con búsqueda y filtro por fuente que añade varias a la vez;
  - una nota borrada muestra `t('project.noteDeleted')` y se omite al exportar;
  - botones «Exportar a Word» y «Exportar a Markdown» (Tarea 8).
- **Interacción accesible por botones** (subir, bajar, mover) en lugar de arrastrar.

- [ ] **Step 1: Tests que fallan.**
  - Crear un proyecto, añadir sección, añadir 2 notas y un párrafo, reordenar y mover entre secciones → `getProject` refleja el orden.
  - Borrar una nota del cuaderno → el editor muestra el aviso.
  - El guardado automático persiste tras 800 ms (fake timers).
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: proyectos de escritura con secciones, notas y párrafos propios`

---

### Task 8: Citas, bibliografía y exportación a Markdown y Word

**Files:**
- Create: `src/lib/citation.ts` (+ test), `src/lib/exportProject.ts` (+ test), `src/lib/exportDocx.ts` (+ test con `// @vitest-environment node`)
- Modify: `ProjectEditor.tsx` (botones de exportación), `SourcesPage.tsx` (vista previa)

**Interfaces:**
- `citation.ts`:
  - `formatReference(s: Source): { text: string; italic: [number, number] | null }`: texto APA simplificado y tramo en cursiva (título de libro);
  - `inTextCitation(s: Source | undefined, page?: number): string`, por ejemplo `(Pérez, 2020, p. 12)`, `(Título, s. f.)` o `(fuente eliminada)`;
  - `bibliography(sources: Source[]): ReturnType<typeof formatReference>[]`, ordenada con `localeCompare('es')`.
- `exportProject.ts`:
  - `buildProjectDocument(project, notes: Map<number, Note>, sources: Map<number, Source>)`: estructura intermedia con título, tipo, tema, tesis, secciones (párrafos con tipo cita, paráfrasis, idea o texto, más su cita) y bibliografía de las fuentes usadas;
  - `toMarkdown(doc): string`: escapa `*`, `_`, `#`, `[` y `` ` `` al inicio o dentro del texto del usuario; las citas van como `> «…» (Autor, Año, p. N)`.
- `exportDocx.ts`: `toDocx(doc): Promise<Blob>` con `docx`, importado bajo demanda. Estilos:
  - título, encabezados de sección y párrafos normales;
  - citas con sangría y comillas «»;
  - bibliografía con sangría francesa y título del libro en cursiva;
  - metadatos `title` y `creator: 'Lectura Rápida'`.
- **Descarga:** `downloadBlob(blob, filename)` con `URL.createObjectURL`. Nombre: `<titulo-normalizado>.docx` o `.md`.

- [ ] **Step 1: Tests que fallan.**
  - `formatReference`: libro con autor y año; web sin autor; sin año → `(s. f.)`.
  - `inTextCitation` con y sin página; fuente eliminada.
  - `bibliography` en orden alfabético, con acentos ordenados correctamente.
  - `toMarkdown`: una nota con `*negrita*` y `# almohadilla` se escapa; aparecen las comillas «» y la cita.
  - `toDocx`: `JSZip` abre el resultado; `word/document.xml` contiene el título, la cita con su referencia, cada entrada de la bibliografía y los caracteres «», ñ y acentos correctos.
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: citas y bibliografía APA; exportación de proyectos a Word y Markdown`

---

### Task 9: Ajustes

**Files:**
- Create: `src/features/ajustes/SettingsPage.tsx` (+ test), `src/lib/preferences.ts` (+ test)
- Modify: `useReadingSession` y `ReadingView` (respetar preferencias), `PhysicalSessionPage` (sonido y vibración), rutas (`/ajustes`), `src/i18n/es.ts`

**Interfaces:**
- `preferences.ts`:
  - `type Preferences = { fontIndex: number; lineHeight: 'normal' | 'amplio'; probesInFreeReading: boolean; sound: boolean; vibration: boolean }`
  - por defecto `{ 1, 'normal', true, true, true }`;
  - `loadPreferences(): Promise<Preferences>`, `savePreferences(p): Promise<void>` en `settings`.
- **SettingsPage:**
  - **Apariencia:** tema (`ThemePicker`), tamaño de letra y altura de línea por defecto.
  - **Lectura:** sondeos de atención en lecturas libres (siempre activos en el programa y el diagnóstico, como dice el spec §7.5), sonido y vibración.
  - **Datos:**
    - estado del almacenamiento persistente;
    - «Crear respaldo» con casilla «Incluir PDF y EPUB»;
    - «Restaurar respaldo»: muestra el resumen de `inspectBackup` antes de confirmar;
    - fecha del último respaldo.
- Lecturas libres (texto pegado y documentos): si `probesInFreeReading` es false, no hay sondeos.

- [ ] **Step 1: Tests que fallan.**
  - Guardar preferencias persiste.
  - Con sondeos desactivados, un `ReadingView` de lectura libre no abre el diálogo al pasar el tiempo.
  - Restaurar un archivo inválido muestra el error y no borra datos.
  - Crear un respaldo actualiza la fecha mostrada.
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: ajustes de lectura, apariencia y datos (respaldo)`

---

### Task 10: Pendientes de la fase 3

**Files:** según cada punto.

- **Idioma:**
  - `lang` de las fichas, notas y esquemas del programa tomado del idioma activo de la interfaz (`'es'` vía `currentLang()` en `src/i18n/index.ts`), no escrito a mano;
  - las fechas con `Intl.DateTimeFormat(currentLang())`;
  - las lecciones declaran `lang` en su objeto.
- **Textos:**
  - intervalos de FSRS vía `t()` (`interval.min`, `interval.h`, `interval.d`, `interval.month`, `interval.months`, `interval.year`, `interval.years`);
  - plurales con `tPlural(key, count)`, que usa `Intl.PluralRules`, en «fichas», «regresos» y «días».
- **Repaso:** el foco va al botón «Mostrar respuesta» o al primer botón de calificación; el contador «Repasar (n)» se actualiza al terminar un repaso (evento `cards:changed`).
- **Pasos del día:**
  - `aria-current="step"` en el paso actual y anuncio `aria-live` al avanzar;
  - un solo `h1` en el día 1 (el diagnóstico embebido usa `h2`).
- **Ejercicios:**
  - el de preguntas muestra el título del texto que se leerá, y las preguntas vuelven a verse en el recuerdo;
  - la respiración del programa empieza con un botón;
  - el objetivo del bloque de enfoque se guarda en `program:goal:<día>` y se muestra durante la lectura del día.
- **Lector de documentos:** sugiere la velocidad del marcapasos con `baseWpm` y `suggestPacerWpm` (día 9).
- **Fichas:** no se guardan vacías desde la edición; si su fuente se borró, muestran `t('cards.sourceDeleted')`.
- **DayView:** muestra el error de carga, y `t('program.invalidDay')` si el día no es válido.
- **Pestañas de importar:** `aria-controls` solo cuando el panel existe; si no, se usa `hidden`.

- [ ] **Step 1: Tests que fallan** (uno por punto con comportamiento observable).
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `fix: pendientes de la fase 3 (idioma, plurales, accesibilidad, ejercicios)`

---

### Task 11: Criterio de salida (e2e), documentación y publicación

**Files:**
- Create: `tests/e2e/fase4.spec.ts`
- Modify: `docs/PLANO.md`, `README.md`, `DESCRIPTION.md`

- [ ] **Step 1: e2e** (`fase4.spec.ts`):
  1. Pegar 3 textos de 3 fuentes con autor y año, y crear notas de cita, paráfrasis e idea en cada uno.
  2. Crear un proyecto «Trazado de prueba» con tema, tesis y 3 secciones, añadir notas de las 3 fuentes y un párrafo propio, y exportar a Word.
  3. Abrir el `.docx` descargado con JSZip y comprobar título, citas y las 3 entradas de la bibliografía.
  4. **Convertirlo a PDF con LibreOffice** (`soffice --headless --convert-to pdf`) y comprobar que el PDF existe y tiene páginas. La prueba se omite con un aviso si no hay `soffice`.
  5. Exportar a Markdown y comprobar el contenido.
  6. Tablero: comprobar las estadísticas y los botones de actividad.
  7. Progreso: ver las gráficas y descargar el CSV.
  8. Respaldo: crear uno, borrar los datos (IndexedDB) y restaurarlo; el proyecto y las notas vuelven.
- [ ] **Step 2:** `npm run e2e` → PASS (todas las pruebas).
- [ ] **Step 3: Documentación:** fase 4 completada en `PLANO.md`; README y DESCRIPTION actualizados.
- [ ] **Step 4: Verificación final:** `npm run lint && npm test && npm run build && npm run e2e` → código 0.
- [ ] **Step 5: Commit y push** — `feat: criterio de salida de la fase 4 (e2e) y documentación`
