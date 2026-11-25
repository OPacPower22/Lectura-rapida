# Lectura Rápida — Atención, comprensión y retención

![Estado](https://img.shields.io/badge/estado-fase_1_completada-blue)
![Licencia](https://img.shields.io/badge/licencia-MIT-green)
![Stack](https://img.shields.io/badge/stack-PWA_React_TypeScript-blueviolet)

> Leer mejor cualquier material: entender, recordar y **usar** lo que lees, en el menor tiempo razonable.

App web instalable (PWA) que funciona sin conexión y sin cuenta. Entrena la **atención**, la **lectura activa**, la **velocidad flexible** y la **retención**. Lo leído termina convertido en trabajos propios: trazados, planchas, proyectos de instrucción, ensayos o apuntes de estudio.

## Qué la distingue

- **Basada en evidencia.** Usa lo que la investigación respalda: propósito y prelectura, lectura activa, práctica de recuerdo, repetición espaciada y entrenamiento de la atención. **No** incluye RSVP, tablas de Schulte ni ejercicios para "eliminar la subvocalización", porque la evidencia indica que no mejoran la comprensión. Detalle y fuentes en [`docs/METODO.md`](docs/METODO.md).
- **Honesta con las cifras.** No promete una velocidad. Mide la tuya (ppm por tipo de texto), tu comprensión, tu retención y tu atención, y te muestra cómo cambian.
- **Comprensión primero.** Si la comprensión baja, la velocidad baja. Leer a más de 600 ppm con menos del 60 % de comprensión se registra como *hojeo*, no como lectura.

## Qué incluye (al completar todas las fases)

- **Diagnóstico y re-tests semanales:** ppm, comprensión, retención a 24 h y tasa de divagación.
- **Programa de 28 días**, de unos 20 minutos diarios, con el método **L.E.E.R.+R.**: Localizar, Enfocar, Extraer, Retener y Repasar ([`docs/PROGRAMA.md`](docs/PROGRAMA.md)).
- **Lector** de PDF, EPUB, artículos web y texto pegado, con tipografía ajustable, subrayado, notas, glosario y marcapasos opcional.
- **Sesión de libro físico:** temporizador, páginas, sondeos de atención y notas con número de página.
- **Atención:** respiración guiada, sondeos durante la lectura y bloques de enfoque.
- **Retención:** fichas y vocabulario con repetición espaciada (FSRS) y recuerdo libre después de leer.
- **Cuaderno y proyectos de escritura:** fichas con su fuente, organizadas en un esquema y exportables a **Word (.docx)** y Markdown, con bibliografía.
- **Progreso:** gráficas, Índice de Lectura Efectiva (ppm × comprensión) y exportación a CSV.
- **Privacidad:** tus documentos y notas se quedan en tu dispositivo. Puedes respaldarlos y restaurarlos en un archivo.
- **Preparada para varios idiomas:** más adelante servirá también para aprender idiomas leyendo.

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
npm run e2e       # pruebas de extremo a extremo (Playwright)
```

## Estructura

```
docs/                 plano, método, programa, diseño y planes
src/
  app/                rutas, layout, navegación
  features/           inicio, diagnostico, lector, sesion-fisica, atencion,
                      retencion, cuaderno, progreso, programa, ajustes
  content/            lecciones y textos de práctica (datos)
  i18n/               textos de la interfaz
  lib/                métricas, formatos, tiempo, almacenamiento
tests/e2e/            pruebas de extremo a extremo
```

## Roadmap

Fases, estado y criterios de salida en [`docs/PLANO.md`](docs/PLANO.md).

## Contribuir

Usamos ramas por funcionalidad y Conventional Commits (`feat:`, `fix:`, `docs:`, `content:`, `test:`, `chore:`). El contenido versionado debe ser original o de dominio público (autor fallecido hace más de 100 años).

## Licencia

[MIT](LICENSE)
