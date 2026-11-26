import { expect, test, type Page } from '@playwright/test'

/** Pulsa Tab hasta que el foco llegue a un elemento cuyo texto o etiqueta coincida. */
async function tabTo(page: Page, name: RegExp, max = 80) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      // Solo controles: el texto de <body> o de un encabezado contiene el de todos los botones.
      if (!el || !el.matches('a[href], button, input, select, textarea')) return ''
      const labelled = el.getAttribute('aria-label') ?? (el as HTMLInputElement).labels?.[0]?.textContent ?? ''
      return `${labelled} ${el.textContent ?? ''}`.trim()
    })
    if (name.test(label)) return
  }
  throw new Error(`No se llegó con Tab a ${name}`)
}

async function focusVisible(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const style = getComputedStyle(el)
    return el.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2
  })
}

test('el diagnóstico se completa solo con el teclado, con foco visible y títulos de página', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#contenido')).toBeFocused()

  await tabTo(page, /Haz tu diagnóstico/)
  expect(await focusVisible(page)).toBe(true)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: /Diagnóstico/ })).toBeFocused()
  await expect(page).toHaveTitle(/Diagnóstico.* · Lectura Rápida/)

  await tabTo(page, /^Continuar$/)
  await page.keyboard.press('Enter')
  await tabTo(page, /^Continuar$/)
  await page.keyboard.press('Enter')
  await tabTo(page, /Empezar a leer/)
  await page.keyboard.press('Enter')
  await page.clock.fastForward('00:10')
  await tabTo(page, /Terminé/)
  await page.keyboard.press('Enter')

  // Cuestionario: Tab entra en cada grupo de opciones y Espacio marca la primera.
  const groups = await page.locator('fieldset').count()
  expect(groups).toBeGreaterThan(0)
  for (let i = 0; i < groups; i++) {
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space')
  }
  await expect(page.locator('fieldset input[type="radio"]:checked')).toHaveCount(groups)
  await tabTo(page, /Enviar respuestas/)
  await page.keyboard.press('Enter')
  await expect(page.getByText(/\d+ ppm/).first()).toBeVisible()

  await tabTo(page, /Ver mi progreso/)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Progreso' })).toBeFocused()
  await expect(page).toHaveTitle('Progreso · Lectura Rápida')
})

test('con el sondeo de atención abierto, Tab no sale del diálogo y el foco vuelve a la lectura al responder', async ({ page }) => {
  await page.clock.install()
  await page.goto('./#/diagnostico')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Empezar a leer' }).click()
  await page.clock.fastForward('03:00')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: 'Me distraje' })).toBeFocused()
  await expect(page.locator('[inert]')).toHaveCount(0)
})
