import { importHtml } from './web'
import { ImportError } from './types'

const paragraph = (n: number) =>
  `<p>Este es el párrafo número ${n} del artículo de prueba, con suficientes palabras para que el extractor lo considere contenido principal y no ruido de la página.</p>`

const page = `<!doctype html><html><head><title>Título | Sitio</title></head><body>
<nav><a href="/">Inicio</a> <a href="/otro">Menú de navegación</a></nav>
<aside class="ads">Publicidad: compre ahora</aside>
<article>
  <h1>Título del artículo</h1>
  <p class="byline">Por Ana Pérez</p>
  ${[1, 2, 3, 4, 5].map(paragraph).join('\n')}
</article>
<footer>Pie de página del sitio</footer>
</body></html>`

describe('importHtml', () => {
  it('extrae el contenido principal sin navegación ni publicidad', () => {
    const doc = importHtml(page, { url: 'https://ejemplo.org/articulo' })
    const all = doc.chapters.flatMap((c) => c.paragraphs).join('\n')
    expect(all).not.toMatch(/Menú de navegación|Publicidad|Pie de página/)
    for (const n of [1, 2, 3, 4, 5]) expect(all).toContain(`párrafo número ${n}`)
    expect(doc.title).toMatch(/Título/)
    expect(doc.source).toMatchObject({ type: 'web', url: 'https://ejemplo.org/articulo' })
  })

  it('abre un capítulo por cada encabezado h2', () => {
    const html = `<html><body><article>${paragraph(1)}<h2>Segunda parte</h2>${paragraph(2)}${paragraph(3)}<h2>Tercera parte</h2>${paragraph(4)}${paragraph(5)}</article></body></html>`
    const doc = importHtml(html)
    expect(doc.chapters.map((c) => c.title).slice(-2)).toEqual(['Segunda parte', 'Tercera parte'])
  })

  it('usa el primer h1 como título si el HTML pegado no trae <title>', () => {
    const html = `<html><body><article><h1>Artículo pegado</h1>${[1, 2, 3, 4, 5].map(paragraph).join('')}</article></body></html>`
    expect(importHtml(html).title).toBe('Artículo pegado')
  })

  it('rechaza una página sin contenido', () => {
    expect(() => importHtml('<html><body></body></html>')).toThrow(ImportError)
  })
})
