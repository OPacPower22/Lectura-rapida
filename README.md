# Lectura Rápida — Comprensión y Retención

> Domina la lectura rápida sin sacrificar lo que importa: entender y recordar lo que lees.
> De 200 ppm a 600+ ppm con comprensión ≥ 80% y retención a 7 días, en 28 días con 20 minutos diarios de práctica deliberada.

[Estado](https://img.shields.io/badge/estado-plano_y_MVP_en_construcción-blue)
[Licencia](https://img.shields.io/badge/licencia-MIT-green)
[Stack](https://img.shieldsoso/badge/stack-PWA_React_TypeScript-blueviolet)

## Descripción corta

Aplicación web progresiva (PWA) que enseña lectura rápida con comprensión y retención. No es un contador de palabras por minuto. Es un entrenador completo: diagnostica tu velocidad base, entrena tu mecánica ocular, elimina hábitos que te frenan, te enseña a leer por bloques de significado y te hace recordar con repetición espaciada y recuerdo activo.

**Para quién es:** estudiantes, profesionales y lectores que necesitan leer mucho, en poco tiempo, y recordarlo cuando importa.

**Promesa:** en el menor tiempo posible, no leyendo más rápido a ciegas, sino leyendo con método, medición y retención.

---

## El problema que resuelve

La mayoría lee como en primaria:

- Palabra por palabra, con subvocalización constante.
- Con regresiones (releer lo mismo 3-4 veces).
- Sin propósito, sin estructura y sin sistema para recordar.
- Resultado: 180-250 palabras por minuto (ppm), comprensión superficial y olvido del 70% a las 24 horas.

La lectura rápida no es pasar los ojos más deprisa. Es cambiar el sistema: ojos, cerebro y memoria trabajando juntos.

## El método: L.E.E.R. + R.

La app está construida sobre un método propio de 5 pasos, validado con práctica deliberada:

| Paso | Qué hace | Qué entrena |
| :--- | :--- | :--- |
| **L** — Localizar | Prelectura en 2 minutos: título, estructura, preguntas | Propósito y predicción |
| **E** — Enfocar | Guía visual y fijaciones amplias | Mecánica ocular, menos regresiones |
| **E** — Extraer | Lectura por bloques / chunks de significado | Velocidad sin subvocalizar |
| **R** — Retener | Recuerdo activo + mapa + resumen en tus palabras | Memoria a largo plazo |
| **+ R** — Repasar | Repetición espaciada a las 24h, 3 y 7 días | Curva del olvido bajo control |

**Principio no negociable:** si la comprensión baja de 70%, la velocidad baja. Primero se asegura comprensión, luego se acelera.

## Qué incluye la app

### 1. Diagnóstico inicial (Día 0)
- Test de velocidad base (ppm reales, no estimados).
- Test de comprensión inmediata (10 preguntas: literal, inferencial, crítica).
- Test de retención a las 24h.
- Perfil lector: tipo de freno principal (subvocalización, regresiones, fijación estrecha, falta de vocabulario/estructura).

### 2. Entrenador ocular y de velocidad
- **Tabla de Schulte** y expansión periférica.
- **Guía visual** con metrónomo: ritmo, amplitud de salto y reducción de fijaciones.
- **Lector RSVP** (Rapid Serial Visual Presentation) con velocidad controlable y tamaño de chunk ajustable.
- **Lectura por columnas** y lectura en Z / S para textos densos.
- **Anti-regresión:** modo que oculta lo ya leído para romper el hábito de volver atrás.

### 3. Currículo de 28 días (20 min/día)
- **Semana 1 — Desbloqueo (Días 1-7):** mecánica, postura, respiración, propósito, eliminar regresiones.
- **Semana 2 — Aceleración (Días 8-14):** chunks de 3-5 palabras, reducción de subvocalización, lectura flexible según tipo de texto.
- **Semana 3 — Comprensión (Días 15-21):** estructura textual, inferencia, SQ3R, preguntas antes de leer, mapas mentales.
- **Semana 4 — Dominio y Retención (Días 22-28):** velocidad adaptativa, repetición espaciada, Feynman, transferencia a tus libros y documentos reales.

Cada día = 1 micro-lección (3 min) + 1 ejercicio (7 min) + 1 lectura práctica con test (10 min).

### 4. Sistema de retención
- Resumen en tus palabras inmediatamente después de leer.
- Preguntas de recuerdo activo (sin mirar el texto).
- Tarjetas de repetición espaciada generadas de lo que leíste.
- Mapa mental rápido de 3 ramas: idea central, argumentos, ejemplos.
- Recordatorios inteligentes a las 24h / 3 días / 7 días.

### 5. Medición real
Dashboard con:
- **ppm** (velocidad), **% comprensión**, **% retención a 7 días**.
- **Índice de Lectura Efectiva (ILE)** = ppm × comprensión. Es la métrica que manda.
- Gráfica de progreso, racha, tiempo de práctica y textos completados.
- Exporta tu progreso a PDF/CSV.

### 6. Biblioteca graduada
- 120+ textos graduados por nivel y tema: narrativa, ensayo, ciencia, negocios, derecho, historia.
- Importa tus propios textos: pega texto, sube PDF / EPUB / URL (próximamente).
- Modo lectura: claro / sepia / oscuro, tipografía optimizada, ancho de línea ajustable.

### 7. Gamificación que sí sirve
- Niveles: Lector Base → Ágil → Veloz → Maestro.
- Logros por constancia, no solo por velocidad.
- Retos diarios de 5 minutos.

## Cómo se usa (flujo del usuario)

1. **Diagnóstico (10 min):** sabes dónde estás.
2. **Plan personalizado:** la app te asigna tu punto de partida y tu freno a trabajar.
3. **Entrena 20 min/día:** lección + ejercicio + lectura con test.
4. **Repaso espaciado:** la app te recuerda qué repasar y cuándo.
5. **Re-test cada 7 días:** ves tu ILE subir con evidencia, no con sensación.

## Instalación y desarrollo

### Requisitos
- Node.js 20+ / pnpm
- Navegador moderno (Chrome / Edge / Firefox)

### Inicio rápido
```bash
git clone https://github.com/tu-usuario/lectura-rapida-app.git
cd lectura-rapida-app
pnpm install
pnpm dev
# abre http://localhost:5173
```

### Scripts
```bash
pnpm dev          # desarrollo
pnpm build        # build producción
pnpm preview      # vista previa
pnpm test         # tests
pnpm lint         # lint
```

## Estructura del repositorio

```
lectura-rapida-app/
├── README.md
├── DESCRIPTION.md
├── docs/
│   ├── PLANO.md          # Plano maestro de construcción
│   ├── METODO.md         # Método L.E.E.R.+R. detallado
│   └── CURRICULO.md      # Currículo 28 días
├── src/
│   ├── app/              # Rutas y layouts
│   ├── features/
│   │   ├── diagnostico/
│   │   ├── entrenador/
│   │   ├── lector-rsvp/
│   │   ├── retencion/
│   │   └── dashboard/
│   ├── content/          # Textos graduados y lecciones
│   └── lib/              # Utilidades, cálculo de ppm, SRS
├── public/
└── tests/
```

## Roadmap

- [x] **Fase 0 — Plano y README** (este repo)
- [ ] **Fase 1 — MVP:** Diagnóstico + Entrenador ocular + Lector RSVP + Test de comprensión
- [ ] **Fase 2 — Currículo 28 días + Retención (SRS)**
- [ ] **Fase 3 — Dashboard + Biblioteca + Importar textos**
- [ ] **Fase 4 — PWA offline + Gamificación + Exportación**
- [ ] **Fase 5 — Evaluación con usuarios reales y ajuste del método**

Ver el detalle en [`docs/PLANO.md`](docs/PLANO.md).

## Métricas de éxito

La app se considera exitosa si el usuario promedio logra en 28 días:

- **+150% en velocidad** (ej. 220 → 550 ppm) manteniendo comprensión ≥ 80%
- **Retención ≥ 60% a 7 días** (vs. 20-30% sin sistema)
- **Reducción de regresiones en 70%**
- **Adherencia ≥ 80%** (22 de 28 días completados)

## Contribuir

1. Haz fork del repo.
2. Crea rama: `git checkout -b feat/nombre-del-cambio`
3. Commit con Conventional Commits: `feat:`, `fix:`, `docs:`, `content:`
4. Abre PR con descripción del cambio y captura si es UI.

## Licencia

MIT — Libre para usar, estudiar y mejorar, citando la fuente.

---

**Hecho para leer más, entender mejor y recordar lo que importa.**
