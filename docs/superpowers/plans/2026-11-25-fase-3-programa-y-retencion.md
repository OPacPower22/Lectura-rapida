# Fase 3 — Programa de 28 días y retención: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Programa guiado de 28 días con sus 28 micro-lecciones, ejercicios y lecturas medidas; fichas y vocabulario con repetición espaciada (FSRS); recuerdo libre; retención diferida a 24 h y 7 días; sesiones de atención; 12 textos de práctica; modo mantenimiento tras el día 28.

**Architecture:**
- **Programa:** cada día del programa son datos (`src/content/programa/dias.json`): lección + ejercicio + lectura. Un motor puro (`src/lib/program.ts`) decide qué día toca y si un paso está completo. La pantalla del día ejecuta los pasos reutilizando componentes existentes: `ReadingView`, `Quiz`, `ResultsCard`, el lector de documentos y la sesión física.
- **Repetición espaciada:** usa `ts-fsrs` envuelto en `src/lib/srs.ts`.
- **Lecciones:** Markdown propio renderizado sin `innerHTML`.

**Tech Stack:** el de las fases 1-2 + `ts-fsrs` 6.x.

**Spec:** `docs/superpowers/specs/2026-11-25-lectura-rapida-design.md` — secciones 4, 5 (reglas de progresión), 6 (programa), 7.2 (re-tests y retención a 24 h), 7.5 (atención), 7.6 (retención), 7.9 (lecciones y textos), 8.

## Global Constraints

- Todo lo de fases anteriores sigue vigente: textos vía `t()`, `lang` en todo registro, colores solo semánticos, sin metas de ppm, ILE solo con comprensión objetiva, sin RSVP/Schulte/supresión de subvocalización.
- **El programa avanza por días completados, no por fechas.** Un día se completa cuando sus pasos están hechos; no hay castigos ni rachas que se pierdan.
- **No se fuerzan duraciones mínimas** en lecciones ni ejercicios: el usuario marca "Hecho". Las duraciones (3 + 5 + 12 min) son orientativas y se muestran.
- Pasos de lectura con texto propio ("propio"): solo se completan si existe al menos una sesión de lectura (`documento`, `fisico` o `libre`) iniciada después de empezar ese día. Así la medición es honesta.
- Re-tests en los días 7, 14, 21 y 28, siempre con textos **expositivos** de dificultad equivalente (600-900 palabras). Así son comparables entre sí y con el diagnóstico expositivo.
- **Retención diferida:** se programa al terminar un diagnóstico o re-test. A las **24 h** y a los **7 días** se repiten **5 preguntas** del mismo cuestionario (las 5 primeras por id). Disponible desde el momento en que vence y hasta 3 días después.
- **FSRS** con `generatorParameters({ enable_fuzz: true })` y calificaciones Otra vez / Difícil / Bien / Fácil. Las fichas las escribe el usuario (efecto de generación). Las entradas de glosario generan una ficha automáticamente: término en el anverso; definición, traducción y contexto en el reverso.
- **Reglas de progresión del marcapasos (spec §5):** si la comprensión es < 70 % en las 2 últimas lecturas con cuestionario del mismo tipo de texto, la velocidad sugerida baja un 10 %. Si es ≥ 80 % en las 2 últimas, sube un 5 %. Rango 100-800, redondeo a 10.
- **Lecciones:** Markdown con un subconjunto fijo (encabezados `##`/`###`, párrafos, listas `-` y `1.`, `**negrita**`, `*cursiva*`, citas `>`, enlaces `[texto](url)` solo `https:`). Cada lección cierra con `**Fuentes:**` y referencias reales de `docs/METODO.md` o equivalentes verificables.
- Contenido nuevo: original, en español, temas generales; los textos expositivos deben ser factualmente correctos.
- Commit **y push** al cerrar cada tarea.

## Review Focus

1. **El usuario vuelve otro día a mitad de un día del programa** → los pasos hechos se conservan y continúa donde quedó (test en Tarea 8).
2. **Retención diferida vencida hace semanas o no vencida aún** → no se ofrece fuera de su ventana; no se puede responder dos veces (test en Tarea 6).
3. **Ficha creada desde el glosario y luego editada o borrada la entrada** → la ficha se actualiza o desaparece; no quedan fichas huérfanas (test en Tarea 2).
4. **Reloj del dispositivo que retrocede o sesión de repaso con 0 fichas** → FSRS no programa fechas en el pasado y la pantalla de repaso muestra "nada pendiente" (tests en Tareas 2 y 3).
5. **Día del programa con lectura "propia" sin documentos en la biblioteca** → el paso explica cómo añadir uno o usar el libro físico; no queda bloqueado sin salida (test en Tarea 9).

---

### Task 1: Esquema v3 (fichas, progreso del programa, sesiones de atención)

**Files:**
- Modify: `src/lib/storage/db.ts`
- Create: `src/lib/storage/program.ts` (+ test), `src/lib/storage/attention.ts` (+ test)
- Modify: `src/lib/storage/migration.test.ts`

**Interfaces:**
- Produces (en `db.ts`):
  - `QuizResult.delayDays?: 1 | 7` (solo en resultados diferidos; `deferred: true`).
  - `interface StoredCard { id?: number; kind: 'ficha' | 'glosario'; front: string; back: string; lang: string; sourceId?: number; glossaryId?: number; fsrs: import('ts-fsrs').Card; createdAt: number }`
  - `interface ProgramDay { day: number; startedAt: number; steps: Partial<Record<'lesson' | 'exercise' | 'reading', number>>; completedAt?: number }` (cada paso guarda su marca de tiempo al completarse).
  - `interface AttentionSession { id?: number; startedAt: number; durationMs: number; plannedMinutes: number; returns: number }`
  - Dexie **versión 3**: `cards: '++id, kind, glossaryId, sourceId, fsrs.due'`, `programDays: 'day'`, `attentionSessions: '++id, startedAt'`.
- Produces (repos):
  - `program.ts`: `getProgramDays(): Promise<ProgramDay[]>`; `startDay(day: number): Promise<ProgramDay>` (idempotente: si existe, lo devuelve); `completeStep(day: number, step: 'lesson' | 'exercise' | 'reading'): Promise<ProgramDay>`; `completeDay(day: number): Promise<void>`.
  - `attention.ts`: `saveAttentionSession(s: Omit<AttentionSession,'id'>): Promise<number>`; `listAttentionSessions(): Promise<AttentionSession[]>`.

- [ ] **Step 1: Tests que fallan.** Migración v2 → v3 conserva documentos, notas, glosario y sesiones (extender `migration.test.ts` con una base v2 poblada; `db.verno === 3`). `startDay(1)` dos veces devuelve el mismo `startedAt`. `completeStep(1, 'lesson')` guarda la marca y conserva los demás pasos. `listAttentionSessions` ordena por `startedAt` descendente.
- [ ] **Step 2-4:** FAIL → implementar (instalar `ts-fsrs`) → PASS.
- [ ] **Step 5: Commit y push** — `feat: esquema v3 con fichas, programa y sesiones de atención`

---

### Task 2: Repetición espaciada (FSRS) y fichas

**Files:**
- Create: `src/lib/srs.ts` (+ test), `src/lib/storage/cards.ts` (+ test)
- Modify: `src/lib/storage/glossary.ts` (+ test)

**Interfaces:**
- Produces:
  - `type Grade = 'again' | 'hard' | 'good' | 'easy'`
  - `newCardState(now: Date): Card`
  - `review(card: Card, grade: Grade, now: Date): Card`: si `now < card.last_review`, usa `card.last_review`, de modo que el reloj atrasado nunca programa en el pasado.
  - `previewIntervals(card: Card, now: Date): Record<Grade, string>`: texto corto ("10 min", "2 d", "1 mes") para los botones.
  - `cards.ts`:
    - `addCard(c: { kind: 'ficha'; front: string; back: string; lang: string; sourceId?: number }): Promise<number>`
    - `dueCards(now: Date, limit?: number): Promise<StoredCard[]>`: vencidas primero, por `fsrs.due`.
    - `countDue(now: Date): Promise<number>`
    - `gradeCard(id: number, grade: Grade, now: Date): Promise<void>`
    - `updateCard(id: number, patch: { front?: string; back?: string }): Promise<void>`
    - `deleteCard(id: number): Promise<void>`
    - `listCards(): Promise<StoredCard[]>`
  - En `glossary.ts`: `addGlossaryEntry` crea también una ficha `kind: 'glosario'` con `glossaryId`. `updateGlossaryEntry` actualiza su reverso y `deleteGlossaryEntry` borra la ficha, todo en la misma transacción.

- [ ] **Step 1: Tests que fallan**

```ts
// srs: review(new, 'good', t0).due > t0; review con now anterior a last_review → due >= last_review
// srs: tras 'again' la ficha vuelve antes que tras 'easy'
// cards: dueCards(t) excluye fichas con due > t; countDue coincide
// glossary: addGlossaryEntry → existe una card kind 'glosario' con front = término y back que contiene la definición
//           updateGlossaryEntry(definition) → back actualizado; deleteGlossaryEntry → la card desaparece
```

- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: repetición espaciada FSRS y fichas (también desde el glosario)`

---

### Task 3: Pantalla de repaso y creación de fichas

**Files:**
- Create: `src/features/retencion/ReviewPage.tsx` (+ test), `src/features/retencion/CardForm.tsx`, `src/features/retencion/CardsPage.tsx` (+ test)
- Modify: `AnnotationBar.tsx` (acción «Ficha»), `NotesPanel.tsx` (acción «Convertir en ficha»), `DocumentReaderPage.tsx`, rutas (`/repasar`, `/fichas`), `Layout.tsx` (nav «Repasar» con contador de pendientes), `src/i18n/es.ts`

**Interfaces:**
- Produces:
  - **ReviewPage:**
    - muestra una ficha vencida por vez: anverso → «Mostrar respuesta» → reverso + 4 botones con `previewIntervals`;
    - al final, «Repaso completado: N fichas»;
    - sin fichas pendientes, `t('review.nothingDue')` y la fecha de la próxima;
    - teclado: Espacio muestra la respuesta, y las teclas 1-4 califican.
  - **CardForm** (`{ initialFront?: string; initialBack?: string; onSave(front, back): void; onCancel(): void }`): pregunta y respuesta escritas por el usuario. La ayuda explica que redactarlas uno mismo ayuda a recordar.
  - **CardsPage:** lista de fichas con estado (próxima fecha), edición y borrado. Las fichas de glosario se editan desde el glosario.
  - **AnnotationBar:** botón «Ficha» con la cita como reverso inicial.
  - **NotesPanel:** «Convertir en ficha».
  - **Layout:** el enlace «Repasar» muestra el número de pendientes (`countDue`).

- [ ] **Step 1: Tests que fallan**

```ts
// ReviewPage: 2 fichas vencidas → mostrar → 'Bien' → aparece la segunda → 'Otra vez' → "Repaso completado: 2"
// ReviewPage: 0 vencidas → t('review.nothingDue')
// ReviewPage: tecla Espacio muestra la respuesta; tecla '3' califica 'good'
// DocumentReaderPage: seleccionar → «Ficha» → escribir pregunta → guardar → listCards() tiene 1 con back = cita
// CardsPage: editar el anverso persiste; borrar elimina
```

- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: repaso de fichas y creación desde el lector y las notas`

---

### Task 4: Módulo de atención

**Files:**
- Create: `src/features/atencion/AttentionPage.tsx` (+ test), `src/features/atencion/BreathingSession.tsx`, `src/features/atencion/FocusChecklist.tsx` (+ test)
- Modify: rutas (`/atencion`), `src/i18n/es.ts`

**Interfaces:**
- Produces:
  - **`BreathingSession`** (`{ minutes: 2 | 5 | 10; now?: Clock; onDone(s: { durationMs: number; returns: number }): void }`):
    - instrucciones breves: atención a la respiración y botón «Me distraje y volví» que cuenta los regresos;
    - círculo que se expande y contrae (4 s + 6 s), con `prefers-reduced-motion` respetado;
    - temporizador visible y tono suave al terminar (`playChime`);
    - «Terminar antes» guarda la duración real.
  - **AttentionPage:** elección de 2, 5 o 10 min; guarda con `saveAttentionSession`; muestra las últimas sesiones (fecha, minutos y regresos). Nota fija con la evidencia: estudio de 2 semanas de Mrazek et al. (2013); la dosis de la app es menor, y el efecto no está garantizado.
  - **`FocusChecklist`** (`{ onReady(goal: string): void }`):
    - tres casillas: móvil lejos o en silencio, notificaciones desactivadas, una sola pestaña;
    - un campo «Objetivo de este bloque»;
    - «Empezar» se habilita con las casillas marcadas.

- [ ] **Step 1: Tests que fallan**

```ts
// BreathingSession (now controlado, fake timers): 2 min → al llegar a 120 s llama onDone({ durationMs: 120000, returns: n })
// pulsar «Me distraje y volví» 3 veces → returns 3
// «Terminar antes» a los 30 s → durationMs 30000
// AttentionPage: completar sesión → listAttentionSessions() tiene 1
// FocusChecklist: «Empezar» deshabilitado hasta marcar las 3 casillas
```

- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: módulo de atención (respiración guiada y bloque de enfoque)`

---

### Task 5: Lecciones: renderizador y 28 micro-lecciones

**Files:**
- Create: `src/lib/markdown.tsx` (+ test), `src/content/lecciones/dia-01.md` … `dia-28.md`, `src/content/lecciones/index.ts`, `src/content/lecciones/lecciones.test.ts`

**Interfaces:**
- Produces:
  - `renderMarkdown(md: string): ReactNode`: subconjunto de Global Constraints, sin `dangerouslySetInnerHTML`. Los enlaces solo se aceptan si son `https:` y llevan `rel="noopener noreferrer" target="_blank"`. Cualquier HTML del texto se muestra como texto literal.
  - `getLesson(day: number): { day: number; title: string; body: string; minutes: number }`: el título es el primer `# ` del archivo.
- Contenido:
  - una lección por día según `docs/PROGRAMA.md`, de 250-450 palabras (≈ 3 min);
  - estructura: idea clave, por qué funciona (con evidencia), cómo aplicarlo hoy (pasos concretos) y `**Fuentes:**`;
  - el día 2 desmonta los mitos de la sección 4.2 del diseño con sus fuentes;
  - las lecciones mencionan los ejercicios de la app (marcapasos, sondeos, fichas…) donde corresponda.

- [ ] **Step 1: Tests que fallan**

```ts
// markdown: '## T\n\nUn **a** y *b*' → h2 'T', <strong>a</strong>, <em>b</em>
// markdown: '<script>x</script>' se muestra como texto; no existe ningún <script> en el DOM
// markdown: '[x](javascript:alert(1))' no produce <a>; '[x](https://a.org)' produce <a href rel target>
// lecciones: hay 28, días 1..28; cada una tiene título, 250-450 palabras (countWords) y contiene '**Fuentes:**'
```

- [ ] **Step 2: Ejecutar** → FAIL.
- [ ] **Step 3: Implementar el renderizador** y escribir las lecciones de los días 1-14. Commit `content: lecciones de los días 1 a 14`.
- [ ] **Step 4: Escribir las lecciones de los días 15-28** → PASS. Commit y push: `content: lecciones de los días 15 a 28`.

---

### Task 6: Textos de práctica y retención diferida

**Files:**
- Create: `src/content/textos/retest-1.md/.json` … `retest-4`, `practica-1` … `practica-5` (9 textos nuevos; total 12)
- Create: `src/lib/retention.ts` (+ test), `src/features/retencion/RetentionCheck.tsx` (+ test)
- Modify: `src/content/content.test.ts`, `src/content/index.ts`, `src/features/diagnostico/DiagnosticPage.tsx`, `src/i18n/es.ts`

**Interfaces:**
- Produces:
  - `PracticeText.role: 'diagnostico' | 'retest' | 'practica'` (nuevo campo en el JSON; los 3 existentes son `diagnostico`).
  - Textos nuevos:
    - `retest-1..4`: expositivos, 600-900 palabras;
    - `practica-1` narrativo, `practica-2` expositivo, `practica-3` denso, `practica-4` expositivo, `practica-5` narrativo;
    - todos con 8-10 preguntas de los tres tipos y opciones sin pistas de longitud ni de posición (ya lo verifica el test de contenido).
  - `retention.ts`:
    - `RETENTION_DELAYS = [1, 7] as const`, `RETENTION_WINDOW_DAYS = 3`, `RETENTION_QUESTIONS = 5`
    - `pendingRetention(now: number): Promise<{ sessionId: number; textId: string; delayDays: 1 | 7; dueAt: number }[]>`: cuestionarios no diferidos de textos `diagnostico` o `retest`, con `at + delay ≤ now < at + delay + ventana` y sin un resultado diferido con ese `delayDays`.
    - `retentionQuestions(text: PracticeText): Question[]`: las 5 primeras por id.
    - `saveRetention(sessionId: number, textId: string, delayDays: 1 | 7, answers: number[]): Promise<void>` (`deferred: true`).
  - **RetentionCheck:** lista los pendientes. Cada uno abre el `Quiz` con las 5 preguntas, guarda el resultado y muestra el % de retención frente al % inmediato.
  - **DiagnosticPage:** el texto se elige entre los de rol `diagnostico` (sin cambios visibles).

- [ ] **Step 1: Tests que fallan**

```ts
// content: hay 12 textos; 4 retest expositivos; roles válidos
// retention: cuestionario a t0 → pendingRetention(t0 + 23h) vacío; (t0 + 25h) incluye delayDays 1;
//            (t0 + 5 días) vacío para 1 (ventana vencida) ; (t0 + 7 días + 1h) incluye delayDays 7
// retention: tras saveRetention(…, 1, …) ya no aparece el de 1 día
// RetentionCheck: responder 5 preguntas → muestra "Retención: X %" y "Inmediata: Y %"
```

- [ ] **Step 2: Ejecutar** → FAIL.
- [ ] **Step 3: Implementar la retención** y escribir los textos `retest-1..4`. Commit `content: textos de re-test`.
- [ ] **Step 4: Escribir `practica-1..5`** → PASS. Commit y push: `feat: retención diferida a 24 h y 7 días; 12 textos de práctica`.

---

### Task 7: Reglas de progresión del marcapasos

**Files:**
- Create: `src/lib/progression.ts` (+ test)

**Interfaces:**
- Produces: `suggestPacerWpm(history: { textKind: TextKind; comp: number; at: number }[], kind: TextKind, current: number): number`. Toma las 2 lecturas más recientes de ese tipo:
  - ambas < 0,70 → ×0,90;
  - ambas ≥ 0,80 → ×1,05;
  - en otro caso, sin cambio.
  
  El resultado se limita a 100-800 y se redondea a 10. Sin historial suficiente, devuelve `current`.
- Produces: `comprehensionHistory(): Promise<{ textKind: TextKind; comp: number; at: number }[]>` (de `listSessions`, solo con cuestionario no diferido).

- [ ] **Step 1: Tests que fallan**

```ts
expect(suggestPacerWpm([{ textKind: 'expositivo', comp: 0.6, at: 1 }, { textKind: 'expositivo', comp: 0.5, at: 2 }], 'expositivo', 300)).toBe(270)
expect(suggestPacerWpm([{ textKind: 'expositivo', comp: 0.9, at: 1 }, { textKind: 'expositivo', comp: 0.8, at: 2 }], 'expositivo', 300)).toBe(320) // 315 → 320
expect(suggestPacerWpm([{ textKind: 'denso', comp: 0.9, at: 1 }], 'denso', 300)).toBe(300)
expect(suggestPacerWpm([{ textKind: 'narrativo', comp: 0.5, at: 1 }, { textKind: 'narrativo', comp: 0.5, at: 2 }], 'narrativo', 105)).toBe(100)
```

- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: reglas de progresión del marcapasos según comprensión`

---

### Task 8: Motor del programa

**Files:**
- Create: `src/content/programa/dias.json`, `src/content/programa/index.ts`, `src/lib/program.ts` (+ test)

**Interfaces:**
- Produces:
  - `type ExerciseSpec = { type: 'atencion'; minutes: 2 | 5 | 10 } | { type: 'enfoque' } | { type: 'hojeo'; textId: string; seconds: number } | { type: 'preguntas'; count: number } | { type: 'escaneo'; textId: string } | { type: 'mapa' } | { type: 'explicar'; seconds: number } | { type: 'fichas'; count: number } | { type: 'repaso' } | { type: 'esquema' } | { type: 'ninguno' }`
  - `type ReadingSpec = { type: 'diagnostico' } | { type: 'texto'; textId: string; pacer?: boolean } | { type: 'retest'; textId: string } | { type: 'propio'; pacer?: boolean; minMinutes?: number }`
  - `interface DayPlan { day: number; title: string; exercise: ExerciseSpec; reading: ReadingSpec }`
  - Asignación de días (`dias.json`, títulos de `docs/PROGRAMA.md`):

    | Día | Ejercicio | Lectura |
    | :--- | :--- | :--- |
    | 1 | ninguno | diagnóstico |
    | 2 | atención 2 min | `practica-1` |
    | 3 | atención 5 min | `practica-2` |
    | 4 | enfoque | `practica-3` |
    | 5 | hojeo `practica-4` 90 s | `practica-4` |
    | 6 | preguntas 3 | `practica-5` |
    | 7 | ninguno | re-test `retest-1` |
    | 8 | atención 2 min | propio |
    | 9 | ninguno | propio con marcapasos |
    | 10 | hojeo `practica-2` 60 s | propio |
    | 11 | escaneo `practica-2` | propio |
    | 12 | enfoque | propio |
    | 13 | fichas 3 | propio |
    | 14 | ninguno | re-test `retest-2` |
    | 15 | mapa | propio |
    | 16 | preguntas 3 | `practica-3` |
    | 17 | enfoque | propio |
    | 18 | fichas 3 | propio |
    | 19 | mapa | propio |
    | 20 | atención 5 min | `practica-3` con marcapasos |
    | 21 | ninguno | re-test `retest-3` |
    | 22 | fichas 5 | propio |
    | 23 | repaso | propio |
    | 24 | explicar 60 s | propio |
    | 25 | mapa | propio |
    | 26 | esquema | propio |
    | 27 | enfoque | propio, `minMinutes: 30` |
    | 28 | ninguno | re-test `retest-4` |
  - `currentDay(days: ProgramDay[]): number | 'mantenimiento'`: el primer día sin `completedAt`, empezando por 1; tras completar el 28, `'mantenimiento'`.
  - `stepsFor(plan: DayPlan): ('lesson' | 'exercise' | 'reading')[]`: omite `exercise` si su tipo es `ninguno`.
  - `isDayComplete(plan: DayPlan, progress: ProgramDay): boolean`
  - `ownReadingDone(progress: ProgramDay, sessions: ReadingSession[], minMinutes?: number): boolean`: hay una sesión `documento`, `fisico` o `libre` con `startedAt ≥ progress.startedAt` (y `activeMs ≥ minMinutes` si se indica).
  - `maintenancePlan(dueCards: number): { review: boolean; attentionMinutes: 5; reading: 'propio' }`

- [ ] **Step 1: Tests que fallan**

```ts
// dias.json: 28 días 1..28; textId referenciados existen en getPracticeTexts(); re-tests en 7, 14, 21, 28
// currentDay([]) === 1; con días 1-3 completos === 4; con 28 completos === 'mantenimiento'
// stepsFor(día 1) === ['lesson', 'reading']
// isDayComplete: falta el paso de lectura → false; todos → true
// ownReadingDone: sesión anterior al inicio del día → false; posterior → true; día 27 con 10 min y minMinutes 30 → false
```

- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `feat: motor del programa de 28 días`

---

### Task 9: Pantalla del día y ejercicios

**Files:**
- Create: `src/features/programa/ProgramPage.tsx` (+ test), `src/features/programa/DayView.tsx`, `src/features/programa/LessonStep.tsx`, `src/features/programa/ExerciseStep.tsx`, `src/features/programa/ReadingStep.tsx`, `src/features/programa/exercises/{Skim,Scan,Questions,ConceptMap,Explain,MakeCards,Outline}.tsx` (+ tests de los no triviales), `src/features/diagnostico/TextTestFlow.tsx`
- Modify: `DiagnosticPage.tsx` (usa `TextTestFlow`), rutas (`/programa`, `/programa/dia/:day`), `Layout.tsx` (nav «Programa»), `HomePage.tsx`, `src/i18n/es.ts`

**Interfaces:**
- Produces:
  - **`TextTestFlow`** (`{ text: PracticeText; role: 'diagnostico' | 'retest' | 'practica'; pacerWpm?: number; now?: Clock; onDone(r: { sessionId?: number; comp: number }): void }`): propósito → lectura (`ReadingView`) → cuestionario → resultados → **recuerdo libre**. El recuerdo es un campo «¿Qué ideas recuerdas?» que se guarda en `session.recall`, con «Crear ficha» opcional. `DiagnosticPage` pasa a usarlo sin cambios de comportamiento: sus tests siguen en verde.
  - **ProgramPage:** día actual, lista de los 28 días con estado (completado, actual, pendiente) y un botón para empezar o continuar el día. En modo mantenimiento muestra: fichas pendientes, atención 5 min y una lectura propia.
  - **DayView:** `startDay(day)` al entrar; muestra los pasos en orden con su duración orientativa y ✓ los completados; al completar el último, `completeDay` y una pantalla «Día N completado» con el siguiente.
  - **LessonStep:** `renderMarkdown(getLesson(day).body)` + «Hecho».
  - **ExerciseStep**, según el tipo:
    - `atencion` → `BreathingSession`;
    - `enfoque` → `FocusChecklist`;
    - `hojeo` → el texto visible durante `seconds`, luego se oculta y se escriben 3 ideas principales;
    - `preguntas` → escribir `count` preguntas antes de leer (se muestran durante la lectura del día);
    - `escaneo` → se muestran primero 3 preguntas literales del texto, se busca la respuesta con el texto visible y temporizador, y se elige la opción;
    - `mapa` → tres campos (idea central, argumentos, ejemplos) que se guardan como nota `idea` de la fuente leída ese día o sin fuente;
    - `explicar` → temporizador de `seconds` para explicar en voz alta y una autoevaluación (¿pude explicarlo sin mirar?);
    - `fichas` → crear `count` fichas con `CardForm`;
    - `repaso` → `ReviewPage` embebida;
    - `esquema` → título, tesis y 3-5 secciones con fichas o notas, guardado como nota `idea` (el proyecto completo llega en la fase 4).
  - **ReadingStep:**
    - `diagnostico` / `texto` / `retest` → `TextTestFlow` (marcapasos con `suggestPacerWpm` cuando `pacer`);
    - `propio` → botones «Abrir mi biblioteca», «Libro físico» y «Pegar un texto», más «Ya leí» habilitado solo si `ownReadingDone`;
    - si la biblioteca está vacía, explica cómo añadir un documento o usar el libro físico.

- [ ] **Step 1: Tests que fallan**

```ts
// ProgramPage: sin progreso → "Día 1"; botón empieza el día 1
// DayView día 2 (now controlado): lección Hecho → atención 2 min (avanzar tiempo) → lectura practica-1 completa (responder cuestionario) → recuerdo → "Día 2 completado"; getProgramDays() día 2 con completedAt
// DayView: salir a mitad (desmontar) y volver → la lección sigue marcada, continúa en el ejercicio
// ReadingStep propio: sin sesiones posteriores → «Ya leí» deshabilitado; tras crear una sesión libre → habilitado
// ReadingStep propio con biblioteca vacía → muestra t('program.emptyLibrary') con enlaces
// Skim: tras `seconds` el texto se oculta y aparecen 3 campos
// DiagnosticPage: sus tests existentes siguen pasando
```

- [ ] **Step 2-4:** FAIL → implementar → PASS (`npm test && npm run lint && npm run build`).
- [ ] **Step 5: Commit y push** — `feat: programa de 28 días: pantalla del día, ejercicios y recuerdo libre`

---

### Task 10: Pendientes de la fase 2

**Files:**
- Modify:
  - `ImportPage.tsx`: pestañas accesibles (`tabpanel`, flechas izquierda/derecha, `aria-controls`); «Libro físico» pasa a ser un enlace, no una pestaña;
  - `PdfPageDialog.tsx`: foco atrapado, retorno del foco, fondo inerte, `aria-label` del canvas con «Página N del PDF original»;
  - `DocumentReaderPage.tsx`: el panel de notas queda dentro del contenedor inerte; la selección colapsada limpia la barra y el aviso;
  - `AnnotationBar.tsx`: `role="region"` con etiqueta;
  - `src/index.css`: nuevo token `--field-line` con contraste ≥ 3:1 sobre `surface` para bordes de campos, aplicado a inputs, selects y textareas;
  - `PhysicalSessionPage.tsx`: aviso si se leen más de 100 páginas en una sesión o la velocidad resultante supera 1000 ppm, con «Revisar» o «Guardar igual»; botón «Volver a estimar» palabras por página;
  - `epub.ts`/`pdf.ts`: títulos de respaldo vía `t()`;
  - `routes.tsx`: `ImportPage` y `DocumentReaderPage` con `lazy()`, lo que saca JSZip/Readability/pdfjs del chunk principal.
- Tests: extender los existentes; `theme-contrast.test.ts` exige `field-line` vs `surface` ≥ 3 en los tres temas.

- [ ] **Step 1-4:** FAIL → implementar → PASS (`npm test && npm run lint && npm run build`; el chunk principal debe bajar de 645 KB).
- [ ] **Step 5: Commit y push** — `fix: accesibilidad, validaciones y carga diferida pendientes de la fase 2`

---

### Task 11: Criterio de salida (e2e), documentación y publicación

**Files:**
- Create: `tests/e2e/fase3.spec.ts`
- Modify: `docs/PLANO.md`, `README.md`, `DESCRIPTION.md`

- [ ] **Step 1: e2e** (`fase3.spec.ts`):
  1. Días 1-7 completos de principio a fin: lecciones «Hecho»; ejercicios de atención de 2 y 5 min con reloj real reducido mediante «Terminar antes»; lecturas con 6 s y cuestionario; re-test del día 7.
  2. Crear una ficha desde el lector, repasarla en `/repasar` y ver «Repaso completado».
  3. Recargar a mitad del día 3 conserva los pasos hechos.
  4. Retención: con el reloj del navegador adelantado 25 h (`page.clock`), aparece el cuestionario de 24 h del diagnóstico.
- [ ] **Step 2:** `npm run e2e` → PASS.
- [ ] **Step 3: Documentación:** fase 3 completada en `PLANO.md`; README y DESCRIPTION describen el programa, la repetición espaciada y la atención como disponibles.
- [ ] **Step 4: Verificación final:** `npm run lint && npm test && npm run build && npm run e2e`.
- [ ] **Step 5: Commit y push** — `feat: criterio de salida de la fase 3 (e2e) y documentación`
