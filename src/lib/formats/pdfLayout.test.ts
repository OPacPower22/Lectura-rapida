import { paragraphsFromLines, type PdfLine } from './pdfLayout'

const line = (text: string, y: number, page = 1, x = 50, width = 300, height = 12): PdfLine => ({
  text, x, y, width, height, page,
})

describe('paragraphsFromLines', () => {
  it('une líneas de un mismo párrafo y separa por salto vertical grande', () => {
    const result = paragraphsFromLines([
      line('Primera línea del párrafo', 700),
      line('que continúa aquí.', 684),
      line('Segundo párrafo.', 650),
    ])
    expect(result).toEqual([
      { text: 'Primera línea del párrafo que continúa aquí.', page: 1 },
      { text: 'Segundo párrafo.', page: 1 },
    ])
  })

  it('une palabras partidas con guion al final de línea', () => {
    const [p] = paragraphsFromLines([line('la compren-', 700), line('sión del texto', 684)])
    expect(p.text).toBe('la comprensión del texto')
  })

  it('conserva guiones que no parten palabras', () => {
    const [p] = paragraphsFromLines([line('un texto teórico-', 700), line('Práctico', 684)])
    expect(p.text).toBe('un texto teórico- Práctico')
  })

  it('descarta encabezados repetidos en la mayoría de las páginas', () => {
    const lines = [1, 2, 3].flatMap((page) => [line('Revista de prueba', 800, page), line(`Texto de la página ${page}.`, 700, page)])
    const result = paragraphsFromLines(lines)
    expect(result.map((p) => p.text)).toEqual(['Texto de la página 1.', 'Texto de la página 2.', 'Texto de la página 3.'])
    expect(result.map((p) => p.page)).toEqual([1, 2, 3])
  })

  it('continúa un párrafo en la página siguiente si la línea no termina en punto', () => {
    const result = paragraphsFromLines([line('Una idea que sigue', 100, 1), line('en la otra página.', 700, 2)])
    expect(result).toEqual([{ text: 'Una idea que sigue en la otra página.', page: 1 }])
  })

  it('lee la columna izquierda completa antes que la derecha', () => {
    const result = paragraphsFromLines([
      line('Derecha uno', 700, 1, 320, 220),
      line('Izquierda uno', 700, 1, 50, 220),
      line('Derecha dos', 684, 1, 320, 220),
      line('Izquierda dos.', 684, 1, 50, 220),
      line('Derecha tres.', 668, 1, 320, 220),
      line('Izquierda tres.', 640, 1, 50, 220),
    ])
    expect(result.map((p) => p.text)).toEqual([
      'Izquierda uno Izquierda dos.',
      'Izquierda tres.',
      'Derecha uno Derecha dos Derecha tres.',
    ])
  })
})
