import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { t } from '../../i18n'
import { addCard, countDue } from '../../lib/storage/cards'
import { db } from '../../lib/storage/db'
import { ReviewPage } from './ReviewPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('ReviewPage', () => {
  it('repasa las fichas vencidas una por una', async () => {
    await addCard({ kind: 'ficha', front: 'Pregunta uno', back: 'Respuesta uno', lang: 'es' })
    await addCard({ kind: 'ficha', front: 'Pregunta dos', back: 'Respuesta dos', lang: 'es' })
    render(<MemoryRouter><ReviewPage /></MemoryRouter>)
    expect(await screen.findByText('Pregunta uno')).toBeInTheDocument()
    expect(screen.queryByText('Respuesta uno')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('review.show') }))
    expect(screen.getByText('Respuesta uno')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t('review.grade.good')) }))
    expect(await screen.findByText('Pregunta dos')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('review.show') }))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t('review.grade.again')) }))
    expect(await screen.findByText(t('review.done', { count: 2 }))).toBeInTheDocument()
    expect(await countDue(new Date())).toBe(0)
  })

  it('sin fichas pendientes lo indica', async () => {
    render(<MemoryRouter><ReviewPage /></MemoryRouter>)
    expect(await screen.findByText(t('review.nothingDue'))).toBeInTheDocument()
  })

  it('se puede usar con el teclado', async () => {
    await addCard({ kind: 'ficha', front: 'Pregunta', back: 'Respuesta', lang: 'es' })
    render(<MemoryRouter><ReviewPage /></MemoryRouter>)
    await screen.findByText('Pregunta')
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByText('Respuesta')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: '3' })
    await waitFor(async () => expect(await countDue(new Date())).toBe(0))
  })
})
