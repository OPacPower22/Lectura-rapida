import { expect, test, type Page } from '@playwright/test'

test.setTimeout(150000)

async function selectText(page: Page, paragraph: number, text: string) {
  await page.evaluate(
    ({ paragraph, text }) => {
      const el = document.querySelector(`[data-paragraph="${paragraph}"]`)!
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode() as Text | null
      while (node && !node.data.includes(text)) node = walker.nextNode() as Text | null
      if (!node) throw new Error(`texto no encontrado: ${text}`)
      const start = node.data.indexOf(text)
      const range = document.createRange()
      range.setStart(node, start)
      range.setEnd(node, start + text.length)
      const selection = getSelection()!
      selection.removeAllRanges()
      selection.addRange(range)
    },
    { paragraph, text },
  )
}

async function importFile(page: Page, file: string) {
  await page.goto('./#/biblioteca/importar')
  await page.getByLabel('Elige un archivo PDF o EPUB').setInputFiles(file)
  await page.getByRole('button', { name: 'Guardar y abrir' }).click()
}

test('fase 2: leer y anotar PDF, EPUB, web y libro físico, también sin conexión', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })

  await test.step('PDF: subrayar y ver la página original', async () => {
    await importFile(page, 'tests/fixtures/muestra.pdf')
    await page.getByText('comprensión del texto').first().waitFor()
    await selectText(page, 1, 'comprensión')
    await page.getByRole('button', { name: 'Subrayar' }).click()
    await expect(page.locator('mark', { hasText: 'comprensión' })).toBeVisible()
    await expect(page.getByText('Subrayado · pág. 1')).toBeVisible()
    await page.getByRole('button', { name: 'Ver página original' }).click()
    await expect
      .poll(() => page.locator('canvas').evaluate((c: HTMLCanvasElement) => c.width * c.height))
      .toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Cerrar' }).click()
  })

  await test.step('EPUB: sesión cronometrada en el capítulo 2', async () => {
    await importFile(page, 'tests/fixtures/muestra.epub')
    await page.getByLabel('Capítulo', { exact: true }).selectOption({ label: 'Capítulo dos' })
    await expect(page.getByRole('heading', { name: 'Capítulo dos' })).toBeVisible()
    await page.getByRole('button', { name: 'Empezar sesión cronometrada' }).click()
    await page.waitForTimeout(6000)
    await page.getByRole('button', { name: 'Terminé' }).click()
    await page.getByRole('button', { name: 'Confirmar' }).click()
    await expect(page.getByText(/\d+ ppm/).first()).toBeVisible()
    await page.getByRole('link', { name: 'Progreso' }).click()
    await expect(page.getByRole('cell', { name: /Documento/ }).first()).toBeVisible()
  })

  await test.step('Artículo web pegado: palabra al glosario', async () => {
    await page.goto('./#/biblioteca/importar')
    await page.getByRole('tab', { name: 'Pegar texto o artículo' }).click()
    const paragraphs = [1, 2, 3, 4, 5]
      .map((n) => `<p>Párrafo ${n} del artículo de prueba sobre la metacognición y la lectura atenta, con texto suficiente para el extractor.</p>`)
      .join('')
    const html = `<article><h1>Artículo de la web</h1>${paragraphs}</article>`
    await page.getByLabel('Pega aquí el texto o el artículo').evaluate((el, html) => {
      const data = new DataTransfer()
      data.setData('text/html', html)
      data.setData('text/plain', 'Artículo de la web')
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
    }, html)
    await page.getByRole('button', { name: 'Procesar' }).click()
    await page.getByRole('button', { name: 'Guardar y abrir' }).click()
    await page.getByText('Párrafo 1 del artículo').waitFor()
    await selectText(page, 0, 'metacognición')
    await page.getByRole('button', { name: 'Glosario' }).click()
    await page.getByLabel('Definición').fill('conciencia del propio pensamiento')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await page.getByRole('link', { name: 'Glosario' }).click()
    await expect(page.getByText('metacognición', { exact: true })).toBeVisible()
  })

  await test.step('Libro físico: sesión con páginas', async () => {
    await page.goto('./#/biblioteca/fisico')
    await page.getByRole('radio', { name: 'Un libro nuevo' }).check()
    await page.getByLabel('Título').fill('Libro de papel')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByLabel('Página inicial').fill('10')
    await page.getByRole('button', { name: 'Continuar' }).click()
    for (const n of [1, 2, 3]) await page.getByLabel(`Palabras en la línea ${n}`).fill('10')
    await page.getByLabel('Líneas por página').fill('30')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('button', { name: 'Empezar a leer' }).click()
    await page.waitForTimeout(6000)
    await page.getByRole('button', { name: 'Terminé' }).click()
    await page.getByLabel(/Página final/).fill('11')
    await page.getByRole('button', { name: 'Guardar sesión' }).click()
    // 2 páginas en 6 s es una velocidad poco creíble: la app pide revisar; aquí se guarda igual.
    await expect(page.getByRole('alert')).toContainText('poco creíble')
    await page.getByRole('button', { name: 'Guardar igual' }).click()
    await expect(page.getByText(/\d+ ppm/).first()).toBeVisible()
    await page.getByRole('link', { name: 'Progreso' }).click()
    await expect(page.getByText('págs. 10-11')).toBeVisible()
  })

  await test.step('Sin conexión: la biblioteca sigue disponible', async () => {
    await context.setOffline(true)
    await page.goto('./#/biblioteca')
    await page.reload()
    await expect(page.getByRole('link', { name: 'Continuar' })).toHaveCount(3)
  })
})

test('«Compartir» abre la pantalla de importación con el enlace', async ({ page }) => {
  await page.goto('./compartir?title=Nota&url=https%3A%2F%2Fejemplo.org%2Fa')
  await expect(page.getByRole('heading', { name: 'Añadir a la biblioteca' })).toBeVisible()
  await expect(page.getByText(/https:\/\/ejemplo\.org\/a/)).toBeVisible()
})

test('la posición de lectura se conserva al salir por el menú y al recargar', async ({ page }) => {
  await page.goto('./#/biblioteca/importar')
  await page.getByRole('tab', { name: 'Pegar texto o artículo' }).click()
  const text = Array.from({ length: 80 }, (_, i) => `Párrafo número ${i} con varias palabras para ocupar espacio en la pantalla del lector.`).join('\n\n')
  await page.getByLabel('Pega aquí el texto o el artículo').fill(text)
  await page.getByRole('button', { name: 'Procesar' }).click()
  await page.getByRole('button', { name: 'Guardar y abrir' }).click()
  await page.locator('[data-paragraph="40"]').scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    const el = document.querySelector('[data-paragraph="40"]') as HTMLElement
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 150)
  })
  await page.waitForTimeout(400)
  const firstVisible = async () =>
    page.evaluate(() => {
      const header = document.querySelector('header')!.getBoundingClientRect().bottom
      const els = [...document.querySelectorAll<HTMLElement>('[data-paragraph]')]
      const el = els.find((p) => {
        const r = p.getBoundingClientRect()
        return (r.top + r.bottom) / 2 > header + 60
      })
      return Number(el?.dataset.paragraph)
    })
  const before = await firstVisible()
  expect(before).toBeGreaterThan(30)

  await page.getByRole('link', { name: 'Biblioteca' }).click()
  await page.getByRole('link', { name: 'Continuar' }).click()
  await page.locator('[data-paragraph="0"]').waitFor()
  await page.waitForTimeout(400)
  expect(Math.abs((await firstVisible()) - before)).toBeLessThanOrEqual(1)

  await page.reload()
  await page.locator('[data-paragraph="0"]').waitFor()
  await page.waitForTimeout(400)
  expect(Math.abs((await firstVisible()) - before)).toBeLessThanOrEqual(1)
})
