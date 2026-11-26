import { fireEvent, render, screen, within } from '@testing-library/react'
import { BarChart } from './BarChart'
import { LineChart } from './LineChart'
import { Sparkline } from './Sparkline'

describe('LineChart', () => {
  const series = [
    { name: 'Narrativo', points: [{ x: 'a', y: 200 }, { x: 'b', y: null }, { x: 'c', y: 240 }, { x: 'd', y: 250 }] },
    { name: 'Denso', points: [{ x: 'a', y: 150 }, { x: 'b', y: 160 }, { x: 'c', y: 170 }, { x: 'd', y: null }] },
  ]
  it('corta la línea donde falta un dato', () => {
    const { container } = render(<LineChart title="Velocidad" unit="ppm" series={series} />)
    expect(container.querySelectorAll('[data-series="0"] path[data-segment]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-series="1"] path[data-segment]')).toHaveLength(1)
  })
  it('tiene título, descripción accesible, leyenda y tabla con todos los valores', () => {
    render(<LineChart title="Velocidad" unit="ppm" series={series} />)
    expect(screen.getByRole('figure', { name: 'Velocidad' })).toBeInTheDocument()
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/Velocidad/)
    const table = screen.getByRole('table')
    for (const v of ['200', '240', '250', '150', '160', '170']) expect(within(table).getByText(v)).toBeInTheDocument()
    expect(within(table).getAllByText('—')).toHaveLength(2)
    expect(screen.getAllByText('Narrativo').length).toBeGreaterThan(0)
  })
  it('muestra un aviso con todas las series al pasar por una columna', () => {
    const { container } = render(<LineChart title="Velocidad" unit="ppm" series={series} />)
    fireEvent.pointerEnter(container.querySelectorAll('[data-hit]')[2])
    const tip = screen.getByRole('status')
    expect(tip).toHaveTextContent('240')
    expect(tip).toHaveTextContent('170')
  })
  it('con el teclado recorre las columnas', () => {
    render(<LineChart title="Velocidad" unit="ppm" series={series} />)
    const img = screen.getByRole('img')
    fireEvent.focus(img)
    expect(screen.getByRole('status')).toHaveTextContent('250')
    fireEvent.keyDown(img, { key: 'ArrowLeft' })
    expect(screen.getByRole('status')).toHaveTextContent('240')
  })
})

describe('BarChart', () => {
  it('dibuja una barra por valor y la tabla', () => {
    const { container } = render(<BarChart title="Minutos" unit="min" bars={[{ x: 'a', y: 10 }, { x: 'b', y: 0 }, { x: 'c', y: 25 }]} />)
    expect(container.querySelectorAll('[data-bar]')).toHaveLength(3)
    expect(within(screen.getByRole('table')).getByText('25')).toBeInTheDocument()
  })
})

describe('Sparkline', () => {
  it('es una imagen con etiqueta', () => {
    render(<Sparkline points={[1, 3, 2]} label="ILE de tus últimas lecturas" />)
    expect(screen.getByRole('img', { name: 'ILE de tus últimas lecturas' })).toBeInTheDocument()
  })
  it('con menos de dos puntos no dibuja nada', () => {
    const { container } = render(<Sparkline points={[1]} label="x" />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
