# Accesibilidad, rendimiento e instalación

La app apunta a **WCAG 2.2 AA** y a **Lighthouse ≥ 90**. Las dos cosas se comprueban con pruebas automáticas que se ejecutan en cada cambio.

## Qué se comprueba y cómo

| Comprobación | Herramienta | Dónde | Criterio |
| :--- | :--- | :--- | :--- |
| Reglas WCAG 2.0, 2.1 y 2.2 A/AA y buenas prácticas, en las 21 pantallas y en los temas claro, sepia y oscuro | axe-core 4.14 en Playwright | `tests/e2e/a11y.spec.ts` | Ninguna violación, de ningún nivel |
| Estados interactivos: lectura, sondeo de atención, cuestionario, resultados, barra de anotación, selector de notas, repaso | axe-core | `tests/e2e/a11y.spec.ts` | Ninguna violación |
| Diagnóstico completo solo con teclado, foco visible, título de cada página y foco en el encabezado al navegar | Playwright | `tests/e2e/teclado.spec.ts` | Pasa |
| Contraste de los colores de cada tema: texto 4,5:1, bordes de controles y contorno de foco 3:1 | Prueba unitaria | `src/theme-contrast.test.ts` | Pasa |
| Rendimiento, accesibilidad, buenas prácticas y SEO en perfil móvil | Lighthouse 13 | `npm run lighthouse` | ≥ 90 en las cuatro |
| Instalable (sin errores de instalabilidad), manifiesto completo y todas las rutas sin conexión | Playwright + protocolo de Chrome | `tests/e2e/instalable.spec.ts` | Pasa |

## Resultados de Lighthouse

Fase 5, compilación de producción, perfil móvil:

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
| :--- | :--- | :--- | :--- | :--- |
| Inicio | 98 | 100 | 100 | 100 |
| Programa | 93 | 100 | 100 | 100 |
| Progreso | 95 | 100 | 100 | 100 |
| Biblioteca | 94 | 100 | 100 | 100 |

Las cifras de rendimiento varían unos puntos entre ejecuciones; el script falla si alguna baja de 90.

## Ayudas para teclado y lector de pantalla

- **«Saltar al contenido»:** es el primer elemento al pulsar Tab.
- **Al cambiar de página:**
  - el título de la pestaña indica en qué página estás;
  - el foco va al encabezado principal;
  - el lector de pantalla anuncia la página.
- **Foco visible siempre:** un contorno de 2 px con contraste ≥ 3:1 en los tres temas.
- **Sondeos de atención:** son diálogos que atrapan el foco y lo devuelven al cerrarse.
- **Gráficas:**
  - tienen un resumen accesible;
  - se recorren con las flechas;
  - cada una tiene su tabla de datos.
- **Proyectos de escritura:** se ordenan con botones de subir, bajar y mover, sin arrastrar. El foco sigue al elemento movido y se anuncia su nueva posición.
- **Movimiento reducido:** la animación de respiración se detiene si el sistema lo pide.

## Instalar la app

La dirección es https://opacpower22.github.io/Lectura-rapida/

- **Android (Chrome):**
  1. Abre la dirección.
  2. Menú ⋮.
  3. «Instalar aplicación» o «Añadir a pantalla de inicio».
- **iPhone o iPad (Safari):**
  1. Abre la dirección.
  2. Botón Compartir.
  3. «Añadir a pantalla de inicio».
- **Ordenador (Chrome o Edge):** el icono de instalar en la barra de direcciones, o Menú → «Instalar Lectura Rápida».

Después de la primera visita, la app funciona **sin conexión**. Tus datos se guardan solo en ese dispositivo; usa **Ajustes → Crear respaldo** para guardarlos fuera del navegador.

## Ejecutar las auditorías

```bash
npm run e2e          # incluye axe, teclado e instalabilidad
npm run lighthouse   # requiere Node 22.19+ y Chromium (usa /opt/pw-browsers o CHROME_PATH)
```
