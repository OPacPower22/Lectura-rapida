# PLANO MAESTRO — Lectura Rápida: Comprensión y Retención

> Este es el plano que seguirá la creación de la herramienta. Nada se construye sin estar aquí primero.
> Principio rector: **Primero comprensión, luego velocidad. Sin retención, no hay lectura.**

## 1. Visión y alcance

### Visión
Que cualquier persona, sin experiencia previa, pase de lector palabra-por-palabra a lector estratégico en 28 días, con evidencia medible.

### Alcance del MVP (lo que SÍ hace la v1)
- Diagnóstico inicial y re-tests semanales.
- Entrenador ocular (Schulte, guía visual, anti-regresión).
- Lector RSVP + lector por bloques.
- Currículo 28 días con lecciones y ejercicios.
- Test de comprensión y retención.
- Sistema de repetición espaciada básico.
- Dashboard con ILE (ppm × comprensión).
- Biblioteca graduada (30 textos iniciales).
- PWA instalable, offline.

### Fuera de alcance en v1 (se deja para después)
- Importación automática de PDF/EPUB con OCR.
- IA que genera preguntas (se hará manual/curada en v1).
- Comunidad / social / ranking.
- Versión móvil nativa (se cubre con PWA).
- Cuentas y sincronización en la nube (v2).

## 2. Arquitectura

### Stack decidido
- **Frontend:** React + TypeScript + Vite
- **Estilos:** Tailwind CSS
- **Estado:** Zustand / Context + IndexedDB (Dexie) para offline
- **PWA:** Vite PWA (instalable, offline-first)
- **Tests:** Vitest + Playwright (flujos críticos)
- **Contenido:** Markdown / JSON para lecciones y textos graduados
- **Despliegue:** Vercel / Netlify (estático)

### Por qué este stack
- Rápido de construir, fácil de mantener, funciona sin backend en v1.
- Offline-first: el entrenamiento no depende de internet.
- El contenido es datos, no código: se puede ampliar sin tocar la app.

### Módulos
1. `diagnostico/` — cálculo de ppm, comprensión, perfil lector.
2. `entrenador/` — Schulte, guía visual, metrónomo, anti-regresión.
3. `lector/` — RSVP, bloques, columnas, ajustes tipográficos.
4. `curriculo/` — lecciones, progreso, desbloqueo diario.
5. `retencion/` — recuerdo activo, SRS, mapas, resúmenes.
6. `dashboard/` — ILE, gráficas, racha, exportación.
7. `biblioteca/` — textos, niveles, filtros, búsqueda.

## 3. Método pedagógico — L.E.E.R.+R. (detalle)

Ver `METODO.md` para el desarrollo completo. Resumen operativo:

- **Localizar (2 min):** título, subtítulos, primer/último párrafo, preguntas.
- **Enfocar (durante):** guía visual, 2-3 fijaciones por línea, sin volver atrás.
- **Extraer (durante):** chunks de 3-5 palabras, buscar idea, no palabra.
- **Retener (5 min después):** cierra el texto, escribe 3 ideas, hazte 3 preguntas.
- **Repasar (24h/3d/7d):** SRS + resumen en voz alta (Feynman en 60 seg).

### Reglas de progresión
- No se sube velocidad si comprensión <70% en 2 lecturas seguidas.
- Cada ejercicio tiene nivel: Base → Ágil → Veloz → Maestro.
- La velocidad se entrena por rangos: +10% cada 3 días, no saltos bruscos.

## 4. Currículo 28 días — estructura

| Semana | Foco | Hito medible |
| :--- | :--- | :--- |
| 1 | Desbloqueo: mecánica, propósito, anti-regresión | -30% regresiones, +20% ppm |
| 2 | Aceleración: chunks, subvocalización, flexibilidad | 350-450 ppm, comprensión ≥75% |
| 3 | Comprensión: estructura, inferencia, lectura activa | Comprensión ≥80% en textos densos |
| 4 | Dominio: velocidad adaptativa + retención | 500-650 ppm, retención 7d ≥60% |

Cada día: Micro-lección (3 min) + Ejercicio (7 min) + Lectura práctica + Test (10 min) = 20 min.

## 5. Fases de construcción

### FASE 0 — Plano y cimientos (esta entrega)
- [x] README + DESCRIPTION + PLANO
- [x] Estructura de carpetas + .gitignore
- [x] Decisiones de stack y método
- [ ] Repositorio local con commits iniciales
- Entregable: este repo listo para `git push`.

### FASE 1 — MVP: Medir y mover los ojos (Semana 1 de dev)
- Diagnóstico: cronómetro, cálculo ppm, test 10 preguntas.
- Entrenador: Schulte 5x5, guía visual con velocidad.
- Lector RSVP básico: ppm ajustable, chunk 1-3 palabras, pausa.
- Test de comprensión reutilizable.
- Dashboard mínimo: ppm, comprensión, ILE.
- **Criterio de salida:** un usuario puede hacer diagnóstico → entrenar 10 min → ver su ILE.

### FASE 2 — Currículo + Retención (Semana 2)
- 28 lecciones en Markdown/JSON.
- Desbloqueo diario, racha, progreso.
- Módulo retención: resumen, recuerdo activo, SRS (24h/3d/7d).
- Biblioteca: 30 textos graduados con test.
- **Criterio de salida:** completar Día 1-7 sin errores y con retención registrada.

### FASE 3 — Lector completo + Biblioteca + Dashboard (Semana 3)
- Lector por bloques, columnas, modo anti-regresión.
- Ajustes: tipografía, tema, ancho, velocidad.
- Dashboard con gráficas, exportación PDF/CSV.
- Biblioteca con filtros por nivel/tema/tiempo.
- **Criterio de salida:** 5 usuarios prueban 7 días y reportan ILE.

### FASE 4 — PWA + Pulido + Gamificación (Semana 4)
- Instalable, offline, sincronización local.
- Niveles, logros, retos diarios.
- Accesibilidad: contraste, tamaño, teclado, lector de pantalla.
- Performance: <2s carga inicial, Lighthouse ≥90.
- **Criterio de salida:** app instalable y usable sin internet.

### FASE 5 — Validación y v1.1 (Semana 5)
- Prueba con 10 usuarios reales (28 días o versión intensiva 7 días).
- Ajuste de dificultad y textos según datos.
- Documentación de resultados.
- Lanzamiento v1.0.

## 6. Flujo de trabajo con Git

### Convención de commits (Conventional Commits)
- `feat:` nueva funcionalidad
- `fix:` corrección
- `docs:` documentación
- `content:` lecciones / textos
- `style:` estilos sin cambio funcional
- `test:` tests
- `chore:` configuración

### Ramas
- `main` — estable, siempre desplegable.
- `develop` — integración.
- `feat/nombre` — cada funcionalidad.
- `content/dia-XX` — contenido del currículo.

### Sincronización
```bash
# Primera vez (después de crear repo remoto en GitHub)
git remote add origin https://github.com/tu-usuario/lectura-rapida-app.git
git branch -M main
git push -u origin main

# Trabajo diario
git add .
git commit -m "feat: ..."
git push

# Sincronizar antes de empezar
git pull --rebase origin main
```

### Commits iniciales de este plano
1. `docs: plano maestro, README y descripción inicial`
2. `chore: estructura inicial y .gitignore`
3. `docs: método L.E.E.R.+R. y currículo 28 días`

## 7. Criterios de calidad

- **Pedagógico:** cada ejercicio explica QUÉ entrena y CÓMO medirlo.
- **Medición honesta:** ppm se calcula con tiempo real y comprensión real, no auto-reportada.
- **Accesible:** funciona con teclado, contraste AA, sin dependencia de color.
- **Sin fricción:** empezar en <30 segundos, sin registro obligatorio.
- **Sin humo:** no promete 1000 ppm en 1 día. Promete progreso medible en 28 días.

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
| :--- | :--- |
| Usuario prioriza velocidad y pierde comprensión | Bloqueo automático si comprensión <70% |
| Abandono a mitad del curso | Sesiones de 20 min, racha, recordatorios SRS |
| Textos aburridos / no relevantes | Biblioteca por tema + importar tus textos en v2 |
| Medición imprecisa en móvil | Cronómetro + validación de tiempo mínimo por texto |

## 9. Siguiente paso inmediato

Después de este plano, el siguiente commit es **Fase 1**: crear `src/features/diagnostico` con el test de velocidad y comprensión.

> Si quieres, en el siguiente mensaje dime: "continúa con Fase 1" y construyo el MVP funcional en esta misma estructura.
