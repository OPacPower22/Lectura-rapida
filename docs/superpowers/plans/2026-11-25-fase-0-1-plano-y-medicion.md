# Fases 0 y 1 — Plano y medición: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar la documentación alineada con el diseño aprobado y entregar una PWA que funcione sin conexión, donde el usuario hace el diagnóstico completo y ve ppm, comprensión, ILE y divagación, además de medir textos pegados y consultar su historial.

**Architecture:** PWA *local-first* sin servidor. Lógica pura y testeable en `src/lib/` (texto, métricas, tiempo, sondeos, almacenamiento); pantallas en `src/features/<módulo>/`; contenido como datos en `src/content/`; textos de interfaz en `src/i18n/es.ts`. Datos en IndexedDB vía Dexie.

**Tech Stack:** Node ≥ 20, npm, Vite, React, TypeScript (strict), Tailwind CSS, react-router-dom (HashRouter), Dexie, vite-plugin-pwa, Vitest + Testing Library + fake-indexeddb, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-25-lectura-rapida-design.md` (aprobado). Leer secciones 3, 4, 7.2, 7.3, 7.5, 8, 8 bis y 9 antes de empezar.

## Global Constraints

- Interfaz y contenido en **español**; ningún texto visible escrito en componentes: todo sale de `src/i18n/es.ts` vía `t()`.
- Identificadores de código en inglés; textos de commit en español con Conventional Commits.
- Todo registro de lectura, texto y contenido lleva `lang` (BCP 47). Ninguna lógica asume `es`.
- Conteo de palabras **solo** con `countWords()` (basado en `Intl.Segmenter`).
- Nunca mostrar una meta de ppm. La referencia permitida es: "media adulta ≈ 238 ppm en no ficción (Brysbaert, 2019; datos en inglés)".
- ILE solo se calcula con comprensión objetiva (cuestionario), nunca con texto pegado.
- Etiqueta "hojeo" cuando ppm > 600 y comprensión < 60 %.
- Sin RSVP, sin tablas de Schulte, sin ejercicios para "eliminar la subvocalización".
- Accesible con teclado; contraste AA; controles con nombre accesible.
- Vite `base: '/Lectura-rapida/'`; enrutado con `HashRouter` (GitHub Pages no reescribe rutas).
- Repositorio público: solo contenido propio o de dominio público (autor fallecido hace más de 100 años).
- Commit **y push** a `claude/fervent-dirac-u5fdme` al cerrar cada tarea.

## Review Focus

1. **El usuario cambia de pestaña o se bloquea la pantalla a mitad de la lectura** → el cronómetro se pausa y ese tiempo no cuenta (test en Tarea 6).
2. **"Terminé" pulsado a los pocos segundos** → ppm `null`, mensaje "tiempo demasiado corto para medir", sin ILE (tests en Tareas 2 y 7).
3. **Texto pegado vacío, solo espacios o enorme (50 000 palabras)** → no se puede empezar con texto vacío; el texto enorme se cuenta bien (tests en Tareas 2 y 8).
4. **Almacenamiento no disponible o persistencia denegada** (modo privado, iOS) → la app sigue funcionando, muestra aviso, y si guardar falla los resultados se muestran igual con un mensaje de error (tests en Tareas 4 y 7).
5. **Sin conexión tras la primera visita** → la app carga y el diagnóstico se completa (e2e en Tarea 9).

---

### Task 1: Fase 0 — Documentación alineada con el diseño

**Files:**
- Create: `docs/METODO.md`, `docs/PROGRAMA.md`, `docs/PLANO.md`, `LICENSE`, `.gitignore`
- Modify: `README.md`, `DESCRIPTION.md`
- Delete: `PLANO.md`, `METODO.md`, `CURRICULO.md` (raíz)

**Interfaces:**
- Produces: `docs/PLANO.md` como índice del proyecto (enlaza diseño y planes; tabla de fases con estado).

- [ ] **Step 1: Escribir `docs/METODO.md`** a partir de las secciones 4 y 5 del diseño: qué funciona y qué no (con las tablas 4.1-4.3), L.E.E.R.+R. con duraciones, reglas de progresión y lista de referencias completas.
- [ ] **Step 2: Escribir `docs/PROGRAMA.md`** con los 28 días de la sección 6: estructura diaria, una línea de objetivo por día y modo mantenimiento.
- [ ] **Step 3: Escribir `docs/PLANO.md`**: propósito en 3 líneas, enlaces al diseño y a este plan, tabla de fases 0-6 de la sección 10 con columna "Estado" (Fase 0: en curso; resto: pendiente).
- [ ] **Step 4: Reescribir `README.md`**:
  - badges con sintaxis `![..](https://img.shields.io/...)`;
  - promesa honesta (sin "600+ ppm", sin RSVP ni Schulte);
  - qué incluye según la sección 7;
  - URL real `https://github.com/OPacPower22/Lectura-rapida.git` y scripts `npm` (`dev`, `build`, `preview`, `test`, `lint`, `e2e`);
  - estructura de carpetas de la sección 9;
  - roadmap enlazando `docs/PLANO.md`.
- [ ] **Step 5: Actualizar `DESCRIPTION.md`** con la misma promesa honesta y los temas de etiqueta. Crear `LICENSE` (MIT, `Copyright (c) 2026 OPacPower22`). Crear `.gitignore` con `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`, `.DS_Store`. Borrar `PLANO.md`, `METODO.md` y `CURRICULO.md` de la raíz.
- [ ] **Step 6: Verificar**

Run: `grep -rnE "600\+|1000 ppm|RSVP|Schulte" README.md DESCRIPTION.md; ls *.md`
Expected: las únicas coincidencias de RSVP/Schulte están en la frase que explica que no se incluyen; ninguna de `600+`; `ls` muestra solo `DESCRIPTION.md README.md`.

- [ ] **Step 7: Commit y push**

```bash
git add -A && git commit -m "docs: fase 0 — documentos en docs/, README y descripción alineados con el diseño" && git push
```

---

### Task 2: Esqueleto del proyecto, i18n, texto y métricas

**Files:**
- Create: proyecto Vite React-TS en la raíz (`package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`, `src/index.css`), `eslint.config.js`, `src/test/setup.ts`

> Nota de ejecución: se usó **oxlint** (`.oxlintrc.json`), que trae la plantilla actual de Vite, en lugar de ESLint.
- Create: `src/i18n/es.ts`, `src/i18n/index.ts`, `src/i18n/index.test.ts`
- Create: `src/lib/text.ts`, `src/lib/text.test.ts`, `src/lib/metrics.ts`, `src/lib/metrics.test.ts`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces:
  - `t(key: MessageKey, params?: Record<string, string | number>): string`; `type MessageKey = keyof typeof es`; interpolación `{nombre}`.
  - `countWords(text: string, lang: string): number`; `splitParagraphs(text: string): string[]`
  - `MIN_ACTIVE_MS = 5000`
  - `computeWpm(words: number, activeMs: number): number | null`
  - `comprehension(correct: number, total: number): number` (0-1)
  - `ile(wpm: number, comp: number): number`
  - `classifyReading(wpm: number, comp: number): 'lectura' | 'hojeo'`
  - `type ProbeAnswer = 'texto' | 'otra-cosa' | 'no-se' | 'auto'`
  - `mindWanderingRate(answers: ProbeAnswer[]): number | null`
  - `selfCaughtPer10Min(autoCount: number, activeMs: number): number | null`

- [ ] **Step 1: Crear el proyecto e instalar dependencias**

Run: `npm create vite@latest . -- --template react-ts` (conservar los `.md` existentes), luego instalar `tailwindcss` (con su plugin de Vite), `react-router-dom`, `dexie`, y de desarrollo `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `fake-indexeddb`.
Configurar: `base: '/Lectura-rapida/'`; Vitest con `environment: 'jsdom'` y `setupFiles: ['src/test/setup.ts']`, que importa `@testing-library/jest-dom/vitest` y `fake-indexeddb/auto`; TypeScript `strict: true`; scripts `dev`, `build` (`tsc -b && vite build`), `preview`, `test` (`vitest run`), `lint`.

- [ ] **Step 2: Escribir los tests que fallan**

```ts
// src/i18n/index.test.ts
expect(t('app.title')).toBe('Lectura Rápida');
expect(t('results.wpm', { wpm: 250 })).toBe('250 ppm');

// src/lib/text.test.ts
expect(countWords('Hola, ¿cómo estás?', 'es')).toBe(3);
expect(countWords('El año 2025 fue bueno.', 'es')).toBe(5);
expect(countWords('', 'es')).toBe(0);
expect(countWords('   \n\t ', 'es')).toBe(0);
expect(countWords('我喜欢读书', 'zh')).toBeGreaterThanOrEqual(2);
expect(countWords('palabra '.repeat(50000), 'es')).toBe(50000);
expect(splitParagraphs('Uno.\n\n\nDos.\n  \nTres.')).toEqual(['Uno.', 'Dos.', 'Tres.']);

// src/lib/metrics.test.ts
expect(computeWpm(600, 180000)).toBe(200);
expect(computeWpm(250, 60000)).toBe(250);
expect(computeWpm(100, 4999)).toBeNull();
expect(computeWpm(0, 60000)).toBeNull();
expect(comprehension(7, 10)).toBe(0.7);
expect(() => comprehension(1, 0)).toThrow(RangeError);
expect(ile(300, 0.8)).toBe(240);
expect(classifyReading(650, 0.5)).toBe('hojeo');
expect(classifyReading(650, 0.6)).toBe('lectura');
expect(classifyReading(600, 0.3)).toBe('lectura');
expect(mindWanderingRate(['texto', 'otra-cosa', 'no-se', 'auto'])).toBeCloseTo(2 / 3);
expect(mindWanderingRate(['auto'])).toBeNull();
expect(selfCaughtPer10Min(2, 600000)).toBe(2);
expect(selfCaughtPer10Min(1, 300000)).toBe(2);
expect(selfCaughtPer10Min(1, 1000)).toBeNull();
```

- [ ] **Step 3: Ejecutar y ver que fallan**

Run: `npm test` → Expected: FAIL (módulos inexistentes).

- [ ] **Step 4: Implementar** `src/i18n/*` (objeto `es` `as const` con claves por pantalla, por ejemplo `app.title`, `results.wpm`), `src/lib/text.ts` (`Intl.Segmenter(lang, { granularity: 'word' })`, cuenta `isWordLike`) y `src/lib/metrics.ts`:
  - `computeWpm` redondea a entero y devuelve `null` si `words <= 0` o `activeMs < MIN_ACTIVE_MS`;
  - `ile` redondea a entero;
  - `mindWanderingRate` excluye `'auto'` del denominador y del numerador.
- [ ] **Step 5: Ejecutar y ver que pasan**

Run: `npm test && npm run lint && npm run build` → Expected: todo en verde.

- [ ] **Step 6: CI.** `.github/workflows/ci.yml` en `push` y `pull_request`: Node 22, `npm ci`, `npm run lint`, `npm test`, `npm run build`.
- [ ] **Step 7: Commit y push**

```bash
git add -A && git commit -m "feat: esqueleto PWA, i18n, conteo de palabras y métricas de lectura" && git push
```

---

### Task 3: Cronómetro de tiempo activo y sondeos de atención

**Files:**
- Create: `src/lib/stopwatch.ts`, `src/lib/stopwatch.test.ts`, `src/lib/probes.ts`, `src/lib/probes.test.ts`

**Interfaces:**
- Produces:
  - `type Clock = () => number`
  - `createStopwatch(now?: Clock): Stopwatch` con `Stopwatch = { start(): void; pause(): void; resume(): void; elapsedMs(): number; isRunning(): boolean }`. `now` por defecto es `performance.now`.
  - `type ProbeRange = { minMs: number; maxMs: number }`
  - `PROBE_RANGE_PROGRAMA: ProbeRange = { minMs: 120000, maxMs: 240000 }`
  - `PROBE_RANGE_DIAGNOSTICO: ProbeRange = { minMs: 45000, maxMs: 90000 }`
  - `nextProbeDelayMs(range: ProbeRange, rng?: () => number): number`

> Decisión del plan: el diseño pide 2-3 sondeos en el diagnóstico (3-4 min de lectura), lo que no cabe en el intervalo de 2-4 min del programa. Por eso el diagnóstico usa 45-90 s.

- [ ] **Step 1: Tests que fallan**

```ts
// stopwatch: reloj falso `let t = 0; const sw = createStopwatch(() => t);`
sw.start(); t = 1000; sw.pause(); t = 5000; sw.resume(); t = 6000;
expect(sw.elapsedMs()).toBe(2000);
sw.pause(); sw.pause(); t = 9000; expect(sw.elapsedMs()).toBe(2000); // pausa idempotente
sw.resume(); sw.resume(); t = 10000; expect(sw.elapsedMs()).toBe(3000); // resume idempotente
expect(createStopwatch(() => 0).elapsedMs()).toBe(0); // sin start

// probes
expect(nextProbeDelayMs(PROBE_RANGE_PROGRAMA, () => 0)).toBe(120000);
expect(nextProbeDelayMs(PROBE_RANGE_PROGRAMA, () => 0.5)).toBe(180000);
expect(nextProbeDelayMs(PROBE_RANGE_PROGRAMA, () => 0.99999)).toBeLessThan(240000);
expect(nextProbeDelayMs(PROBE_RANGE_DIAGNOSTICO, () => 0)).toBe(45000);
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL.
- [ ] **Step 3: Implementar** ambos módulos. `nextProbeDelayMs` = `Math.floor(min + rng() * (max - min))`.
- [ ] **Step 4: Ejecutar** `npm test` → PASS.
- [ ] **Step 5: Commit y push** — `feat: cronómetro de tiempo activo y programación de sondeos de atención`

---

### Task 4: Almacenamiento local (Dexie)

**Files:**
- Create: `src/lib/storage/db.ts`, `src/lib/storage/repo.ts`, `src/lib/storage/repo.test.ts`, `src/lib/storage/persist.ts`, `src/lib/storage/persist.test.ts`

**Interfaces:**
- Consumes: `ProbeAnswer` (Tarea 2), `TextKind` (definido aquí y reexportado por la Tarea 5).
- Produces:
  - `type TextKind = 'narrativo' | 'expositivo' | 'denso'`
  - `interface ReadingSession { id?: number; kind: 'diagnostico' | 'libre'; textId?: string; textKind?: TextKind; lang: string; startedAt: number; endedAt: number; activeMs: number; words: number; wpm: number | null }`
  - `interface ProbeRecord { id?: number; sessionId: number; at: number; answer: ProbeAnswer }`
  - `interface QuizResult { id?: number; sessionId: number; textId: string; answers: number[]; correct: number; total: number; deferred: boolean; at: number }`
  - `db`: Dexie con nombre `'lectura-rapida'`, versión 1. Tablas: `readingSessions: '++id, kind, textId, lang, startedAt'`, `probes: '++id, sessionId'`, `quizResults: '++id, sessionId, textId'`, `settings: 'key'`.
  - `saveSession(input: { session: Omit<ReadingSession,'id'>; probes: Omit<ProbeRecord,'id'|'sessionId'>[]; quiz?: Omit<QuizResult,'id'|'sessionId'> }): Promise<number>`. Escribe las tres tablas en una sola transacción y devuelve `sessionId`.
  - `interface SessionSummary { session: ReadingSession; quiz?: QuizResult; probes: ProbeRecord[] }`
  - `listSessions(): Promise<SessionSummary[]>` (más reciente primero)
  - `requestPersistentStorage(): Promise<boolean>`

- [ ] **Step 1: Tests que fallan** (usar `fake-indexeddb` del setup; limpiar con `db.delete()` + `db.open()` en `beforeEach`)

```ts
const id = await saveSession({ session: s1, probes: [{ at: 1, answer: 'texto' }], quiz: q1 });
const [row] = await listSessions();
expect(row.session.id).toBe(id);
expect(row.probes).toHaveLength(1);
expect(row.quiz?.correct).toBe(q1.correct);
// orden: s2 con startedAt mayor aparece primero
// sesión 'libre' sin quiz → row.quiz undefined
// persist.test: con navigator.storage undefined → false; con persist() → true devuelve true
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL.
- [ ] **Step 3: Implementar.** `requestPersistentStorage` devuelve `false` si falta `navigator.storage?.persist` o si lanza error.
- [ ] **Step 4: Ejecutar** `npm test` → PASS.
- [ ] **Step 5: Commit y push** — `feat: almacenamiento local de sesiones, sondeos y cuestionarios`

---

### Task 5: Contenido del diagnóstico (3 textos originales con preguntas)

**Files:**
- Create: `src/content/types.ts`, `src/content/index.ts`, `src/content/content.test.ts`
- Create: `src/content/textos/diag-narrativo.md` + `.json`, `diag-expositivo.md` + `.json`, `diag-denso.md` + `.json`

**Interfaces:**
- Produces:
  - `type QuestionType = 'literal' | 'inferencial' | 'idea-central'`
  - `interface Question { id: string; type: QuestionType; prompt: string; options: [string, string, string, string]; answerIndex: 0 | 1 | 2 | 3 }`
  - `interface PracticeText { id: string; lang: string; title: string; kind: TextKind; body: string; source: string; questions: Question[] }`
  - `getPracticeTexts(): PracticeText[]`, `getPracticeText(id: string): PracticeText | undefined`, `diagnosticTextFor(kind: TextKind): PracticeText`

- [ ] **Step 1: Test de validación que falla**

```ts
for (const t of getPracticeTexts()) {
  expect(t.lang).toBe('es');
  expect(countWords(t.body, t.lang)).toBeGreaterThanOrEqual(600);
  expect(countWords(t.body, t.lang)).toBeLessThanOrEqual(900);
  expect(t.questions.length).toBeGreaterThanOrEqual(8);
  expect(t.questions.length).toBeLessThanOrEqual(10);
  expect(new Set(t.questions.map(q => q.type))).toEqual(new Set(['literal', 'inferencial', 'idea-central']));
  expect(new Set(t.questions.map(q => q.id)).size).toBe(t.questions.length);
  expect(t.source.length).toBeGreaterThan(0);
}
for (const k of ['narrativo', 'expositivo', 'denso'] as const) expect(diagnosticTextFor(k).kind).toBe(k);
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL.
- [ ] **Step 3: Escribir los tres textos** (originales, `source: 'original'`, temas generales):
  - narrativo: un relato;
  - expositivo: divulgación de un tema de historia o ciencia;
  - denso: un ensayo filosófico o argumentativo.
  
  Cada uno lleva 8-10 preguntas de cuatro opciones con las tres clases de pregunta. Las respuestas deben depender del texto, no del sentido común. Implementar `index.ts` con `import.meta.glob` (`?raw` para `.md`, `import` para `.json`).
- [ ] **Step 4: Ejecutar** `npm test` → PASS.
- [ ] **Step 5: Commit y push** — `content: textos de diagnóstico narrativo, expositivo y denso con preguntas`

---

### Task 6: Vista de lectura con sondeos

**Files:**
- Create: `src/features/lector/ReadingView.tsx`, `src/features/lector/ReadingView.test.tsx`, `src/features/lector/ProbeDialog.tsx`

**Interfaces:**
- Consumes: `createStopwatch`, `Clock`, `nextProbeDelayMs`, `ProbeRange` (T3); `countWords`, `splitParagraphs`, `ProbeAnswer`, `t` (T2).
- Produces:
  - `interface ReadingOutcome { startedAt: number; endedAt: number; activeMs: number; words: number; probes: { at: number; answer: ProbeAnswer }[] }`
  - `ReadingView(props: { title: string; body: string; lang: string; probeRange: ProbeRange; onFinish: (o: ReadingOutcome) => void; now?: Clock; rng?: () => number })`

Comportamiento:
- El texto está oculto hasta pulsar "Empezar", que arranca el cronómetro.
- "Me distraje" registra `'auto'`.
- Al vencer el retraso se abre `ProbeDialog` ("¿Dónde estaba tu atención?": En el texto / En otra cosa / No sé). Mientras está abierto, el cronómetro se pausa. Al responder se reanuda y se programa el siguiente sondeo.
- `visibilitychange` a `hidden` pausa el cronómetro; volver a `visible` lo reanuda, salvo que el diálogo esté abierto.
- Botones A−/A+ para el tamaño de letra.
- "Terminé" llama a `onFinish`. `startedAt` y `endedAt` usan `Date.now()`.

- [ ] **Step 1: Tests que fallan** (fake timers de Vitest; `now` controlado; `rng = () => 0`)

```ts
// 1. el cuerpo no está en el documento antes de "Empezar"
// 2. avanzar 45000 ms con PROBE_RANGE_DIAGNOSTICO → aparece el diálogo por rol 'dialog'; elegir "En el texto" lo cierra
// 3. ocultar documento (Object.defineProperty(document,'visibilityState',{value:'hidden'}) + dispatch 'visibilitychange'),
//    avanzar now 10000, volver a visible, avanzar 2000, "Terminé" → onFinish recibe activeMs === 2000 + tiempo previo a ocultar
// 4. "Me distraje" y luego "Terminé" → probes contiene { answer: 'auto' }
// 5. words === countWords(body, lang)
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL.
- [ ] **Step 3: Implementar.** Párrafos con `splitParagraphs`; diálogo con `role="dialog"` y foco inicial en la primera opción.
- [ ] **Step 4: Ejecutar** `npm test` → PASS.
- [ ] **Step 5: Commit y push** — `feat: vista de lectura con cronómetro activo y sondeos de atención`

---

### Task 7: Flujo de diagnóstico: cuestionario, resultados y guardado

**Files:**
- Create: `src/features/diagnostico/Quiz.tsx`, `Quiz.test.tsx`, `ResultsCard.tsx`, `ResultsCard.test.tsx`, `DiagnosticPage.tsx`, `DiagnosticPage.test.tsx`

**Interfaces:**
- Consumes: `ReadingView`, `ReadingOutcome` (T6); `diagnosticTextFor`, `Question` (T5); `saveSession` (T4); funciones de métricas (T2).
- Produces:
  - `Quiz(props: { questions: Question[]; onSubmit: (answers: number[]) => void })`
  - `interface ResultsData { wpm: number | null; comp: number | null; ileValue: number | null; label: 'lectura' | 'hojeo' | null; wanderingRate: number | null; selfCaught: number | null }`
  - `ResultsCard(props: { data: ResultsData; saveError?: boolean })`
  - `DiagnosticPage()`: pasos intro → propósito → lectura → cuestionario → resultados. En la intro se elige el tipo de texto (por defecto `expositivo`). El paso de propósito es un campo opcional "¿Qué pregunta debería responder este texto?". La lectura usa `PROBE_RANGE_DIAGNOSTICO`.

- [ ] **Step 1: Tests que fallan**

```ts
// Quiz: botón "Enviar" deshabilitado hasta responder todas; onSubmit recibe [índices] en orden
// ResultsCard: wpm null → muestra t('results.tooShort') y no muestra ILE
// ResultsCard: label 'hojeo' → muestra t('results.skimming')
// ResultsCard: siempre muestra la referencia 238 ppm (Brysbaert, 2019) y nunca un objetivo
// DiagnosticPage (fake-indexeddb, now controlado): completar el flujo con 50 % de aciertos
//   → muestra "50 %"; listSessions() tiene 1 sesión kind 'diagnostico' con quiz
// DiagnosticPage con saveSession que rechaza (vi.mock) → resultados visibles + t('results.saveError')
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL.
- [ ] **Step 3: Implementar.** Cuestionario con `fieldset`/`legend` y radios. `ResultsData` se calcula con las funciones de T2; ILE y etiqueta solo si `wpm !== null`.
- [ ] **Step 4: Ejecutar** `npm test` → PASS.
- [ ] **Step 5: Commit y push** — `feat: diagnóstico completo con cuestionario, resultados y guardado local`

---

### Task 8: Lectura de texto pegado, historial, inicio y navegación

**Files:**
- Create: `src/app/App.tsx`, `src/app/Layout.tsx`, `src/features/inicio/HomePage.tsx`, `src/features/lector/PasteReadPage.tsx`, `PasteReadPage.test.tsx`, `src/features/progreso/HistoryPage.tsx`, `HistoryPage.test.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: T2, T4, T6, T7.
- Produces: rutas `HashRouter`: `/` (HomePage), `/diagnostico`, `/leer`, `/progreso`.

Comportamiento:
- **HomePage:** si no hay ningún diagnóstico, destaca "Haz tu diagnóstico". Si `requestPersistentStorage()` devuelve `false`, muestra el aviso `t('storage.notPersistent')`.
- **PasteReadPage:**
  - campo de título opcional y área de texto;
  - selector de idioma (`es`, `en`, `fr`, `pt`, `it`, `de`; por defecto `es`);
  - "Empezar" deshabilitado si `countWords === 0`;
  - usa `ReadingView` con `PROBE_RANGE_PROGRAMA`;
  - guarda la sesión como `kind: 'libre'` y muestra ppm y divagación, sin comprensión ni ILE.
- **HistoryPage:** tabla de la más reciente a la más antigua: fecha, tipo, idioma, ppm, comprensión, ILE y divagación (las celdas vacías muestran "—").

- [ ] **Step 1: Tests que fallan**

```ts
// PasteReadPage: con '   ' el botón Empezar está deshabilitado; con 'hola mundo' habilitado
// PasteReadPage: idioma 'en' → la sesión guardada tiene lang 'en'
// HistoryPage: dos sesiones guardadas → dos filas, la más reciente primero; sesión libre muestra "—" en ILE
```

- [ ] **Step 2: Ejecutar** `npm test` → FAIL.
- [ ] **Step 3: Implementar.** Navegación accesible con `nav` y enlace activo marcado (`aria-current`).
- [ ] **Step 4: Ejecutar** `npm test && npm run build` → PASS.
- [ ] **Step 5: Commit y push** — `feat: lectura de texto pegado, historial e inicio`

---

### Task 9: PWA sin conexión, prueba e2e y despliegue

**Files:**
- Create: `public/icons/icon.svg`, `pwa-assets.config.ts`, `playwright.config.ts`, `tests/e2e/diagnostico-offline.spec.ts`, `.github/workflows/deploy.yml`
- Modify: `vite.config.ts`, `package.json`, `.github/workflows/ci.yml`, `docs/PLANO.md`

**Interfaces:**
- Consumes: la app completa (T8).

- [ ] **Step 1: PWA.** Configurar `vite-plugin-pwa`:
  - `registerType: 'autoUpdate'`;
  - manifest `name: 'Lectura Rápida'`, `short_name: 'Lectura'`, `lang: 'es'`, `start_url` y `scope` `'/Lectura-rapida/'`, `display: 'standalone'`;
  - precache de todos los recursos del build.
  
  Iconos 192 y 512 generados desde `icon.svg` con `@vite-pwa/assets-generator` (script `npm run icons`, PNG versionados).
- [ ] **Step 2: Test e2e que falla** (`tests/e2e/diagnostico-offline.spec.ts`):
  1. Visitar la app y esperar `navigator.serviceWorker.ready`.
  2. `context.setOffline(true)` y recargar.
  3. Completar el diagnóstico: Empezar, esperar 6 s, Terminé, responder todas las preguntas.
  4. Esperar el texto "ppm".
  5. Ir a Progreso y comprobar que hay 1 fila.
  
  `playwright.config.ts` usa `webServer: 'npm run build && npm run preview -- --port 4173'` y `baseURL: 'http://localhost:4173/Lectura-rapida/'`. Script `e2e`: `playwright test --trace off`. Si la versión de `@playwright/test` no coincide con el Chromium preinstalado, usar `launchOptions.executablePath: process.env.PW_CHROMIUM_PATH` (local: `/opt/pw-browsers/chromium`).
- [ ] **Step 3: Ejecutar** `npm run e2e` → FAIL antes del paso 1; PASS después.
- [ ] **Step 4: CI y despliegue.**
  - En `ci.yml`, añadir el job e2e: `npx playwright install --with-deps chromium` y `npm run e2e`.
  - `deploy.yml` se ejecuta en `push` a `main`: `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact` (`dist`), `actions/deploy-pages`.
  - Activar GitHub Pages (fuente: GitHub Actions) requiere confirmación del propietario. Pedirla antes de llamar a la API.
- [ ] **Step 5: Verificación final**

Run: `npm run lint && npm test && npm run build && npm run e2e`
Expected: todo en verde. Criterio de salida de la Fase 1: diagnóstico completo sin conexión con ppm, comprensión, ILE y divagación visibles.

- [ ] **Step 6: Actualizar `docs/PLANO.md`** (Fases 0 y 1: completadas). **Commit y push** — `feat: PWA instalable sin conexión, e2e del diagnóstico y despliegue en GitHub Pages`
