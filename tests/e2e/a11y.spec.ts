import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { seed } from './seed'

test.setTimeout(300000)

const ROUTES = [
  '',
  'programa',
  'programa/dia/1',
  'diagnostico',
  'practica',
  'practica/practica-1',
  'leer',
  'biblioteca',
  'biblioteca/importar',
  'biblioteca/fisico',
  'biblioteca/1',
  'repasar',
  'fichas',
  'atencion',
  'glosario',
  'cuaderno',
  'fuentes',
  'proyectos',
  'proyectos/1',
  'progreso',
  'ajustes',
]
const THEMES = ['light', 'sepia', 'dark'] as const

test('sin violaciones de accesibilidad (axe) en ninguna pantalla ni tema', async ({ page }) => {
  await seed(page)
  const serious: string[] = []
  const other: string[] = []
  for (const theme of THEMES) {
    await page.evaluate((t) => localStorage.setItem('lectura-rapida.theme', t), theme)
    for (const route of ROUTES) {
      await page.goto(`./#/${route}`)
      await page.reload()
      await page.locator('main h1, main h2').first().waitFor()
      await page.waitForTimeout(300)
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
      for (const v of violations) {
        const line = `[${theme}] /${route} ${v.impact} ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`
        ;(v.impact === 'serious' || v.impact === 'critical' ? serious : other).push(line)
      }
    }
  }
  expect(serious, serious.join('\n')).toEqual([])
  expect(other, other.join('\n')).toEqual([])
})

test('sin violaciones en los estados interactivos (lectura, sondeo, cuestionario, anotación, editor, repaso)', async ({ page }) => {
  await page.clock.install()
  await seed(page)
  const found: string[] = []
  const audit = async (label: string) => {
    await page.waitForTimeout(200)
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
    for (const v of violations) found.push(`${label} ${v.impact} ${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
  }
  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate((t) => localStorage.setItem('lectura-rapida.theme', t), theme)
    await page.goto('./#/diagnostico')
    await page.reload()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByRole('button', { name: 'Empezar a leer' }).click()
    await audit(`[${theme}] lectura`)
    await page.clock.fastForward('03:00')
    await page.getByRole('dialog').waitFor()
    await audit(`[${theme}] sondeo`)
    await page.getByRole('dialog').getByRole('button').first().click()
    await page.getByRole('button', { name: 'Terminé' }).click()
    await audit(`[${theme}] cuestionario`)
    for (const group of await page.locator('fieldset').all()) await group.locator('input[type="radio"]').first().check()
    await page.getByRole('button', { name: 'Enviar respuestas' }).click()
    await page.getByText(/\d+ ppm/).first().waitFor()
    await audit(`[${theme}] resultados`)

    await page.goto('./#/biblioteca/1')
    await page.locator('[data-paragraph="0"]').waitFor()
    await page.evaluate(() => {
      const node = document.querySelector('[data-paragraph="0"]')!.lastChild as Text
      const range = document.createRange()
      range.setStart(node, 0)
      range.setEnd(node, Math.min(10, node.data.length))
      getSelection()!.removeAllRanges()
      getSelection()!.addRange(range)
      document.querySelector('[data-paragraph="0"]')!.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    })
    await page.getByRole('region', { name: 'Anotar la selección' }).waitFor()
    await audit(`[${theme}] anotación`)

    await page.goto('./#/proyectos/1')
    await page.getByRole('button', { name: 'Añadir notas' }).click()
    await audit(`[${theme}] selector de notas`)

    await page.goto('./#/repasar')
    await page.getByRole('button', { name: 'Mostrar respuesta' }).click()
    await audit(`[${theme}] repaso`)
  }
  expect(found, found.join('\n')).toEqual([])
})
