import { shareTargetToImportHash } from './share'

describe('shareTargetToImportHash', () => {
  it('convierte la ruta de «Compartir» en la ruta de importación', () => {
    expect(
      shareTargetToImportHash(
        { pathname: '/Lectura-rapida/compartir', search: '?title=A&url=https%3A%2F%2Fx.org' },
        '/Lectura-rapida/',
      ),
    ).toBe('#/biblioteca/importar?title=A&url=https%3A%2F%2Fx.org')
  })
  it('ignora otras rutas', () => {
    expect(shareTargetToImportHash({ pathname: '/Lectura-rapida/', search: '' }, '/Lectura-rapida/')).toBeNull()
  })
  it('extrae una URL del campo de texto si no viene en url', () => {
    expect(
      shareTargetToImportHash(
        { pathname: '/Lectura-rapida/compartir', search: '?text=Mira+esto+https%3A%2F%2Fx.org%2Fa' },
        '/Lectura-rapida/',
      ),
    ).toBe('#/biblioteca/importar?text=Mira+esto+https%3A%2F%2Fx.org%2Fa&url=https%3A%2F%2Fx.org%2Fa')
  })
})
