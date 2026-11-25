# Diseño — Lectura Rápida: atención, comprensión y retención

- **Fecha:** 2026-11-25
- **Estado:** aprobado por el propietario (2026-11-25)
- **Sustituye a:** `PLANO.md`, `METODO.md` y `CURRICULO.md` de la raíz (se reescribirán a partir de este documento una vez aprobado).

---

## 1. Intención y porqué

Una aplicación que enseñe y entrene a **leer mejor cualquier material** —estudio, investigación, libros en general, preparación de trazados masónicos y proyectos de instrucción— para **entender, recordar y usar** lo leído en el menor tiempo razonable.

La velocidad es un medio, no la meta. El usuario quiere además:

- **Entrenar la atención**: sostener el foco y no distraerse con facilidad.
- **Lectura activa**: leer con propósito, preguntando, anotando y sintetizando.
- **Llevar lo leído a un producto propio**: un trazado, una plancha, un proyecto de instrucción, un trabajo de estudio.

Todo el material didáctico (lecciones, ejercicios, textos de práctica) vive dentro de la app.

## 2. Usuario y contexto de uso

- Usuario principal: el propietario del proyecto (lector adulto, hispanohablante). La app debe servir igual a cualquier lector adulto sin experiencia previa.
- Lee en **cuatro formatos**: libros físicos, PDF, EPUB y sitios web.
- Usa PC (donde escribe) y móvil/tableta (donde lee a menudo).
- Idioma de la interfaz y del contenido: **español**.

## 3. Metas, no-metas y anti-metas

### Metas
1. Medir con honestidad: velocidad (ppm), comprensión (%), retención diferida (%) y atención (tasa de divagación).
2. Enseñar un método completo y basado en evidencia (sección 5) mediante un programa de 28 días de ~20 min/día.
3. Entrenar la atención con ejercicios breves y sondeos durante la lectura.
4. Leer los cuatro formatos: PDF, EPUB y web dentro de la app; libro físico mediante sesión guiada.
5. Lectura activa: propósito, autopreguntas, subrayado, notas y fichas.
6. Retención: recuerdo activo y repetición espaciada de fichas y vocabulario.
7. De la lectura a la escritura: organizar fichas con fuente en un **proyecto de escritura** (trazado, plancha, proyecto de instrucción) y exportarlo como esquema.
8. Funcionar sin conexión, sin cuenta y con los datos en el dispositivo del usuario.

### No-metas (v1)
- Sincronización automática entre dispositivos (se usa exportar/importar respaldo).
- Cuentas de usuario, servidor o nube.
- IA que genere preguntas o resúmenes (la arquitectura deja el punto de extensión; no se construye en v1).
- OCR de fotografías de libros físicos o de PDF escaneados.
- App nativa en tiendas.
- Comunidad, ranking o funciones sociales.

### Anti-metas (si ocurre esto, fracasó aunque "funcione")
- **Prometer cifras sin respaldo** ("1000 ppm", "600 ppm en 28 días"). La app nunca promete una velocidad objetivo; muestra el progreso propio con datos.
- **Premiar la velocidad a costa de la comprensión.** Ninguna métrica, logro o nivel sube solo por ppm.
- **Incluir ejercicios sin respaldo presentados como eficaces** (ver 4.2).
- Convertirse en otra fuente de distracción: sin notificaciones insistentes, sin rachas que castiguen, sin mecánicas adictivas.
- Que el usuario pierda sus notas: los datos deben poder respaldarse y restaurarse siempre.

## 4. Base de evidencia (decide qué se construye)

### 4.1 Lo que sí tiene respaldo y la app usa
| Hallazgo | Fuente | Uso en la app |
| :--- | :--- | :--- |
| Velocidad media de lectura silenciosa en adultos ≈ 238 ppm (no ficción) y ≈ 260 ppm (ficción), en inglés | Brysbaert (2019), *Journal of Memory and Language*, 109 | Referencia en el diagnóstico; nunca como meta |
| Existe un intercambio velocidad–comprensión; las ganancias de "lectura rápida" provienen sobre todo de hojear, con pérdida de comprensión; la mejor vía a largo plazo es práctica de lectura, vocabulario y conocimiento previo | Rayner, Schotter, Masson, Potter y Treiman (2016), *Psychological Science in the Public Interest*, 17(1) | Principio "comprensión primero"; velocidad flexible; glosario personal |
| Hojear y escanear con propósito son útiles cuando el objetivo es localizar o tener visión general | Rayner et al. (2016) | Lecciones de hojeo (skimming) y escaneo (scanning) como herramientas, no como "lectura" |
| La práctica de recuerdo (autoevaluación) mejora la retención a largo plazo más que releer | Roediger y Karpicke (2006), *Psychological Science*, 17(3) | Recuerdo activo tras cada lectura; fichas |
| Práctica espaciada y práctica de recuerdo: utilidad alta; autoexplicación y preguntas elaborativas: moderada; subrayar y releer: baja | Dunlosky, Rawson, Marsh, Nathan y Willingham (2013), *Psychological Science in the Public Interest*, 14(1) | Repetición espaciada, autopreguntas; el subrayado existe pero solo como paso hacia la ficha |
| La mente divaga durante una parte sustancial del tiempo de lectura y eso reduce la comprensión | Schooler, Reichle y Halpern (2004); Smallwood y Schooler (2006), *Psychological Bulletin*, 132(6) | Sondeos de atención durante la lectura; métrica de divagación |
| Un entrenamiento breve de atención plena (2 semanas) redujo la divagación y mejoró la comprensión lectora | Mrazek, Franklin, Phillips, Baird y Schooler (2013), *Psychological Science*, 24(5) | Módulo de atención (dosis menor que el estudio; la app lo dice) |
| El efecto de generación: lo que uno produce se recuerda mejor que lo que solo lee | Slamecka y Graf (1978); metaanálisis Bertsch et al. (2007) | Las fichas y preguntas las escribe el usuario |

### 4.2 Lo que NO tiene respaldo y la app NO incluye como entrenamiento
| Práctica | Por qué se excluye |
| :--- | :--- |
| RSVP (palabras en ráfaga en el centro de la pantalla) para leer textos | Impide las regresiones útiles y empeora la comprensión en textos de más de una oración (Rayner et al., 2016) |
| "Eliminar la subvocalización" | El habla interna apoya la comprensión; suprimirla la reduce (Rayner et al., 2016) |
| Tablas de Schulte / "ampliar la visión periférica" para leer más palabras por fijación | El campo de reconocimiento de palabras está limitado por la agudeza de la fóvea (~7-8 letras a la derecha de la fijación); no se demuestra transferencia a la lectura (Rayner et al., 2016) |

La lección 2 del programa explica estos mitos con sus fuentes.

### 4.3 Evidencia mixta (se incluye con aviso)
- **Marcapasos visual** (una guía que avanza por la línea): puede ayudar a sostener ritmo y atención, pero no hay evidencia sólida de mejora de comprensión. Se ofrece como herramienta opcional y su uso queda condicionado a la comprensión medida.
- **Teléfono a la vista reduce la capacidad cognitiva** (Ward et al., 2017): réplicas posteriores no lo confirmaron de forma consistente. La app recomienda alejar el móvil y silenciar notificaciones porque el costo es nulo, sin presentarlo como hecho probado.

## 5. Método — L.E.E.R.+R. (versión revisada)

Se conserva el nombre del plano original; el contenido se ajusta a la evidencia.

| Paso | Qué se hace | Duración típica |
| :--- | :--- | :--- |
| **L — Localizar** | Propósito (¿qué necesito y para qué?), una pregunta que el texto debe responder, prelectura de estructura (títulos, índice, primer y último párrafo) | 1-3 min |
| **E — Enfocar** | Preparación de atención (respiración 1-2 min), entorno sin distracciones, bloque de tiempo definido | 1-2 min |
| **E — Extraer** | Lectura activa a velocidad flexible: rápido en lo conocido o narrativo, lento en lo denso o simbólico; marcar, anotar, registrar palabras desconocidas | variable |
| **R — Retener** | Cerrar el texto; recuerdo libre (3-5 ideas), responder la pregunta inicial, crear fichas (cita, paráfrasis, idea propia) | 3-5 min |
| **+R — Repasar** | Repetición espaciada de fichas y vocabulario; explicación en voz alta (autoexplicación) | 2-5 min/día |

**Reglas de progresión:**
- Si la comprensión es < 70 % en dos lecturas seguidas del mismo tipo de texto, el marcapasos baja 10 % y la app sugiere más prelectura.
- Si la comprensión es ≥ 80 % en dos lecturas seguidas, el marcapasos puede subir 5-10 %.
- La velocidad se registra por tipo de texto (narrativo, expositivo, técnico/denso), nunca como un número único.

## 6. Programa de 28 días (~20 min/día)

Estructura diaria: micro-lección (3 min) + atención o ejercicio (5 min) + lectura práctica con medición (12 min). Un día no completado no se pierde: el programa avanza por días completados, no por fechas.

| Semana | Días |
| :--- | :--- |
| **1 — Base: medir y atender** | 1 Diagnóstico · 2 Qué es leer: cómo funcionan ojos y cerebro, y mitos de la lectura rápida · 3 Atención: respiración y sondeos · 4 Entorno y bloques de enfoque · 5 Propósito y prelectura · 6 Lectura activa: autopreguntas · 7 Re-test semanal |
| **2 — Velocidad flexible** | 8 Fijaciones y regresiones útiles · 9 Marcapasos y ritmo · 10 Hojear para captar estructura · 11 Escanear para localizar datos · 12 Elegir velocidad según texto y propósito · 13 Vocabulario y glosario personal · 14 Re-test semanal |
| **3 — Comprensión profunda** | 15 Estructura: tesis, argumentos, evidencia · 16 Inferencia y lectura crítica · 17 El método L.E.E.R.+R. completo · 18 Notas: cita, paráfrasis, idea propia · 19 Mapas conceptuales · 20 Textos densos y simbólicos: lectura lenta y relectura deliberada · 21 Re-test semanal |
| **4 — Retención y producción** | 22 Recuerdo activo · 23 Repetición espaciada · 24 Explicar para entender · 25 Sintetizar varias fuentes · 26 De las fichas al esquema de un trazado o proyecto · 27 Sesión real de 30-45 min con material propio · 28 Test final y plan de mantenimiento (10-15 min/día) |

Tras el día 28, el **modo mantenimiento** propone a diario repaso espaciado, una sesión de atención y una lectura con medición.

## 7. Módulos de la aplicación

### 7.1 Inicio
Qué toca hoy (día del programa o mantenimiento), repasos pendientes y acceso rápido a "leer ahora". Sin registro: se abre y se usa.

### 7.2 Diagnóstico y re-tests
- Lectura cronometrada de un texto de la biblioteca (600-900 palabras).
- 8-10 preguntas de opción múltiple: literales, inferenciales y de idea central.
- 2-3 sondeos de atención durante la lectura.
- Retención diferida: a las 24 h la app propone responder de nuevo un subconjunto de preguntas.
- Re-tests en los días 7, 14, 21 y 28 con textos distintos de dificultad equivalente.
- Si el resultado supera 600 ppm con comprensión < 60 %, la app lo etiqueta como "hojeo", no como lectura.

### 7.3 Lector (PDF, EPUB, web y texto pegado)
- Vista de texto refluido con tipografía, tamaño, interlineado, ancho de línea y tema (claro, sepia, oscuro) ajustables.
- **PDF:** extracción de texto con `pdfjs-dist`; opción de ver la página original. Si el PDF no tiene capa de texto (escaneado), la app lo detecta y ofrece usarlo en modo **libro físico** (sesión guiada con el PDF abierto en otra ventana o impreso).
- **EPUB:** descompresión (es un ZIP de XHTML) y extracción de capítulos al mismo lector.
- **Web:** pegar el texto o el HTML del artículo; limpieza con `@mozilla/readability` cuando se pega HTML. En Android, recepción por "Compartir" (Web Share Target). La descarga directa por URL no se garantiza: la mayoría de los sitios la bloquean desde el navegador (CORS).
- Herramientas activas: subrayar, nota al margen, "crear ficha" desde una selección, "añadir al glosario", botón "me distraje" (divagación detectada por el propio lector).
- Herramientas de entrenamiento: marcapasos opcional (resaltado que avanza a ppm configurable) y temporizador de bloque de enfoque.
- Progreso guardado por documento (posición, tiempo, palabras leídas).

### 7.4 Sesión de libro físico
- Datos del libro (título, autor, edición) y páginas inicial y final.
- Paso L (propósito y pregunta), temporizador de bloque, sondeos de atención por vibración o sonido suave, captura rápida de notas con número de página y paso R al cerrar.
- Velocidad estimada = páginas × palabras por página. Las palabras por página se estiman una vez contando una página de muestra (la app guía el conteo de 3 líneas y las líneas por página).

### 7.5 Atención
- Sesiones guiadas de atención a la respiración de 2, 5 y 10 min, con contador de "me distraje y volví".
- **Sondeos durante la lectura:** a intervalos aleatorios de 2-4 min la app pregunta "¿Dónde estaba tu atención?" (en el texto / en otra cosa / no sé). Se pueden desactivar fuera del programa.
- Bloques de enfoque con lista previa (móvil lejos, notificaciones silenciadas, objetivo del bloque).
- Métrica: tasa de divagación = sondeos con "en otra cosa" o "no sé" / total de sondeos, más los "me distraje" espontáneos por cada 10 min.

### 7.6 Retención
- **Fichas:** pregunta y respuesta escritas por el usuario, vinculadas a fuente y página o posición.
- **Glosario personal:** palabra, contexto y definición propia.
- Programación con **FSRS** (biblioteca `ts-fsrs`); el usuario califica cada repaso (otra vez / difícil / bien / fácil).
- Recuerdo libre tras cada lectura: el usuario escribe ideas sin mirar y después las compara con el texto y se autocalifica (marcado como "autoevaluado").

### 7.7 Cuaderno y proyectos de escritura
- **Cuaderno:** todas las notas y fichas, filtrables por fuente, etiqueta y proyecto.
- **Fuentes:** registro de cada obra (autor, título, año, editorial, URL, tipo) para citar.
- **Proyecto de escritura** (trazado, plancha, proyecto de instrucción, trabajo de estudio): tema, tesis o pregunta, esquema por secciones; se arrastran fichas a cada sección.
- Exportación del proyecto a **Word (.docx)**, editable, con título, esquema por secciones, citas con página y bibliografía en formato APA simplificado (librería `docx`). También a Markdown.

### 7.8 Progreso
- Gráficas por semana: ppm por tipo de texto, comprensión, retención diferida, tasa de divagación y minutos de práctica.
- **Índice de Lectura Efectiva (ILE)** = ppm × comprensión (0-1). Es la métrica principal de la parte de velocidad, mostrada siempre junto a la comprensión.
- Exportación CSV del historial.

### 7.9 Biblioteca y lecciones
- 28 micro-lecciones en Markdown (una por día), escritas para este proyecto, con fuentes al pie.
- **Textos de práctica:** al menos 12 para v1 (diagnóstico y re-tests en tres tipos: narrativo, expositivo y denso), con preguntas curadas. Objetivo de 30 en fases posteriores.
- **Temas:** generales (filosofía, historia, ciencia, ética, literatura, etc.). La biblioteca no incluye material masónico; ese lo carga el usuario y permanece solo en su dispositivo.
- Origen del contenido: textos escritos para el proyecto o de dominio público con autor fallecido hace más de 100 años (criterio que cubre también la legislación mexicana, la más estricta en el mundo hispano). Las traducciones se tratan como obras protegidas salvo que también cumplan el criterio.
- El contenido es datos (Markdown/JSON en `src/content/`), separado del código.

### 7.10 Ajustes y datos
- **Tema visual de toda la app** (implementado): automático según el sistema, claro, sepia y oscuro (nocturno). Colores semánticos con contraste AA en los tres temas; la elección se recuerda en el dispositivo.
- Tema, tipografía, duración de sondeos, sonido y vibración.
- **Respaldo:** exportar e importar todo (datos y documentos) en un único archivo; recordatorio de respaldo semanal dentro de la app.
- Petición de almacenamiento persistente (`navigator.storage.persist()`) para que el navegador no borre los datos.

## 8. Medición — definiciones

| Métrica | Cálculo | Origen |
| :--- | :--- | :--- |
| ppm | palabras leídas / minutos activos (las pausas no cuentan) | Lector o sesión física |
| Comprensión | aciertos / preguntas | Objetiva en textos de biblioteca; autoevaluada en textos propios (siempre etiquetada) |
| Retención diferida | aciertos en el re-test a 24 h y 7 días, o tasa de acierto de fichas en FSRS | Biblioteca / fichas |
| Divagación | ver 7.5 | Sondeos |
| ILE | ppm × comprensión | Solo con comprensión objetiva |

## 8 bis. Preparada para varios idiomas (futuro)

El propietario quiere que, más adelante, la app sirva para **aprender otros idiomas leyendo**. En v1 todo es en español, pero la arquitectura no debe impedirlo:

- **Idioma como dato:** cada documento, texto de práctica, lección, nota, ficha y entrada de glosario lleva un campo `lang` (código BCP 47: `es`, `en`, `fr`…). Nada asume español en la lógica.
- **Conteo de palabras por idioma:** se usa `Intl.Segmenter` con el `lang` del texto, que también segmenta idiomas sin espacios (chino, japonés).
- **Métricas separadas por idioma:** la velocidad y la comprensión en un idioma aprendido no son comparables con las del idioma materno; el progreso se muestra por idioma.
- **Interfaz traducible:** ningún texto de la interfaz va escrito en los componentes; todos salen de un catálogo (`src/i18n/es.ts`) para poder añadir otros idiomas.
- **Glosario bilingüe:** la entrada de glosario admite un campo opcional de traducción.
- **Módulo futuro "Leer para aprender idiomas"** (no en v1): textos graduados por nivel, lectura extensiva y vocabulario con repetición espaciada. Dato de referencia para graduar textos: para comprender sin ayuda un texto se necesita conocer en torno al 98 % de sus palabras (Hu y Nation, 2000, *Reading in a Foreign Language*, 13(1)); la app podría estimar esa cobertura con el glosario del usuario.

## 8 ter. App en Google Play y App Store (futuro)

El propietario quiere, más adelante, distribuir la app en las tiendas. La estrategia es **reutilizar la misma app web**, no reescribirla.

| Vía | Cómo | A favor | En contra |
| :--- | :--- | :--- | :--- |
| **Android con TWA** (Trusted Web Activity) | Empaquetar la PWA con Bubblewrap o PWABuilder | Se actualiza sola con cada publicación web; mínimo trabajo | Exige servir `/.well-known/assetlinks.json` en la **raíz del dominio**: con GitHub Pages de proyecto (`opacpower22.github.io/Lectura-rapida/`) no es posible; requiere dominio propio o un sitio de usuario |
| **Android e iOS con Capacitor** | La app web va empaquetada dentro de un contenedor nativo | Un solo código para ambas tiendas; funciona sin conexión; permite funciones nativas | Cada actualización pasa por revisión de la tienda |

**Requisitos y costos verificados (25-11-2026, fuentes oficiales):**
- **Google Play:** registro de US$25, pago único. Las cuentas personales creadas después del 13-11-2023 deben hacer una **prueba cerrada con al menos 12 testers durante 14 días continuos** antes de publicar en producción (Play Console Help, respuesta 14151465).
- **Apple App Store:** Apple Developer Program, **99 USD por año**. La regla 4.2 (*Minimum Functionality*) exige "funciones, contenido e interfaz que la eleven por encima de un sitio web reempaquetado"; para reducir el riesgo de rechazo, la versión iOS debe aportar funciones nativas (por ejemplo, notificaciones locales para los repasos, recibir documentos desde "Compartir" y respaldo en Archivos). Compilar para iOS requiere macOS con Xcode o un servicio de compilación en la nube.
- Ambas tiendas piden una **política de privacidad** publicada.

**Preparación desde ahora (sin costo):** ruta base configurable (`VITE_BASE`), datos con respaldo exportable para poder migrarlos, y no depender de funciones del navegador sin alternativa. La decisión entre TWA y Capacitor se toma al iniciar esa fase (Fase 7).

## 9. Arquitectura

- **Tipo:** PWA *local-first*, sin servidor. Instalable y funcional sin conexión.
- **Stack:** React + TypeScript + Vite; Tailwind CSS; Zustand para estado de UI; Dexie (IndexedDB) para datos y archivos; `vite-plugin-pwa`; Vitest para lógica; Playwright para flujos críticos.
- **Librerías de formato:** `pdfjs-dist`, `jszip` (EPUB), `@mozilla/readability`, `ts-fsrs`, `docx` (exportación Word).
- **Despliegue:** GitHub Pages mediante GitHub Actions, desde el mismo repositorio.
- **Punto de extensión (v2):** una interfaz `SyncProvider` y una interfaz `QuestionGenerator` sin implementación en v1, para añadir sincronización e IA sin reescribir módulos.

### Estructura de carpetas
```
src/
  app/            rutas, layout, navegación
  features/
    inicio/  diagnostico/  lector/  sesion-fisica/  atencion/
    retencion/  cuaderno/  progreso/  programa/  ajustes/
  content/        lecciones (md) y textos de práctica (md + json de preguntas)
  lib/            métricas, formatos (pdf, epub, web), fsrs, almacenamiento, respaldo
  ui/             componentes compartidos
tests/            e2e con Playwright
```

### Modelo de datos (tablas Dexie)
`documents` (fuente, tipo, archivo, texto extraído, progreso) · `sources` (metadatos bibliográficos) · `readingSessions` (documento, inicio, fin, palabras, ppm, tipo de texto) · `probes` (sesión, momento, respuesta) · `quizResults` (texto, preguntas, aciertos, diferido sí/no) · `notes` (fuente, posición o página, tipo: cita/paráfrasis/idea, texto, etiquetas) · `cards` (pregunta, respuesta, fuente, estado FSRS) · `glossary` · `projects` (tema, tesis, secciones con referencias a notas) · `programProgress` (día, completado, fecha) · `settings`.

## 10. Fases de construcción

| Fase | Contenido | Criterio de salida |
| :--- | :--- | :--- |
| **0 — Plano** | Este diseño, plan de implementación, reorganización de documentos, README corregido | Diseño aprobado y plan en el repositorio |
| **1 — Esqueleto y medición** | Proyecto Vite, PWA, almacenamiento, lector de texto pegado, cronómetro, cálculo de ppm, cuestionario, sondeos, diagnóstico con 3 textos | Un usuario hace el diagnóstico completo sin conexión y ve ppm, comprensión y divagación |
| **2 — Formatos y lectura activa** | PDF, EPUB, web pegada y compartida, sesión de libro físico, subrayado, notas, glosario, marcapasos | Se lee y anota un PDF, un EPUB, un artículo web y un libro físico |
| **3 — Programa y retención** | 28 lecciones, programa diario, fichas con FSRS, recuerdo libre, re-test a 24 h, módulo de atención completo, 12 textos | Días 1-7 completables de principio a fin; repasos programados correctos |
| **4 — Cuaderno, proyectos y progreso** | Fuentes, proyectos de escritura, exportación .docx y Markdown, gráficas, CSV, respaldo | Un trazado de ejemplo se arma con fichas de 3 fuentes y se exporta a .docx que abre correctamente en Word y LibreOffice |
| **5 — Pulido y publicación** | Accesibilidad (teclado, contraste AA, lector de pantalla), rendimiento (Lighthouse ≥ 90), despliegue en GitHub Pages | App instalable desde la URL pública y usable sin conexión |
| **6 — Validación** | Uso real 28 días, ajuste de textos, preguntas y reglas de progresión según datos | Informe con resultados reales |
| **7 — Apps en tiendas (futuro)** | Empaquetado para Google Play y App Store (sección 8 ter), funciones nativas para iOS, política de privacidad | App aprobada en ambas tiendas |

## 11. Flujo de trabajo con Git
- Commits con Conventional Commits (`feat:`, `fix:`, `docs:`, `content:`, `test:`, `chore:`).
- Rama de desarrollo de esta sesión: `claude/fervent-dirac-u5fdme`; `main` estable. Las integraciones a `main` se hacen por pull request cuando el propietario lo pida.
- Commit y push al cerrar cada tarea del plan de implementación.

## 12. Riesgos y mitigaciones
| Riesgo | Mitigación |
| :--- | :--- |
| El navegador borra IndexedDB | `storage.persist()`, recordatorio de respaldo semanal, exportación en un solo archivo |
| PDFs escaneados o con texto desordenado | Detección sin capa de texto → modo libro físico; vista de página original |
| Sitios web que bloquean la extracción | Pegar texto/HTML; Web Share Target en Android |
| Comprensión autoevaluada inflada en textos propios | Etiqueta "autoevaluado"; ILE solo con comprensión objetiva |
| Abandono del programa | Sesiones de 20 min, avance por días completados, sin castigos por días perdidos |
| Contenido insuficiente de práctica | El contenido es datos; se amplía sin tocar código |

## 13. Lo que queda al constructor
- Diseño visual y componentes (siguiendo accesibilidad AA y legibilidad tipográfica).
- Gestor de paquetes (npm o pnpm) y configuración de lint/format.
- Algoritmo concreto de segmentación de texto en palabras y oraciones para el marcapasos.
- Redacción final de lecciones y textos dentro de los criterios de 4 y 7.9.
- Detalles del formato del archivo de respaldo (debe ser versionado).

## 14. Decisiones tomadas por el diseñador (revisables por el propietario)
1. Se mantiene el nombre del método **L.E.E.R.+R.** con contenido revisado.
2. Se **excluyen** RSVP, Schulte y "eliminar subvocalización" como entrenamiento.
3. Programa de **28 días, ~20 min/día**, con avance por días completados.
4. **12 textos** de práctica en v1 (30 después).
5. Repetición espaciada con **FSRS** (`ts-fsrs`).
6. Exportación de proyectos a **.docx** y Markdown en v1 (decidido por el propietario).
7. Despliegue en **GitHub Pages**.
8. Biblioteca de **temas generales** (decidido por el propietario). Criterio de dominio público: autor fallecido hace **más de 100 años**.
9. Sondeos de atención cada **2-4 min** aleatorios durante el programa.
10. **Un solo usuario por dispositivo** (sin perfiles en v1).
11. Los documentos de la raíz (`PLANO.md`, `METODO.md`, `CURRICULO.md`) se **reescriben en `docs/`** a partir de este diseño y se eliminan de la raíz; el README se corrige (badges, estructura real, URL real del repositorio).
12. El repositorio es **público**: solo se versiona contenido propio o de dominio público; los documentos y notas del usuario nunca salen de su dispositivo.
13. El respaldo permite **excluir los archivos PDF/EPUB** para generar un archivo ligero (solo datos y notas).
14. Los sondeos en libro físico usan **sonido suave** por defecto; vibración solo donde el navegador la soporte (no en iOS).
15. Preparación multilingüe (sección 8 bis) desde v1: campo `lang`, `Intl.Segmenter`, métricas por idioma y catálogo de textos de interfaz. El módulo de idiomas se diseñará aparte cuando toque.
16. **Tema visual** con colores semánticos (automático, claro, sepia, oscuro), añadido a petición del propietario antes de la fase 2.
17. **Apps en tiendas** como fase 7 futura, reutilizando la app web (sección 8 ter).
