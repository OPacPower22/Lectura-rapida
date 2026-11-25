import { act, fireEvent, render, screen } from '@testing-library/react'
import { t } from '../../i18n'
import { PROBE_RANGE_DIAGNOSTICO } from '../../lib/probes'
import { countWords } from '../../lib/text'
import { ReadingView, type ReadingOutcome } from './ReadingView'

const body = 'Primer párrafo del texto de prueba.\n\nSegundo párrafo con más palabras.'

function setup() {
  let now = 0
  const clock = { set: (v: number) => (now = v) }
  const onFinish = vi.fn<(o: ReadingOutcome) => void>()
  render(
    <ReadingView
      title="Prueba"
      body={body}
      lang="es"
      probeRange={PROBE_RANGE_DIAGNOSTICO}
      onFinish={onFinish}
      now={() => now}
      rng={() => 0}
    />,
  )
  return { clock, onFinish }
}

function setVisibility(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  setVisibility('visible')
})

describe('ReadingView', () => {
  it('oculta el texto hasta pulsar Empezar', () => {
    setup()
    expect(screen.queryByText(/Primer párrafo/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    expect(screen.getByText(/Primer párrafo/)).toBeInTheDocument()
  })

  it('muestra un sondeo de atención al vencer el intervalo y lo cierra al responder', () => {
    const { onFinish } = setup()
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    act(() => {
      vi.advanceTimersByTime(45000)
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('probe.text') }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    expect(onFinish.mock.calls[0][0].probes.map((p) => p.answer)).toEqual(['texto'])
  })

  it('no cuenta el tiempo con la pestaña oculta', () => {
    const { clock, onFinish } = setup()
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    clock.set(3000)
    setVisibility('hidden')
    clock.set(13000)
    setVisibility('visible')
    clock.set(15000)
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    expect(onFinish.mock.calls[0][0].activeMs).toBe(5000)
  })

  it('no cuenta el tiempo mientras el sondeo está abierto', () => {
    const { clock, onFinish } = setup()
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    clock.set(45000)
    act(() => {
      vi.advanceTimersByTime(45000)
    })
    clock.set(60000)
    fireEvent.click(screen.getByRole('button', { name: t('probe.other') }))
    clock.set(61000)
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    expect(onFinish.mock.calls[0][0].activeMs).toBe(46000)
  })

  it('registra "me distraje" como sondeo espontáneo', () => {
    const { onFinish } = setup()
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    fireEvent.click(screen.getByRole('button', { name: t('reader.distracted') }))
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    expect(onFinish.mock.calls[0][0].probes.map((p) => p.answer)).toEqual(['auto'])
  })

  it('informa las palabras del texto', () => {
    const { onFinish } = setup()
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
    expect(onFinish.mock.calls[0][0].words).toBe(countWords(body, 'es'))
  })

  it('al volver a la pestaña el sondeo usa el tiempo restante', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    act(() => {
      vi.advanceTimersByTime(30000)
    })
    setVisibility('hidden')
    act(() => {
      vi.advanceTimersByTime(100000)
    })
    setVisibility('visible')
    act(() => {
      vi.advanceTimersByTime(14999)
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('con el sondeo abierto el fondo es inerte, Escape no lo cierra y el foco vuelve a «Me distraje»', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    act(() => {
      vi.advanceTimersByTime(45000)
    })
    const article = screen.getByRole('article')
    expect(article.closest('[inert]')).not.toBeNull()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('probe.text') }))
    expect(article.closest('[inert]')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: t('reader.distracted') }))
  })

  it('los botones de letra incluyen el texto visible en su nombre', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
    expect(screen.getByRole('button', { name: /A−/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /A\+/ })).toBeInTheDocument()
  })
})
