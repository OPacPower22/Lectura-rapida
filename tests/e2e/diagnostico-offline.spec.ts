import { expect, test } from '@playwright/test'

test('el diagnóstico se completa sin conexión tras la primera visita', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // La primera carga puede no estar controlada aún por el service worker.
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Lee con atención. Recuerda lo que lees.' })).toBeVisible()

  await page.getByRole('link', { name: 'Haz tu diagnóstico' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Empezar a leer' }).click()
  await page.waitForTimeout(6000)
  await page.getByRole('button', { name: 'Terminé' }).click()

  for (const group of await page.locator('fieldset').all()) {
    await group.locator('input[type="radio"]').first().check()
  }
  await page.getByRole('button', { name: 'Enviar respuestas' }).click()
  await expect(page.getByText(/\d+ ppm/).first()).toBeVisible()

  await page.getByRole('link', { name: 'Ver mi progreso' }).click()
  await page.getByRole('tab', { name: 'Historial' }).click()
  await expect(page.getByRole('tabpanel').getByRole('row')).toHaveCount(2)
})
