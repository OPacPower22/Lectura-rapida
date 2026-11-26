# Lectura Rápida — Atención, comprensión y retención

![Estado](https://img.shields.io/badge/estado-fase_5_completada-blue)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)
![Stack](https://img.shields.io/badge/stack-PWA_React_TypeScript-blueviolet)

> Leer mejor cualquier material: entender, recordar y **usar** lo que lees, en el menor tiempo razonable.

App web instalable (PWA) que funciona sin conexión y sin cuenta. Entrena la **atención**, la **lectura activa**, la **velocidad flexible** y la **retención**. Lo leído termina convertido en trabajos propios: trazados, planchas, proyectos de instrucción, ensayos o apuntes de estudio.

## Qué la distingue

- **Basada en evidencia.** Usa lo que la investigación respalda: propósito y prelectura, lectura activa, práctica de recuerdo, repetición espaciada y entrenamiento de la atención. **No** incluye RSVP, tablas de Schulte ni ejercicios para "eliminar la subvocalización", porque la evidencia indica que no mejoran la comprensión. Detalle y fuentes en [`docs/METODO.md`](docs/METODO.md).
- **Honesta con las cifras.** No promete una velocidad. Mide la tuya (ppm por tipo de texto), tu comprensión, tu retención y tu atención, y te muestra cómo cambian.
- **Comprensión primero.** Leer a más de 600 ppm con menos del 60 % de comprensión se registra como *hojeo*, no como lectura. El marcapasos es opcional y recuerda bajar la velocidad si la comprensión cae.

## Ya disponible

- **Tablero de inicio** con botones por actividad (programa del día, prueba de velocidad, lectura de comprensión, repasar, atención, biblioteca, libro físico, glosario, cuaderno, proyectos, progreso) y tus estadísticas guardadas: última velocidad por tipo de texto, comprensión, retención a 24 h y 7 días, divagación, días con práctica en la última semana (sin rachas que castiguen), minutos de la semana y tendencia del ILE.
- **Proyectos de escritura** (trazado, plancha, proyecto de instrucción, ensayo, trabajo de estudio): tema, tesis y secciones con tus notas y párrafos propios, ordenables con botones. Se exportan a **Word (.docx)** y **Markdown** con citas en el texto (Autor, año, p. N) y **bibliografía en APA** simplificado.
- **Cuaderno** con todas tus notas (búsqueda sin acentos, filtros por fuente, tipo y etiqueta) y página de **Fuentes** para completar autor, año y editorial.
- **Progreso** con gráficas semanales (velocidad por tipo de texto, comprensión y divagación, minutos) con tabla de datos, retención diferida y exportación a **CSV**.
- **Respaldo y restauración** en un archivo .zip (opcionalmente sin los PDF y EPUB), con recordatorio semanal.
- **Ajustes:** tema, tamaño de letra y espacio entre líneas, sondeos en lecturas libres, sonido y vibración.
- **Programa de 28 días** (unos 20 min diarios) con el método **L.E.E.R.+R.**: 28 micro-lecciones con sus fuentes, ejercicios (atención, bloque de enfoque, hojeo y escaneo con tiempo, preguntas previas, mapas, explicar en voz alta, fichas, esquema de un trabajo) y lecturas medidas. Re-tests en los días 7, 14, 21 y 28 y modo mantenimiento después ([`docs/PROGRAMA.md`](docs/PROGRAMA.md)).
- **Retención:** recuerdo libre tras cada lectura medida (con comparación con el texto y autoevaluación), **fichas con repetición espaciada (FSRS)** —también automáticas desde el glosario— y cuestionarios de retención a 24 horas y 7 días.
- **Atención:** sesiones guiadas de respiración de 2, 5 y 10 minutos con contador de regresos.
- **Marcapasos con ajuste según tu comprensión** (−10 % si baja del 70 %, +5 % si supera el 80 % dos veces).
- **Diagnóstico** de velocidad (ppm), comprensión, Índice de Lectura Efectiva (ppm × comprensión) y divagación de la atención, con textos narrativo, expositivo y denso.
- **Biblioteca:** importa **PDF** (con reconstrucción de párrafos y número de página), **EPUB**, artículos web (pegando el texto o el HTML, o compartiéndolos desde Android) y texto pegado.
- **Lector** con tipografía ajustable, capítulos, posición guardada, sesiones cronometradas y la página original del PDF a la vista.
- **Lectura activa:** subrayado, notas (cita, paráfrasis, idea propia) con su fuente y página, y **glosario personal** con la oración de contexto.
- **Sesión de libro físico:** temporizador, sondeos de atención con tono suave, notas con número de página y recuerdo libre al terminar.
- **Atención:** sondeos durante la lectura, botón «Me distraje» y aviso antes de abandonar una lectura en curso.
- **Marcapasos opcional** (100-800 ppm) que se detiene cuando la app te pregunta por tu atención.
- **Historial** por tipo de texto, idioma, documento y páginas.
- **Temas:** automático, claro, sepia y oscuro (nocturno).
- **Funciona sin conexión** y sin cuenta; tus documentos y notas se quedan en tu dispositivo.

## Instalar

Abre **https://opacpower22.github.io/Lectura-rapida/** e instálala desde el navegador:
- **Android (Chrome):** menú ⋮ → «Instalar aplicación».
- **iPhone (Safari):** Compartir → «Añadir a pantalla de inicio».
- **Ordenador:** icono de instalar en la barra de direcciones.

Después de la primera visita funciona sin conexión.

## Diseño

La identidad visual es **«tinta y subrayador»**:
- tinta índigo para el texto y los botones principales;
- un color de marcador por tipo de actividad: amarillo para leer, menta para la atención, lila para la memoria, durazno para escribir y celeste para el progreso;
- **Literata** (diseñada para leer en pantalla) en los títulos y en el texto que lees, y **Atkinson Hyperlegible Next** en la interfaz. Las dos se incluyen en la app y funcionan sin conexión.

La portada muestra el método en pequeño: una línea donde un marcador avanza y unos puntos señalan dónde se fija la vista. Se detiene si el sistema pide reducir el movimiento.

## Accesibilidad y rendimiento

- WCAG 2.2 AA comprobado con axe en todas las pantallas y en los tres temas.
- Se puede usar entera con el teclado y con lector de pantalla.
- Lighthouse ≥ 90 en rendimiento, accesibilidad, buenas prácticas y SEO.

Detalle y resultados en [`docs/ACCESIBILIDAD.md`](docs/ACCESIBILIDAD.md).

## Próximamente

- **Validación** (fase 6): uso real durante 28 días y ajustes según los resultados.
- **Apps en Google Play y App Store** reutilizando esta misma app (fase 7).
- Más adelante, **aprender idiomas leyendo**.

## Desarrollo

Requisitos: Node.js 20 o superior.

```bash
git clone https://github.com/OPacPower22/Lectura-rapida.git
cd Lectura-rapida
npm install
npm run dev       # desarrollo
npm run build     # compilación de producción
npm run preview   # vista previa de la compilación
npm test          # pruebas unitarias (Vitest)
npm run lint      # lint
npm run e2e       # pruebas de extremo a extremo (Playwright), con axe e instalabilidad
npm run lighthouse # auditoría Lighthouse (Node 22.19+)
npm run fixtures  # regenera los PDF/EPUB de prueba de tests/fixtures
```

## Estructura

```
docs/                 plano, método, programa, diseño y planes
src/
  app/                rutas, layout, navegación
  features/           inicio, diagnostico, practica, lector, sesion-fisica,
                      atencion, retencion, cuaderno, proyectos, progreso,
                      programa, ajustes
  content/            lecciones y textos de práctica (datos)
  i18n/               textos de la interfaz
  lib/                métricas, formatos (PDF, EPUB, web), tiempo, almacenamiento
tests/e2e/            pruebas de extremo a extremo
tests/fixtures/       PDF y EPUB de prueba (npm run fixtures)
```

## Roadmap

Fases, estado y criterios de salida en [`docs/PLANO.md`](docs/PLANO.md).

## Contribuir

Usamos ramas por funcionalidad y Conventional Commits (`feat:`, `fix:`, `docs:`, `content:`, `test:`, `chore:`). El contenido versionado debe ser original o de dominio público (autor fallecido hace más de 100 años).

## Licencia

[MIT](LICENSE)
