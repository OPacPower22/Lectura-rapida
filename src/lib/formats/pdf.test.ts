// @vitest-environment node
/// <reference types="node" />
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { importPdf } from './pdf'
import { ImportError } from './types'

const fixture = async (name: string) => {
  const buf = await readFile(resolve(process.cwd(), 'tests/fixtures', name))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

describe('importPdf', () => {
  it('extrae párrafos con su página, sin encabezados y sin palabras partidas', async () => {
    const progress: number[] = []
    const doc = await importPdf(await fixture('muestra.pdf'), {
      getDocument,
      onProgress: (page) => progress.push(page),
    })
    expect(doc.title).toBe('Documento de muestra')
    expect(doc.author).toBe('Autora de Prueba')
    const [chapter] = doc.chapters
    const text = chapter.paragraphs.join('\n')
    expect(text).not.toContain('Revista de prueba')
    expect(text).toContain('comprensión del texto')
    expect(chapter.paragraphs.some((p) => p.includes('lector que empieza un capítulo difícil'))).toBe(true)
    expect(new Set(chapter.pages)).toEqual(new Set([1, 2, 3]))
    expect(chapter.pages).toHaveLength(chapter.paragraphs.length)
    expect(progress).toEqual([1, 2, 3])
    expect(doc.source).toMatchObject({ type: 'documento', title: 'Documento de muestra', author: 'Autora de Prueba' })
  })

  it('rechaza un PDF escaneado sin capa de texto', async () => {
    await expect(importPdf(await fixture('escaneado.pdf'), { getDocument })).rejects.toMatchObject({ code: 'no-text' })
  })

  it('rechaza datos que no son un PDF', async () => {
    const bytes = () => new Uint8Array(64).map((_, i) => i).buffer
    await expect(importPdf(bytes(), { getDocument })).rejects.toBeInstanceOf(ImportError)
    await expect(importPdf(bytes(), { getDocument })).rejects.toMatchObject({ code: 'invalid' })
  })

  it('separa dos columnas aunque compartan las líneas base', async () => {
    const doc = await importPdf(await fixture('columnas.pdf'), { getDocument })
    expect(doc.chapters[0].paragraphs).toEqual([
      'Columna izquierda, primera línea que sigue en la segunda línea y termina en la tercera.',
      'Columna derecha, primera línea que sigue en la segunda línea y termina en la tercera.',
    ])
  })

  it('quita encabezados alternos y números de página, respeta sangrías y páginas', async () => {
    const doc = await importPdf(await fixture('libro.pdf'), { getDocument })
    const [chapter] = doc.chapters
    expect(chapter.paragraphs).toEqual([
      'Primer párrafo del libro, que empieza con sangría y termina aquí.',
      'Segundo párrafo, también con sangría, que continúa en la página siguiente sin cortar la frase a la mitad.',
      'Tercer párrafo de la segunda página.',
      'Cuarto párrafo en la tercera página.',
      'Quinto y último párrafo.',
    ])
    expect(chapter.pages).toEqual([1, 1, 2, 3, 4])
  })

  it('libera el documento de pdfjs al terminar', async () => {
    const destroyed = vi.fn()
    const tracked = ((args: Parameters<typeof getDocument>[0]) => {
      const task = getDocument(args)
      const original = task.destroy.bind(task)
      task.destroy = async () => {
        destroyed()
        return original()
      }
      return task
    }) as typeof getDocument
    await importPdf(await fixture('muestra.pdf'), { getDocument: tracked })
    expect(destroyed).toHaveBeenCalled()
    await expect(importPdf(await fixture('escaneado.pdf'), { getDocument: tracked })).rejects.toMatchObject({ code: 'no-text' })
    expect(destroyed).toHaveBeenCalledTimes(2)
  })
})
