// Genera los archivos de prueba de tests/fixtures (PDF y EPUB). Uso: npm run fixtures
import { writeFile } from 'node:fs/promises'
import JSZip from 'jszip'
import { PDFDocument, StandardFonts } from 'pdf-lib'

const out = new URL('../tests/fixtures/', import.meta.url)

async function makePdf() {
  const pdf = await PDFDocument.create()
  pdf.setTitle('Documento de muestra')
  pdf.setAuthor('Autora de Prueba')
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const size = 12
  const lh = 16
  const pages = [
    [
      'La lectura atenta empieza con un propósito claro y una pregunta.',
      'Quien sabe qué busca dirige mejor su atención y recuerda más.',
      null,
      'El segundo párrafo trata de la compren-',
      'sión del texto: entender exige relacionar ideas nuevas con lo que',
      'ya sabemos, y por eso la prelectura ayuda tanto al lector que',
    ],
    [
      'empieza un capítulo difícil sin un mapa previo de su estructura.',
      null,
      'Un tercer párrafo explica que releer no es lo mismo que recordar.',
      'Recordar de memoria fortalece la retención mucho más que releer.',
    ],
    [
      'El último párrafo cierra el documento con una idea práctica.',
      'Repasar en el momento justo evita olvidar lo que se ha leído.',
    ],
  ]
  for (const lines of pages) {
    const page = pdf.addPage([595, 842])
    page.drawText('Revista de prueba', { x: 50, y: 800, size: 10, font })
    let y = 740
    for (const line of lines) {
      if (line === null) {
        y -= lh * 2
        continue
      }
      page.drawText(line, { x: 50, y, size, font })
      y -= lh
    }
  }
  await writeFile(new URL('muestra.pdf', out), await pdf.save())

  const scanned = await PDFDocument.create()
  const page = scanned.addPage([595, 842])
  page.drawRectangle({ x: 50, y: 50, width: 495, height: 742, borderWidth: 2 })
  await writeFile(new URL('escaneado.pdf', out), await scanned.save())
}

async function makeLayoutPdfs() {
  // Dos columnas con las mismas líneas base (revistas maquetadas).
  const cols = await PDFDocument.create()
  const font = await cols.embedFont(StandardFonts.Helvetica)
  const page = cols.addPage([595, 842])
  const left = ['Columna izquierda, primera línea', 'que sigue en la segunda línea', 'y termina en la tercera.']
  const right = ['Columna derecha, primera línea', 'que sigue en la segunda línea', 'y termina en la tercera.']
  left.forEach((text, i) => page.drawText(text, { x: 50, y: 740 - i * 16, size: 12, font }))
  right.forEach((text, i) => page.drawText(text, { x: 320, y: 740 - i * 16, size: 12, font }))
  await writeFile(new URL('columnas.pdf', out), await cols.save())

  // Libro: encabezados alternos, número de página al pie y párrafos marcados solo con sangría.
  const book = await PDFDocument.create()
  const bf = await book.embedFont(StandardFonts.Helvetica)
  const pages = [
    [[68, 'Primer párrafo del libro, que empieza con sangría'], [50, 'y termina aquí.'], [68, 'Segundo párrafo, también con sangría, que continúa'], [50, 'en la página siguiente sin cortar la']],
    [[50, 'frase a la mitad.'], [68, 'Tercer párrafo de la segunda página.']],
    [[68, 'Cuarto párrafo en la tercera página.']],
    [[68, 'Quinto y último párrafo.']],
  ]
  pages.forEach((lines, i) => {
    const pg = book.addPage([595, 842])
    pg.drawText(i % 2 === 0 ? 'Capítulo primero' : 'Libro de prueba', { x: 250, y: 800, size: 10, font: bf })
    lines.forEach(([x, text], j) => pg.drawText(text, { x, y: 740 - j * 16, size: 12, font: bf }))
    pg.drawText(String(i + 1), { x: 290, y: 40, size: 10, font: bf })
  })
  await writeFile(new URL('libro.pdf', out), await book.save())
}

function epubFiles({ drm = false } = {}) {
  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
  )
  if (drm) {
    zip.file(
      'META-INF/encryption.xml',
      `<?xml version="1.0"?><encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container" xmlns:enc="http://www.w3.org/2001/04/xmlenc#"><enc:EncryptedData><enc:CipherData><enc:CipherReference URI="OEBPS/cap1.xhtml"/></enc:CipherData></enc:EncryptedData></encryption>`,
    )
  }
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="id">muestra-1</dc:identifier>
    <dc:title>Libro de muestra</dc:title>
    <dc:creator>Autora de Prueba</dc:creator>
    <dc:language>es</dc:language>
    <dc:date>1905</dc:date>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="portada" href="portada.xhtml" media-type="application/xhtml+xml"/>
    <item id="cap1" href="cap1.xhtml" media-type="application/xhtml+xml"/>
    <item id="cap2" href="cap2.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="portada"/><itemref idref="cap1"/><itemref idref="cap2"/></spine>
</package>`,
  )
  const xhtml = (body) =>
    `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>x</title></head><body>${body}</body></html>`
  zip.file('OEBPS/nav.xhtml', xhtml('<nav><ol><li><a href="cap1.xhtml">Capítulo uno</a></li><li><a href="cap2.xhtml">Capítulo dos</a></li></ol></nav>'))
  zip.file('OEBPS/portada.xhtml', xhtml('<div><img src="portada.jpg" alt=""/></div>'))
  zip.file(
    'OEBPS/cap1.xhtml',
    xhtml('<h1>Capítulo uno</h1><p>El primer capítulo presenta a la protagonista, que lee cada noche.</p><p>Sus libros favoritos tratan de viajes y de mapas antiguos.</p>'),
  )
  zip.file(
    'OEBPS/cap2.xhtml',
    xhtml('<h1>Capítulo dos</h1><p>En el segundo capítulo descubre un mapa escondido en un libro.</p><blockquote>«Todo mapa es una promesa», dice la nota.</blockquote>'),
  )
  return zip
}

async function makeEpubs() {
  const opts = { type: 'nodebuffer', mimeType: 'application/epub+zip' }
  await writeFile(new URL('muestra.epub', out), await epubFiles().generateAsync(opts))
  await writeFile(new URL('drm.epub', out), await epubFiles({ drm: true }).generateAsync(opts))
}

await makePdf()
await makeLayoutPdfs()
await makeEpubs()
console.log('Fixtures generados en tests/fixtures/')
