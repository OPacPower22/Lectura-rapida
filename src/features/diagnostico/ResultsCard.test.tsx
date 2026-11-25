import { render, screen } from '@testing-library/react'
import { t } from '../../i18n'
import { ResultsCard, type ResultsData } from './ResultsCard'

const base: ResultsData = {
  wpm: 250,
  comp: 0.8,
  ileValue: 200,
  label: 'lectura',
  wanderingRate: 0.5,
  selfCaught: 1,
}

describe('ResultsCard', () => {
  it('muestra métricas y la referencia, sin objetivos', () => {
    const { container } = render(<ResultsCard data={base} />)
    expect(screen.getByText('250 ppm')).toBeInTheDocument()
    expect(screen.getByText('80 %')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(container.textContent).toContain('238 ppm')
    expect(container.textContent).toContain('Brysbaert, 2019')
    expect(container.textContent).not.toMatch(/objetivo|meta/i)
  })

  it('avisa si el tiempo fue demasiado corto y no muestra ILE', () => {
    render(<ResultsCard data={{ ...base, wpm: null, ileValue: null, label: null }} />)
    expect(screen.getByText(t('results.tooShort'))).toBeInTheDocument()
    expect(screen.queryByText(t('results.ile'))).not.toBeInTheDocument()
  })

  it('etiqueta el hojeo', () => {
    render(<ResultsCard data={{ ...base, wpm: 700, comp: 0.4, ileValue: 280, label: 'hojeo' }} />)
    expect(screen.getByText(t('results.skimming'))).toBeInTheDocument()
  })

  it('muestra el error de guardado', () => {
    render(<ResultsCard data={base} saveError />)
    expect(screen.getByText(t('results.saveError'))).toBeInTheDocument()
  })
})
