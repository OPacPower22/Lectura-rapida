/// <reference types="node" />
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import JSZip from 'jszip'
import { importEpub } from './epub'
import { t } from '../../i18n'

const fixture = async (name: string) => {
  const buf = await readFile(resolve(process.cwd(), 'tests/fixtures', name))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

describe('importEpub', () => {
  it('lee metadatos y capítulos en el orden de lectura, omitiendo los vacíos', async () => {
    const doc = await importEpub(await fixture('muestra.epub'))
    expect(doc.title).toBe('Libro de muestra')
    expect(doc.author).toBe('Autora de Prueba')
    expect(doc.lang).toBe('es')
    expect(doc.chapters.map((c) => c.title)).toEqual(['Capítulo uno', 'Capítulo dos'])
    expect(doc.chapters[0].paragraphs[0]).toContain('presenta a la protagonista')
    expect(doc.chapters[1].paragraphs).toContain('«Todo mapa es una promesa», dice la nota.')
    expect(doc.source).toMatchObject({ type: 'libro', title: 'Libro de muestra', author: 'Autora de Prueba', year: '1905' })
  })

  it('el título del capítulo no se repite como párrafo', async () => {
    const doc = await importEpub(await fixture('muestra.epub'))
    expect(doc.chapters[0].paragraphs).not.toContain('Capítulo uno')
  })

  it('rechaza libros con DRM', async () => {
    await expect(importEpub(await fixture('drm.epub'))).rejects.toMatchObject({ code: 'drm' })
  })

  it('acepta libros que solo ofuscan fuentes tipográficas (no es DRM)', async () => {
    const zip = await JSZip.loadAsync(await fixture('muestra.epub'))
    zip.file(
      'META-INF/encryption.xml',
      `<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:enc="http://www.w3.org/2001/04/xmlenc#"><enc:EncryptedData><enc:EncryptionMethod Algorithm="http://www.idpf.org/2008/embedding"/><enc:CipherData><enc:CipherReference URI="OEBPS/fonts/letra.otf"/></enc:CipherData></enc:EncryptedData></encryption>`,
    )
    const doc = await importEpub(await zip.generateAsync({ type: 'arraybuffer' }))
    expect(doc.chapters).toHaveLength(2)
  })

  it('rechaza archivos que no son EPUB', async () => {
    await expect(importEpub(new ArrayBuffer(10))).rejects.toMatchObject({ code: 'invalid' })
  })

  it('usa un título de respaldo traducible si falta dc:title', async () => {
    const zip = await JSZip.loadAsync(await fixture('muestra.epub'))
    const opf = (await zip.file('OEBPS/content.opf')!.async('text')).replace(/<dc:title>[^<]*<\/dc:title>/, '')
    zip.file('OEBPS/content.opf', opf)
    const doc = await importEpub(await zip.generateAsync({ type: 'arraybuffer' }))
    expect(doc.title).toBe(t('import.untitledBook'))
  })
})
