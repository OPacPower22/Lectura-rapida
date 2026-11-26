import type { Source } from './storage/db'
import { bibliography, formatReference, inTextCitation } from './citation'

const src = (s: Partial<Source>): Source => ({ type: 'libro', title: 'Título', createdAt: 0, ...s })
const italic = (r: ReturnType<typeof formatReference>) => (r.italic ? r.text.slice(...r.italic) : null)

describe('formatReference (APA simplificado)', () => {
  it('libro con autor, año y editorial: título en cursiva', () => {
    const r = formatReference(src({ author: 'Pérez, A.', year: '2020', title: 'La lectura atenta', publisher: 'Paidós' }))
    expect(r.text).toBe('Pérez, A. (2020). La lectura atenta. Paidós.')
    expect(italic(r)).toBe('La lectura atenta')
  })
  it('dos y tres autores', () => {
    expect(formatReference(src({ author: 'Pérez, A.; Gómez, B.', year: '2020' })).text).toBe('Pérez, A. y Gómez, B. (2020). Título.')
    expect(formatReference(src({ author: 'Pérez, A.; Gómez, B.; Ruiz, C.', year: '2020' })).text).toBe('Pérez, A., Gómez, B. y Ruiz, C. (2020). Título.')
  })
  it('artículo web sin autor: el título ocupa su lugar', () => {
    const r = formatReference(src({ type: 'articulo', title: 'Cómo leer mejor', year: '2021', url: 'https://ejemplo.org/a' }))
    expect(r.text).toBe('Cómo leer mejor. (2021). https://ejemplo.org/a')
    expect(r.italic).toBeNull()
  })
  it('sin año: (s. f.); no duplica el punto final', () => {
    expect(formatReference(src({ author: 'Ruiz, C.', title: '¿Qué es leer?' })).text).toBe('Ruiz, C. (s. f.). ¿Qué es leer?')
  })
  it('página web: sitio y URL', () => {
    const r = formatReference(src({ type: 'web', author: 'Ruiz, C.', year: '2022', title: 'Atención', publisher: 'Blog X', url: 'https://x.org' }))
    expect(r.text).toBe('Ruiz, C. (2022). Atención. Blog X. https://x.org')
    expect(italic(r)).toBe('Atención')
  })
})

describe('inTextCitation', () => {
  it('apellido, año y página', () => {
    expect(inTextCitation(src({ author: 'Pérez, A.', year: '2020' }), 12)).toBe('(Pérez, 2020, p. 12)')
    expect(inTextCitation(src({ author: 'Pérez, A.', year: '2020' }))).toBe('(Pérez, 2020)')
  })
  it('dos autores y "et al." con tres o más', () => {
    expect(inTextCitation(src({ author: 'Pérez, A.; Gómez, B.', year: '2020' }))).toBe('(Pérez y Gómez, 2020)')
    expect(inTextCitation(src({ author: 'Pérez, A.; Gómez, B.; Ruiz, C.', year: '2020' }))).toBe('(Pérez et al., 2020)')
  })
  it('sin autor ni año, y fuente eliminada', () => {
    expect(inTextCitation(src({ title: 'Título' }))).toBe('(Título, s. f.)')
    expect(inTextCitation(undefined, 3)).toBe('(fuente eliminada)')
  })
})

describe('bibliography', () => {
  it('ordena alfabéticamente con acentos y sin duplicados', () => {
    const a = src({ id: 1, author: 'Ávila, R.', year: '2001' })
    const b = src({ id: 2, author: 'Zea, L.', year: '2002' })
    const c = src({ id: 3, author: 'Bello, A.', year: '2003' })
    const d = src({ id: 4, title: 'Anónimo útil', year: '2004' })
    expect(bibliography([b, a, c, a, d]).map((r) => r.text.slice(0, 6))).toEqual(['Anónim', 'Ávila,', 'Bello,', 'Zea, L'])
  })
})
