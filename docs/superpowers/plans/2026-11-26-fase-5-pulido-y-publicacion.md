# Fase 5 — Pulido y publicación: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la app sea accesible (teclado, contraste AA, lector de pantalla), rápida (Lighthouse ≥ 90 en rendimiento, accesibilidad, buenas prácticas y SEO) e instalable desde la URL pública, usable sin conexión. Además, se resuelven los pendientes menores de la fase 4.

**Architecture:**
- **Auditorías automáticas como pruebas:**
  - axe-core en Playwright: todas las pantallas, en los tres temas;
  - Lighthouse por script, contra la compilación de producción;
  - instalabilidad comprobada con el protocolo de Chrome.
- **Arreglos guiados por los resultados.** Cada problema que encuentren las auditorías se arregla con una prueba.
- **Sin cambios en el modelo de datos.**

**Tech Stack:** el de las fases anteriores + `@axe-core/playwright` 4.x y `lighthouse` 13.x (solo desarrollo).

**Spec:** `docs/superpowers/specs/2026-11-25-lectura-rapida-design.md`
- §10, fila 5: accesibilidad (teclado, contraste AA, lector de pantalla), rendimiento (Lighthouse ≥ 90) y despliegue.
- Criterio de salida: «App instalable desde la URL pública y usable sin conexión».

## Global Constraints

- Todo lo de fases anteriores sigue vigente: textos vía `t()`, colores semánticos, AA, datos solo en el dispositivo, sin metas de ppm.
- **WCAG 2.2 AA como mínimo:**
  - sin violaciones de axe de impacto *serious* o *critical* en ninguna pantalla ni tema;
  - las de impacto *moderate* o *minor* se arreglan o se justifican en el registro.
- **Lighthouse en móvil** (perfil por defecto) sobre `vite preview`: las cuatro categorías ≥ 90.
- **Herramientas de auditoría** solo como dependencias de desarrollo, con versión exacta.
- Commit y push al cerrar cada tarea, **solo si la verificación termina con código 0**.

## Review Focus

1. **Navegar solo con teclado** por un flujo completo: inicio → diagnóstico → resultados → progreso. Foco visible siempre, sin trampas de foco, y foco en el `h1` al cambiar de página.
2. **Lector de pantalla:**
  - títulos de página únicos (`document.title`);
  - regiones con nombre;
  - anuncios `aria-live` sin duplicados;
  - diálogos (sondeo, página del PDF) con foco atrapado y devuelto.
3. **Temas oscuro y sepia:** el contraste AA se mantiene en textos atenuados, bordes de controles y foco.
4. **Primera carga en móvil lento:** el paquete inicial no crece; lo pesado (pdfjs, docx, JSZip, lecciones) sigue bajo demanda.
5. **Instalación y modo sin conexión:**
  - manifiesto válido;
  - iconos *maskable*;
  - el service worker sirve todas las rutas sin red, incluidas las nuevas de la fase 4.

---

### Task 1: Auditoría de accesibilidad automática (axe) y arreglos

**Files:**
- Create: `tests/e2e/a11y.spec.ts`, `tests/e2e/seed.ts` (datos de ejemplo vía IndexedDB en la página)
- Modify: lo que señale axe

**Interfaces:**
- `seed(page)`: crea una lectura con cuestionario, una nota con fuente, un documento de texto, una ficha y un proyecto, usando los módulos de la app cargados en la página (`import('/Lectura-rapida/src/…')` no existe en producción).
  - Por eso se usa la propia interfaz cuando sea corto, o `indexedDB` directo con el esquema v4.
- `a11y.spec.ts`:
  - recorre **todas las rutas**: inicio, programa, día 1, diagnóstico, práctica, texto de práctica, leer, biblioteca, importar, libro físico, lector de documento, repasar, fichas, atención, glosario, cuaderno, fuentes, proyectos, editor, progreso (resumen e historial), ajustes;
  - pasa por cada ruta **en claro, sepia y oscuro**;
  - ejecuta `AxeBuilder` con las etiquetas `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`, `best-practice`;
  - falla si hay violaciones *serious* o *critical*;
  - imprime el resto.

- [ ] **Step 1:** Instalar `@axe-core/playwright` (versión exacta) y escribir la prueba. → FAIL con la lista de violaciones reales.
- [ ] **Step 2:** Arreglar cada violación en el componente correspondiente, con una prueba unitaria cuando el arreglo sea de comportamiento (nombres accesibles, roles).
- [ ] **Step 3:** `npx playwright test tests/e2e/a11y.spec.ts` → PASS.
- [ ] **Step 4: Commit y push** — `fix(a11y): auditoría axe de todas las pantallas en los tres temas`

---

### Task 2: Navegación por teclado y lector de pantalla

**Files:**
- Create: `src/app/RouteAnnouncer.tsx` (+ test), `tests/e2e/teclado.spec.ts`
- Modify: `src/app/Layout.tsx`, `src/i18n/es.ts`

**Interfaces:**
- **Enlace «Saltar al contenido»:** primer elemento enfocable; lleva a `<main id="contenido" tabIndex={-1}>`.
- **`RouteAnnouncer`:** al cambiar de ruta (no en la primera carga):
  - fija `document.title` = `«<h1 de la página> · Lectura Rápida»`;
  - mueve el foco al `h1` (con `tabIndex={-1}`);
  - anuncia el título en una región `aria-live="polite"`.
- **Estilo de foco global:** `:focus-visible` con un contorno de 2 px en `--accent`, con contraste ≥ 3:1 en los tres temas (comprobado con la prueba de contraste existente).
- **e2e `teclado.spec.ts`:**
  - completa el diagnóstico solo con teclado (Tab, Espacio, Enter, flechas en los radios);
  - comprueba que el foco está en el `h1` tras navegar y que el título de la pestaña cambia.

- [ ] **Step 1: Tests que fallan.**
  - `RouteAnnouncer`: tras navegar, `document.activeElement` es el `h1` y `document.title` empieza con su texto.
  - El enlace de salto es el primer enfocable.
  - Contraste del contorno de foco ≥ 3:1 en cada tema.
- [ ] **Step 2-4:** FAIL → implementar → PASS (`npm test` y el e2e).
- [ ] **Step 5: Commit y push** — `feat(a11y): salto al contenido, anuncio de página y foco al navegar`

---

### Task 3: Lighthouse ≥ 90 e instalabilidad

**Files:**
- Create: `scripts/lighthouse.mjs`, `tests/e2e/instalable.spec.ts`
- Modify: `package.json` (`"lighthouse": "node scripts/lighthouse.mjs"`), `index.html` (meta descripción y similares), `vite.config.ts` si hace falta

**Interfaces:**
- **`scripts/lighthouse.mjs`:**
  - compila y arranca `vite preview` en el puerto 4174;
  - ejecuta Lighthouse con el Chromium preinstalado (`--headless --no-sandbox`) sobre `/`, `/#/programa` y `/#/progreso`;
  - guarda el informe JSON en `.superpowers/lighthouse/`;
  - imprime las puntuaciones;
  - sale con código 1 si alguna categoría queda por debajo de 90.
- **`instalable.spec.ts`:**
  - con CDP (`Page.getInstallabilityErrors`), la lista de errores está vacía;
  - el manifiesto tiene `name`, `short_name`, `start_url`, `display: standalone`, iconos 192 y 512 y un icono *maskable*;
  - sin red, se cargan todas las rutas de la fase 4 (`/#/cuaderno`, `/#/proyectos`, `/#/ajustes`, `/#/practica`, `/#/fuentes`).

- [ ] **Step 1:** Instalar `lighthouse` (versión exacta), escribir el script y la prueba de instalabilidad, y ejecutarlos. → anotar las puntuaciones y los fallos.
- [ ] **Step 2:** Arreglar lo que baje de 90 (meta descripción, `theme-color`, tamaños de imagen, LCP, CLS, cabeceras).
  - Un fallo de comportamiento lleva su prueba.
  - Si una auditoría no aplica a GitHub Pages (cabeceras de caché que no podemos fijar), se registra como ruling.
- [ ] **Step 3:** `npm run lighthouse` → las cuatro categorías ≥ 90; `npx playwright test tests/e2e/instalable.spec.ts` → PASS.
- [ ] **Step 4: Commit y push** — `perf: Lighthouse ≥ 90 y app instalable comprobada`

---

### Task 4: Pendientes de la fase 4 — respaldo y datos

**Files:** `src/lib/backup.ts` (+ test), `src/features/ajustes/SettingsPage.tsx` (+ test), `src/features/cuaderno/*`, `src/features/proyectos/ProjectEditor.tsx`

- **Fecha del último respaldo al restaurar (M2):** al restaurar, `backup:lastAt` = `exportadoEl` del respaldo.
- **Respaldo sin archivos (M3):** el resumen avisa con `t('settings.restore.noFiles')` cuando hay documentos sin archivo.
- **Validación de `datos.json` (M4):** las filas de `readingSessions` sin campos numéricos válidos (`startedAt`, `activeMs`) y las de `notes`, `cards` y `projects` sin sus campos obligatorios hacen el respaldo `'corrupt'`.
- **Volver a elegir el mismo archivo (M5):** se limpia el `input` tras cada intento, para que el mismo archivo pueda elegirse otra vez.
- **Guardado al salir (M6):** el editor de proyectos guarda lo pendiente en `pagehide` y en `visibilitychange` → `hidden`.
- **Quitar un párrafo propio (M8):** pide confirmación si tiene texto.
- **Errores al guardar (M9):**
  - los errores de `updateNote`, `updateSource` y `deleteProject` muestran un mensaje;
  - una fuente con el título vacío (solo espacios) no se guarda.

- [ ] **Step 1: Tests que fallan** (uno por punto).
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `fix: respaldo, guardado y errores visibles (pendientes de la fase 4)`

---

### Task 5: Pendientes de la fase 4 — exportación, textos y foco

**Files:** `src/lib/exportProject.ts` (+ test), `src/lib/citation.ts`, `src/i18n/es.ts`, `src/features/inicio/Dashboard.tsx`, `src/features/progreso/ProgressPage.tsx`, `src/features/practica/PracticePage.tsx`, `src/features/retencion/ReviewPage.tsx`

- **Markdown (M11):** se escapan las líneas `---` y `===`, los `&` y la sangría inicial de 4 espacios o más.
- **Textos traducibles (M12):** las unidades `ppm`, `min` y `%`, y «y» y «s. f.» de las citas, pasan por `t()`; `slugify` usa `t('export.defaultName')`.
- **Mensajes exactos (M13):**
  - `practice.programWarning` con plural según el número de días;
  - `backup.due` distingue «nunca has creado un respaldo» de «hace más de una semana».
- **Foco al terminar el repaso (M14):** va al mensaje de repaso completado (`tabIndex={-1}`).
- **Errores de carga en el tablero (M15):** el tablero muestra `t('dashboard.loadError')` en lugar de datos vacíos.

- [ ] **Step 1: Tests que fallan.**
- [ ] **Step 2-4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit y push** — `fix: exportación, textos y foco (pendientes de la fase 4)`

---

### Task 6: Criterio de salida, documentación y publicación

**Files:**
- Modify: `docs/PLANO.md`, `README.md`, `DESCRIPTION.md`
- Create: `docs/ACCESIBILIDAD.md`: qué se comprueba, cómo y con qué resultados (puntuaciones de Lighthouse, axe sin violaciones graves, recorrido por teclado), y cómo instalar la app en Android, iOS y escritorio.

- [ ] **Step 1: Verificación final:** `npm run lint && npm test && npm run build && npm run e2e && npm run lighthouse` → código 0.
- [ ] **Step 2: Documentación:** fase 5 completada en `PLANO.md`; README con una sección de instalación y accesibilidad.
- [ ] **Step 3: Commit y push** — `docs: accesibilidad, rendimiento e instalación (fase 5)`
- [ ] **Step 4: Cierre de la fase:**
  - revisión final independiente y una ronda de correcciones;
  - integración en main y publicación;
  - comprobación del despliegue en GitHub Actions.
