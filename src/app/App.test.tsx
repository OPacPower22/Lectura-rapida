import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { t } from '../i18n'
import { db } from '../lib/storage/db'
import { routes } from './routes'
import { App } from './App'
import { applyShareTarget } from '../lib/formats/share'

beforeEach(async () => {
  await db.delete()
  await db.open()
})
afterEach(() => vi.restoreAllMocks())

async function startDiagnosticReading() {
  const router = createMemoryRouter(routes, { initialEntries: ['/diagnostico'] })
  render(<RouterProvider router={router} />)
  fireEvent.click(await screen.findByRole('button', { name: t('diag.continue') }))
  fireEvent.click(screen.getByRole('button', { name: t('diag.continue') }))
  fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
  return router
}

describe('aviso al abandonar una lectura', () => {
  it('si el usuario cancela, sigue en la lectura', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const router = await startDiagnosticReading()
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: t('nav.progress') }))
    })
    expect(confirm).toHaveBeenCalledWith(t('reader.leaveConfirm'))
    expect(router.state.location.pathname).toBe('/diagnostico')
    expect(screen.getByRole('button', { name: t('reader.finish') })).toBeInTheDocument()
  })

  it('si el usuario acepta, navega', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const router = await startDiagnosticReading()
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: t('nav.progress') }))
    })
    expect(router.state.location.pathname).toBe('/progreso')
  })

  it('pide confirmación al cerrar o recargar durante la lectura', async () => {
    await startDiagnosticReading()
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('no bloquea la navegación fuera de una lectura', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const router = createMemoryRouter(routes, { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    await act(async () => {
      fireEvent.click(await screen.findByRole('link', { name: t('nav.progress') }))
    })
    expect(confirm).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/progreso')
  })
})

describe('recibir contenido desde «Compartir»', () => {
  it('abre la pantalla de importación con los datos compartidos', async () => {
    window.history.replaceState(null, '', '/Lectura-rapida/compartir?title=Nota&url=https%3A%2F%2Fejemplo.org%2Fa')
    applyShareTarget('/Lectura-rapida/')
    render(<App />)
    expect(await screen.findByRole('heading', { name: t('import.title') })).toBeInTheDocument()
    expect(screen.getByText(/https:\/\/ejemplo\.org\/a/)).toBeInTheDocument()
    window.history.replaceState(null, '', '/')
  })
})
