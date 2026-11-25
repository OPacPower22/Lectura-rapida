import { countWords, splitParagraphs } from './text'

describe('countWords', () => {
  it('cuenta palabras en español ignorando puntuación', () => {
    expect(countWords('Hola, ¿cómo estás?', 'es')).toBe(3)
  })
  it('cuenta los números como palabras', () => {
    expect(countWords('El año 2025 fue bueno.', 'es')).toBe(5)
  })
  it('devuelve 0 para texto vacío o solo espacios', () => {
    expect(countWords('', 'es')).toBe(0)
    expect(countWords('   \n\t ', 'es')).toBe(0)
  })
  it('segmenta idiomas sin espacios', () => {
    expect(countWords('我喜欢读书', 'zh')).toBeGreaterThanOrEqual(2)
  })
  it('cuenta textos muy largos', () => {
    expect(countWords('palabra '.repeat(50000), 'es')).toBe(50000)
  })
})

describe('splitParagraphs', () => {
  it('separa por líneas en blanco y descarta vacíos', () => {
    expect(splitParagraphs('Uno.\n\n\nDos.\n  \nTres.')).toEqual(['Uno.', 'Dos.', 'Tres.'])
  })
})
