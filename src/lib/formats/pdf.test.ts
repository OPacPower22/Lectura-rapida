// @vitest-environment node
/// <reference types="node" />
import { readFile } from 'node:fs/promises'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { importPdf } from './pdf'
import { ImportError } from './types'

const fixture = async (name: string) => {
  const buf = await readFile(new URL(`../../../tests/fixtures/${name}`, import.meta.url))
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
    const bytes = new Uint8Array(64).map((_, i) => i).buffer
    await expect(importPdf(bytes, { getDocument })).rejects.toBeInstanceOf(ImportError)
    await expect(importPdf(bytes, { getDocument })).rejects.toMatchObject({ code: 'invalid' })
  })
})
