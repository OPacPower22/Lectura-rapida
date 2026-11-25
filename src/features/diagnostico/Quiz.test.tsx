import { fireEvent, render, screen } from '@testing-library/react'
import type { Question } from '../../content/types'
import { t } from '../../i18n'
import { Quiz } from './Quiz'

const questions: Question[] = [
  { id: 'a', type: 'literal', prompt: '¿Pregunta A?', options: ['A0', 'A1', 'A2', 'A3'], answerIndex: 0 },
  { id: 'b', type: 'inferencial', prompt: '¿Pregunta B?', options: ['B0', 'B1', 'B2', 'B3'], answerIndex: 1 },
]

describe('Quiz', () => {
  it('no deja enviar hasta responder todas y entrega las respuestas en orden', () => {
    const onSubmit = vi.fn()
    render(<Quiz questions={questions} onSubmit={onSubmit} />)
    const submit = screen.getByRole('button', { name: t('quiz.submit') })
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByLabelText('A2'))
    expect(submit).toBeDisabled()
    fireEvent.click(screen.getByLabelText('B3'))
    expect(submit).toBeEnabled()
    fireEvent.click(submit)
    expect(onSubmit).toHaveBeenCalledWith([2, 3])
  })
})
