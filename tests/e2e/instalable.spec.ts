import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, expect, test } from '@playwright/test'

const BASE = 'http://localhost:4173/Lectura-rapida/'
const ROUTES = ['', '#/programa', '#/practica', '#/biblioteca', '#/cuaderno', '#/fuentes', '#/proyectos', '#/progreso', '#/ajustes', '#/repasar', '#/glosario', '#/atencion']

test('la app es instalable y todas las rutas funcionan sin conexión', async () => {
  // Contexto persistente: en uno efímero (incógnito) Chrome nunca ofrece instalar.
  const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'pwa-')), {
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
  })
  try {
    const page = context.pages()[0] ?? (await context.newPage())
    await page.goto(BASE)
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await page.reload()
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)

    const cdp = await context.newCDPSession(page)
    const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as { installabilityErrors: { errorId: string }[] }
    expect(installabilityErrors.map((e) => e.errorId)).toEqual([])

    const manifest = await page.evaluate(async () => {
      const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!.href
      return (await fetch(href)).json()
    })
    expect(manifest).toMatchObject({ name: 'Lectura Rápida', short_name: 'Lectura', display: 'standalone', start_url: '/Lectura-rapida/', lang: 'es' })
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)

    await context.setOffline(true)
    for (const route of ROUTES) {
      await page.goto(BASE + route)
      await page.reload()
      await expect(page.locator('main h1').first(), `sin conexión: /${route}`).toBeVisible()
    }
  } finally {
    await context.close()
  }
})
