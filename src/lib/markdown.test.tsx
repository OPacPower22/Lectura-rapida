import { render } from '@testing-library/react'
import { renderMarkdown } from './markdown'

const html = (md: string) => render(<div>{renderMarkdown(md)}</div>).container

describe('renderMarkdown', () => {
  it('encabezados, párrafos, negrita y cursiva', () => {
    const c = html('## Título\n\nUn **fuerte** y *suave*\ncontinúa.')
    expect(c.querySelector('h2')?.textContent).toBe('Título')
    expect(c.querySelector('strong')?.textContent).toBe('fuerte')
    expect(c.querySelector('em')?.textContent).toBe('suave')
    expect(c.querySelector('p')?.textContent).toBe('Un fuerte y suave continúa.')
  })

  it('listas, listas numeradas y citas', () => {
    const c = html('- uno\n- dos\n\n1. primero\n2. segundo\n\n> cita larga\n> sigue')
    expect([...c.querySelectorAll('ul li')].map((li) => li.textContent)).toEqual(['uno', 'dos'])
    expect([...c.querySelectorAll('ol li')].map((li) => li.textContent)).toEqual(['primero', 'segundo'])
    expect(c.querySelector('blockquote')?.textContent).toBe('cita larga sigue')
  })

  it('muestra el HTML como texto, nunca lo ejecuta', () => {
    const c = html('<script>alert(1)</script> <img src=x onerror=alert(1)>')
    expect(c.querySelector('script')).toBeNull()
    expect(c.querySelector('img')).toBeNull()
    expect(c.textContent).toContain('<script>alert(1)</script>')
  })

  it('solo enlaces https, abiertos de forma segura', () => {
    const c = html('[malo](javascript:alert(1)) y [bueno](https://ejemplo.org)')
    const links = c.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('https://ejemplo.org')
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer')
    expect(links[0].getAttribute('target')).toBe('_blank')
    expect(c.textContent).toContain('malo')
  })
})
