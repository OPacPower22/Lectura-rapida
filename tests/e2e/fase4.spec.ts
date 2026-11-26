import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'

test.setTimeout(240000)

const SOFFICE = ['/usr/bin/soffice', '/usr/bin/libreoffice'].find((p) => existsSync(p))

const SOURCES = [
  { title: 'La atención sostenida', author: 'Pérez, A.', year: '2020', quote: 'atención sostenida', kind: 'Cita' },
  { title: 'Memoria y repaso', author: 'Ávila, R.', year: '2018', quote: 'repaso espaciado', kind: 'Paráfrasis' },
  { title: 'Leer con propósito', author: 'Zea, L.', year: '2021', quote: 'propósito claro', kind: 'Idea propia' },
]

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
      getSelection()!.removeAllRanges()
      getSelection()!.addRange(range)
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    },
    { paragraph, text },
  )
}

async function importText(page: Page, s: (typeof SOURCES)[number]) {
  await page.goto('./#/biblioteca/importar')
  await page.getByRole('tab', { name: 'Pegar texto o artículo' }).click()
  const body = [
    `Este texto trata sobre la ${s.quote} y su papel en la lectura de estudio.`,
    'Un segundo párrafo amplía la idea con ejemplos concretos y una conclusión breve.',
  ].join('\n\n')
  await page.getByLabel('Pega aquí el texto o el artículo').fill(body)
  await page.getByRole('button', { name: 'Procesar' }).click()
  await page.getByLabel('Título').fill(s.title)
  await page.getByLabel('Autor (opcional)').fill(s.author)
  await page.getByRole('button', { name: 'Guardar y abrir' }).click()
  await page.locator('[data-paragraph="1"]', { hasText: 'Un segundo párrafo' }).waitFor()
  await selectText(page, 0, s.quote)
  await page.getByRole('button', { name: 'Nota', exact: true }).click()
  await page.getByLabel('Tipo de nota').selectOption({ label: s.kind })
  await page.getByLabel('Tu nota').fill(`Comentario sobre «${s.title}» con ñ y acentos`)
  await page.getByRole('region', { name: 'Anotar la selección' }).getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText(`Comentario sobre «${s.title}»`).first()).toBeVisible()
}

test('fase 4: trazado con notas de 3 fuentes exportado a Word y Markdown, tablero, progreso y respaldo', async ({ page }) => {
  const dir = mkdtempSync(join(tmpdir(), 'fase4-'))
  await page.goto('./')

  await test.step('tres fuentes con notas de cita, paráfrasis e idea', async () => {
    for (const s of SOURCES) await importText(page, s)
    // Una sesión cronometrada para que el tablero y el progreso tengan datos.
    await page.getByRole('button', { name: 'Empezar sesión cronometrada' }).click()
    await page.waitForTimeout(6000)
    await page.getByRole('button', { name: 'Terminé' }).click()
    await page.getByRole('button', { name: 'Confirmar' }).click()
    await expect(page.getByText(/\d+ ppm/).first()).toBeVisible()
  })

  await test.step('fuentes: año de cada una y vista previa APA', async () => {
    await page.goto('./#/fuentes')
    for (const s of SOURCES) {
      const item = page.getByRole('article').filter({ has: page.locator(`input[value="${s.title}"]`) })
      await item.getByLabel('Año').fill(s.year)
      await item.getByRole('button', { name: 'Guardar fuente' }).click()
      await expect(item.getByText('Guardada.')).toBeVisible()
    }
    await expect(page.getByText('Pérez, A. (2020). La atención sostenida.')).toBeVisible()
  })

  await test.step('proyecto: trazado con 3 secciones, notas de las 3 fuentes y un párrafo propio', async () => {
    await page.goto('./#/proyectos')
    await page.getByLabel('Título del nuevo proyecto').fill('Trazado de prueba')
    await page.getByLabel('Tipo de proyecto').selectOption('trazado')
    await page.getByRole('button', { name: 'Crear proyecto' }).click()
    await page.getByRole('textbox', { name: 'Tema', exact: true }).fill('La atención en la lectura')
    await page.getByLabel('Tesis o idea central').fill('La atención se entrena con práctica deliberada')

    const intro = page.getByRole('region', { name: 'Introducción' })
    await intro.getByRole('button', { name: 'Añadir párrafo propio' }).click()
    await intro.getByLabel('Párrafo propio 1').fill('Este trazado reúne tres lecturas sobre la atención.')

    await page.getByRole('button', { name: 'Añadir sección' }).click()
    await page.getByRole('region', { name: 'Sección sin título' }).getByLabel('Título de la sección').fill('Desarrollo')
    const dev = page.getByRole('region', { name: 'Desarrollo' })
    await dev.getByRole('button', { name: 'Añadir notas' }).click()
    for (const s of SOURCES) await dev.getByRole('checkbox', { name: new RegExp(s.title) }).check()
    await dev.getByRole('button', { name: 'Añadir seleccionadas (3)' }).click()
    await expect(dev.getByText('(Pérez, 2020)')).toBeVisible()

    await page.getByRole('button', { name: 'Añadir sección' }).click()
    await page.getByRole('region', { name: 'Sección sin título' }).getByLabel('Título de la sección').fill('Conclusión')
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  await test.step('exportar a Word: contenido correcto y abre en LibreOffice', async () => {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar a Word (.docx)' }).click()])
    expect(download.suggestedFilename()).toBe('trazado-de-prueba.docx')
    const file = join(dir, 'trazado.docx')
    await download.saveAs(file)
    const zip = await JSZip.loadAsync(readFileSync(file))
    const xml = await zip.file('word/document.xml')!.async('string')
    expect(xml).toContain('Trazado de prueba')
    expect(xml).toContain('«atención sostenida»')
    expect(xml).toContain('(Pérez, 2020)')
    expect(xml).toContain('Este trazado reúne tres lecturas sobre la atención.')
    for (const s of SOURCES) expect(xml).toContain(s.title)
    expect(xml).toContain('Referencias')
    expect(xml).toContain('Ávila, R. (2018)')
    expect(xml).toContain('Zea, L. (2021)')

    if (!SOFFICE) {
      test.info().annotations.push({ type: 'aviso', description: 'LibreOffice no está instalado: se omite la conversión a PDF' })
      return
    }
    execFileSync(SOFFICE, ['--headless', '--convert-to', 'pdf', '--outdir', dir, file], { timeout: 120000 })
    const pdf = await PDFDocument.load(readFileSync(join(dir, 'trazado.pdf')))
    expect(pdf.getPageCount()).toBeGreaterThan(0)
  })

  await test.step('exportar a Markdown', async () => {
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar a Markdown' }).click()])
    const md = readFileSync(await download.path(), 'utf8')
    expect(md).toMatch(/^# Trazado de prueba/)
    expect(md).toContain('> «atención sostenida» (Pérez, 2020)')
    expect(md).toContain('## Referencias')
    expect(md).toContain('Pérez, A. (2020). *La atención sostenida*.')
  })

  await test.step('tablero: actividades y estadísticas', async () => {
    await page.getByRole('link', { name: 'Inicio' }).click()
    const acts = page.getByRole('region', { name: '¿Qué quieres hacer?' })
    for (const name of ['Prueba de velocidad y comprensión', 'Lectura de comprensión', 'Cuaderno', 'Proyectos de escritura']) {
      await expect(acts.getByRole('link', { name: new RegExp(name) })).toBeVisible()
    }
    const stats = page.getByRole('region', { name: 'Tus estadísticas' })
    await expect(stats.getByText('Minutos esta semana')).toBeVisible()
    await expect(stats.getByText('1 de los últimos 7')).toBeVisible()
  })

  await test.step('progreso: gráfica de minutos y CSV', async () => {
    await page.getByRole('link', { name: 'Progreso', exact: true }).click()
    await expect(page.getByRole('figure', { name: 'Minutos de práctica por semana' })).toBeVisible()
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar CSV' }).click()])
    const csv = readFileSync(await download.path(), 'utf8')
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('fecha,tipo,titulo')
    expect(csv).toContain('documento')
  })

  await test.step('respaldo: crear, borrar los datos y restaurar', async () => {
    await page.getByRole('link', { name: 'Ajustes' }).click()
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Crear respaldo' }).click()])
    const backup = join(dir, 'respaldo.zip')
    await download.saveAs(backup)

    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const req = indexedDB.deleteDatabase('lectura-rapida')
          req.onsuccess = () => resolve()
          req.onerror = () => reject(req.error)
        }),
    )
    await page.reload()
    await page.goto('./#/proyectos')
    await expect(page.getByText('Aún no tienes proyectos.')).toBeVisible()

    await page.goto('./#/ajustes')
    await page.getByLabel('Archivo de respaldo (.zip)').setInputFiles(backup)
    await expect(page.getByText('1 proyecto')).toBeVisible()
    await expect(page.getByText('3 notas')).toBeVisible()
    await page.getByRole('button', { name: 'Reemplazar mis datos' }).click()
    await expect(page.getByText('Respaldo restaurado.')).toBeVisible()

    await page.goto('./#/proyectos')
    await page.getByRole('link', { name: /Trazado de prueba/ }).click()
    await expect(page.getByRole('region', { name: 'Desarrollo' }).getByText('(Pérez, 2020)')).toBeVisible()
    await page.goto('./#/cuaderno')
    await expect(page.getByText('3 notas')).toBeVisible()
  })
})
