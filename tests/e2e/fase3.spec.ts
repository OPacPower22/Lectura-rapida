import { expect, test, type Page } from '@playwright/test'

test.setTimeout(240000)

/** Lectura medida de un texto: propósito → leer 6 s → cuestionario → continuar. */
async function readText(page: Page) {
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await page.getByRole('button', { name: 'Empezar a leer' }).click()
  await page.clock.fastForward('00:06')
  await page.getByRole('button', { name: 'Terminé' }).click()
  for (const group of await page.locator('fieldset').all()) await group.locator('input[type="radio"]').first().check()
  await page.getByRole('button', { name: 'Enviar respuestas' }).click()
  await expect(page.getByText(/\d+ ppm/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
}

async function lesson(page: Page) {
  await page.getByRole('button', { name: 'Lección leída' }).click()
}

async function attention(page: Page) {
  await page.getByRole('button', { name: 'Empezar la respiración' }).click()
  await page.getByRole('button', { name: 'Me distraje y volví' }).click()
  await page.clock.fastForward('00:20')
  await page.getByRole('button', { name: 'Terminar antes' }).click()
  await page.getByRole('button', { name: 'Ejercicio hecho' }).click()
}

async function nextDay(page: Page, day: number) {
  await expect(page.getByText(`Día ${day} completado`)).toBeVisible()
  await page.getByRole('link', { name: `Ir al día ${day + 1}` }).click()
}

test('fase 3: días 1 a 7 completos, recarga a mitad de día y retención a 24 h', async ({ page }) => {
  await page.clock.install()
  await page.goto('./#/programa')
  await page.getByRole('link', { name: 'Empezar el día 1' }).click()

  // Día 1: lección + diagnóstico
  await lesson(page)
  await page.getByRole('button', { name: 'Continuar', exact: true }).click() // tipo de texto
  await readText(page)
  await nextDay(page, 1)

  // Día 2: atención 2 min + práctica
  await lesson(page)
  await attention(page)
  await readText(page)
  await nextDay(page, 2)

  // Día 3: recarga a mitad de día conserva la lección
  await lesson(page)
  await expect(page.getByRole('button', { name: 'Empezar la respiración' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('✓ Lección')).toBeVisible()
  await attention(page)
  await readText(page)
  await nextDay(page, 3)

  // Día 4: bloque de enfoque
  await lesson(page)
  for (const label of ['El móvil está lejos o en silencio', 'Las notificaciones están desactivadas', 'Solo tengo abierta esta lectura'])
    await page.getByLabel(label).check()
  await page.getByRole('button', { name: 'Empezar', exact: true }).click()
  await readText(page)
  await nextDay(page, 4)

  // Día 5: hojeo de 90 s
  await lesson(page)
  await page.getByRole('button', { name: 'Empezar', exact: true }).click()
  await page.clock.fastForward('01:31')
  for (const n of [1, 2, 3]) await page.getByLabel(`Idea ${n}`).fill(`idea ${n}`)
  await page.getByRole('button', { name: 'Ejercicio hecho' }).click()
  await readText(page)
  await nextDay(page, 5)

  // Día 6: preguntas antes de leer (se muestran durante la lectura)
  await lesson(page)
  for (const n of [1, 2, 3]) await page.getByLabel(`Pregunta ${n}`).fill(`¿Pregunta propia ${n}?`)
  await page.getByRole('button', { name: 'Ejercicio hecho' }).click()
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await expect(page.getByText('¿Pregunta propia 1?')).toBeVisible()
  await page.getByRole('button', { name: 'Empezar a leer' }).click()
  await page.clock.fastForward('00:06')
  await page.getByRole('button', { name: 'Terminé' }).click()
  for (const group of await page.locator('fieldset').all()) await group.locator('input[type="radio"]').first().check()
  await page.getByRole('button', { name: 'Enviar respuestas' }).click()
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await nextDay(page, 6)

  // Día 7: re-test
  await lesson(page)
  await readText(page)
  await expect(page.getByText('Día 7 completado')).toBeVisible()

  await page.getByRole('link', { name: 'Programa', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Empezar el día 8' })).toBeVisible()

  // Retención: 25 h después aparece el cuestionario de 24 h
  await page.clock.fastForward('25:00:00')
  await page.getByRole('link', { name: 'Inicio' }).click()
  await page.getByRole('button', { name: /Comprobar cuánto recuerdas/ }).first().click()
  for (const group of await page.locator('fieldset').all()) await group.locator('input[type="radio"]').first().check()
  await page.getByRole('button', { name: 'Enviar respuestas' }).click()
  await expect(page.getByText(/Retención: \d+ %/)).toBeVisible()
})

test('fase 3: crear una ficha desde el lector y repasarla', async ({ page }) => {
  await page.goto('./#/biblioteca/importar')
  await page.getByRole('tab', { name: 'Pegar texto o artículo' }).click()
  await page.getByLabel('Pega aquí el texto o el artículo').fill('La sacada es un salto rápido del ojo entre dos fijaciones.\n\nOtro párrafo de prueba.')
  await page.getByRole('button', { name: 'Procesar' }).click()
  await page.getByRole('button', { name: 'Guardar y abrir' }).click()
  await page.locator('[data-paragraph="0"]').waitFor()
  await page.evaluate(() => {
    const node = document.querySelector('[data-paragraph="0"]')!.firstChild as Text
    const start = node.data.indexOf('salto rápido del ojo')
    const range = document.createRange()
    range.setStart(node, start)
    range.setEnd(node, start + 'salto rápido del ojo'.length)
    getSelection()!.removeAllRanges()
    getSelection()!.addRange(range)
  })
  await page.getByRole('button', { name: 'Ficha' }).click()
  await page.getByLabel('Pregunta (anverso)').fill('¿Qué es una sacada?')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await page.getByRole('link', { name: /Repasar/ }).click()
  await expect(page.getByText('¿Qué es una sacada?')).toBeVisible()
  await page.getByRole('button', { name: 'Mostrar respuesta' }).click()
  await expect(page.getByText('salto rápido del ojo')).toBeVisible()
  await page.getByRole('button', { name: /Bien/ }).click()
  await expect(page.getByText('Repaso completado: 1 ficha')).toBeVisible()
})
