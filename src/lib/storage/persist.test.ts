import { requestPersistentStorage } from './persist'

const original = Object.getOwnPropertyDescriptor(navigator, 'storage')

afterEach(() => {
  if (original) Object.defineProperty(navigator, 'storage', original)
  else delete (navigator as { storage?: unknown }).storage
})

function setStorage(value: unknown) {
  Object.defineProperty(navigator, 'storage', { value, configurable: true })
}

describe('requestPersistentStorage', () => {
  it('devuelve false si el navegador no tiene la API', async () => {
    setStorage(undefined)
    expect(await requestPersistentStorage()).toBe(false)
  })
  it('devuelve lo que concede el navegador', async () => {
    setStorage({ persist: async () => true })
    expect(await requestPersistentStorage()).toBe(true)
  })
  it('devuelve false si la API lanza un error', async () => {
    setStorage({ persist: async () => { throw new Error('no') } })
    expect(await requestPersistentStorage()).toBe(false)
  })
})
