import { act, fireEvent, render, screen } from '@testing-library/react'
import { getPracticeText } from '../../content'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { saveSession } from '../../lib/storage/repo'
import { retentionQuestions } from '../../lib/retention'
import { RetentionCheck } from './RetentionCheck'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('RetentionCheck', () => {
  it('pregunta 5 preguntas y compara con la comprensión inmediata', async () => {
    const at = Date.now() - 25 * 3600000
    await saveSession({
      session: { kind: 'diagnostico', textId: 'diag-expositivo', textKind: 'expositivo', lang: 'es', startedAt: at - 60000, endedAt: at, activeMs: 60000, words: 700, wpm: 700 },
      probes: [],
      quiz: { textId: 'diag-expositivo', answers: [], correct: 6, total: 9, deferred: false, at },
    })
    render(<RetentionCheck />)
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(t('retention.start')) }))
    const questions = retentionQuestions(getPracticeText('diag-expositivo')!)
    for (const q of questions) fireEvent.click(screen.getByLabelText(q.options[q.answerIndex]))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('quiz.submit') }))
    })
    expect(await screen.findByText(t('retention.result', { retained: 100, immediate: 67 }))).toBeInTheDocument()
  })

  it('sin pendientes no muestra nada', async () => {
    const { container } = render(<RetentionCheck />)
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })
})
