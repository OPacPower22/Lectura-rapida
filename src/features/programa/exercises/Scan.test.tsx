import { fireEvent, render, screen } from '@testing-library/react'
import { getPracticeText } from '../../../content'
import { t } from '../../../i18n'
import { Scan } from './Scan'
import { scanQuestions } from './scanQuestions'

describe('Scan', () => {
  it('muestra primero las preguntas, luego el texto y la puntuación', () => {
    const onDone = vi.fn()
    render(<Scan textId="practica-2" onDone={onDone} />)
    const questions = scanQuestions(getPracticeText('practica-2')!)
    expect(questions).toHaveLength(3)
    expect(questions.every((q) => q.type === 'literal')).toBe(true)
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('scan.start') }))
    expect(screen.getByRole('article')).toHaveTextContent(/Jenkins y Karl Dallenbach/)
    for (const q of questions) fireEvent.click(screen.getByLabelText(q.options[q.answerIndex]))
    fireEvent.click(screen.getByRole('button', { name: t('quiz.submit') }))
    expect(screen.getByText(/3 de 3 correctas/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('program.exerciseDone') }))
    expect(onDone).toHaveBeenCalled()
  })
})
