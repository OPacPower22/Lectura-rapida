import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { t } from '../i18n'
import { db } from '../lib/storage/db'
import { routes } from './routes'

beforeEach(async () => {
  await db.delete()
  await db.open()
  document.title = 'Lectura Rápida'
})

describe('navegación accesible', () => {
  it('el primer elemento enfocable es «Saltar al contenido» y lleva el foco al contenido', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/ajustes'] })
    render(<RouterProvider router={router} />)
    await screen.findByRole('heading', { level: 1, name: t('settings.title') })
    const focusables = document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    expect(focusables[0]).toHaveTextContent(t('a11y.skip'))
    fireEvent.click(focusables[0])
    expect(document.activeElement).toBe(document.getElementById('contenido'))
    expect(router.state.location.pathname).toBe('/ajustes')
  })

  it('al cambiar de página, el foco va al título y la pestaña lo anuncia', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/ajustes'] })
    render(<RouterProvider router={router} />)
    await screen.findByRole('heading', { level: 1, name: t('settings.title') })
    expect(document.title).toBe(`${t('settings.title')} · ${t('app.title')}`)
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: t('nav.notebook') }))
    })
    const h1 = await screen.findByRole('heading', { level: 1, name: t('notebook.title') })
    await vi.waitFor(() => expect(document.activeElement).toBe(h1))
    expect(document.title).toBe(`${t('notebook.title')} · ${t('app.title')}`)
    expect(screen.getByText(t('a11y.pageLoaded', { title: t('notebook.title') }))).toBeInTheDocument()
  })
})
