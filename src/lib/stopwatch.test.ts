import { createStopwatch } from './stopwatch'

describe('createStopwatch', () => {
  it('no cuenta el tiempo en pausa', () => {
    let now = 0
    const sw = createStopwatch(() => now)
    sw.start()
    now = 1000
    sw.pause()
    now = 5000
    sw.resume()
    now = 6000
    expect(sw.elapsedMs()).toBe(2000)
  })
  it('pause y resume son idempotentes', () => {
    let now = 0
    const sw = createStopwatch(() => now)
    sw.start()
    now = 2000
    sw.pause()
    sw.pause()
    now = 9000
    expect(sw.elapsedMs()).toBe(2000)
    sw.resume()
    sw.resume()
    now = 10000
    expect(sw.elapsedMs()).toBe(3000)
    expect(sw.isRunning()).toBe(true)
  })
  it('vale 0 antes de empezar', () => {
    expect(createStopwatch(() => 0).elapsedMs()).toBe(0)
  })
})
