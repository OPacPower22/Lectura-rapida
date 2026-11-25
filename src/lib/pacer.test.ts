import { pacerPosition, tokenize } from './pacer'

describe('pacerPosition', () => {
  it('empieza en la primera palabra', () => {
    expect(pacerPosition(0, 240, [10, 10])).toEqual({ paragraph: 0, word: 0 })
  })
  it('avanza al ritmo indicado y cruza párrafos', () => {
    expect(pacerPosition(3000, 240, [10, 10])).toEqual({ paragraph: 1, word: 2 })
  })
  it('devuelve null al terminar el texto', () => {
    expect(pacerPosition(6000, 240, [10, 10])).toBeNull()
  })
})

describe('tokenize', () => {
  it('separa por espacios conservando la puntuación', () => {
    expect(tokenize('  Hola, mundo.\nAdiós ')).toEqual(['Hola,', 'mundo.', 'Adiós'])
  })
})
