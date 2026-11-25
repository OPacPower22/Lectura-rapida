import { importPlainText } from './text'
import { ImportError } from './types'

describe('importPlainText', () => {
  it('divide en párrafos en un solo capítulo', () => {
    const doc = importPlainText('Uno dos.\n\nTres.', { title: 'Notas' })
    expect(doc.title).toBe('Notas')
    expect(doc.chapters).toHaveLength(1)
    expect(doc.chapters[0].paragraphs).toEqual(['Uno dos.', 'Tres.'])
    expect(doc.source).toMatchObject({ type: 'documento', title: 'Notas' })
  })

  it('usa la URL como fuente web', () => {
    const doc = importPlainText('Texto.', { title: 'Artículo', url: 'https://ejemplo.org/a' })
    expect(doc.source).toMatchObject({ type: 'web', url: 'https://ejemplo.org/a' })
  })

  it('rechaza texto sin palabras', () => {
    expect(() => importPlainText('  \n ')).toThrow(ImportError)
    try {
      importPlainText('  ')
    } catch (e) {
      expect((e as ImportError).code).toBe('no-content')
    }
  })
})
