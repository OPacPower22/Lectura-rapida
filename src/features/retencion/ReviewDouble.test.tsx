import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { t } from '../../i18n'
import { addCard, listCards } from '../../lib/storage/cards'
import { db } from '../../lib/storage/db'
import { ReviewPage } from './ReviewPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('ReviewPage: calificaciones repetidas', () => {
  it('un doble clic no califica dos veces la misma ficha ni salta la siguiente', async () => {
    await addCard({ kind: 'ficha', front: 'Primera', back: 'R1', lang: 'es' })
    await addCard({ kind: 'ficha', front: 'Segunda', back: 'R2', lang: 'es' })
    render(<MemoryRouter><ReviewPage /></MemoryRouter>)
    await screen.findByText('Primera')
    fireEvent.click(screen.getByRole('button', { name: t('review.show') }))
    const good = screen.getByRole('button', { name: new RegExp(t('review.grade.good')) })
    fireEvent.click(good)
    fireEvent.click(good)
    expect(await screen.findByText('Segunda')).toBeInTheDocument()
    await waitFor(async () => {
      const cards = await listCards()
      expect(cards.find((c) => c.front === 'Primera')!.fsrs.reps).toBe(1)
      expect(cards.find((c) => c.front === 'Segunda')!.fsrs.reps).toBe(0)
    })
  })

  it('ignora teclas repetidas y la barra espaciadora sobre un botón', async () => {
    await addCard({ kind: 'ficha', front: 'Pregunta', back: 'Respuesta', lang: 'es' })
    render(<MemoryRouter><ReviewPage /><button type="button">Otro botón</button></MemoryRouter>)
    await screen.findByText('Pregunta')
    const other = screen.getByRole('button', { name: 'Otro botón' })
    fireEvent.keyDown(other, { key: ' ' })
    expect(screen.queryByText('Respuesta')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: ' ', repeat: true })
    expect(screen.queryByText('Respuesta')).not.toBeInTheDocument()
  })
})
