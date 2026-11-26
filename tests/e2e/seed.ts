import type { Page } from '@playwright/test'

/**
 * Datos de ejemplo escritos directamente en IndexedDB (esquema v4), después de que la app haya creado la base.
 * Deja: una fuente con documento de texto, una nota, una lectura con cuestionario, una ficha vencida y un proyecto.
 */
export async function seed(page: Page): Promise<void> {
  await page.goto('./')
  await page.getByRole('heading', { level: 1 }).first().waitFor()
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('lectura-rapida')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const now = Date.now()
    const put = (store: string, value: unknown) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite')
        tx.objectStore(store).put(value)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    await put('sources', { id: 1, type: 'libro', title: 'Libro de ejemplo', author: 'Pérez, A.', year: '2020', createdAt: now })
    await put('documents', {
      id: 1,
      sourceId: 1,
      format: 'texto',
      lang: 'es',
      title: 'Libro de ejemplo',
      chapters: [{ title: 'Capítulo uno', paragraphs: ['La atención sostenida es la base de la lectura de estudio.', 'Un segundo párrafo para el lector.'] }],
      words: 20,
      position: { chapter: 0, paragraph: 0 },
      createdAt: now,
      lastOpenedAt: now,
    })
    await put('notes', { id: 1, sourceId: 1, documentId: 1, anchor: { chapter: 0, paragraph: 0, start: 3, end: 22 }, kind: 'cita', quote: 'atención sostenida', text: 'Idea clave', lang: 'es', tags: ['tesis'], createdAt: now })
    await put('readingSessions', { id: 1, kind: 'practica', textId: 'practica-1', textKind: 'expositivo', lang: 'es', startedAt: now - 3600_000, endedAt: now - 3400_000, activeMs: 180000, words: 600, wpm: 200 })
    await put('quizResults', { id: 1, sessionId: 1, textId: 'practica-1', answers: [], correct: 4, total: 5, deferred: false, at: now - 3400_000 })
    await put('probes', { id: 1, sessionId: 1, at: now - 3500_000, answer: 'texto' })
    await put('cards', {
      id: 1,
      kind: 'ficha',
      front: '¿Qué es la atención sostenida?',
      back: 'Mantener el foco en una tarea.',
      lang: 'es',
      fsrs: { due: new Date(now - 60000), stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, learning_steps: 0, reps: 0, lapses: 0, state: 0 },
      createdAt: now,
    })
    await put('glossary', { id: 1, term: 'sacada', lang: 'es', definition: 'Salto rápido del ojo.', createdAt: now })
    await put('projects', {
      id: 1,
      title: 'Trazado de ejemplo',
      kind: 'trazado',
      topic: 'La atención',
      thesis: 'Se entrena',
      lang: 'es',
      sections: [{ id: 's1', title: 'Introducción', items: [{ id: 'i1', type: 'note', noteId: 1 }, { id: 'i2', type: 'text', text: 'Párrafo propio.' }] }],
      createdAt: now,
      updatedAt: now,
    })
    db.close()
  })
}
