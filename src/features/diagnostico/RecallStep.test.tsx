import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { saveSession } from '../../lib/storage/repo'
import { RecallStep } from './RecallStep'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('RecallStep', () => {
  it('guarda el recuerdo, muestra el texto para comparar y registra una autoevaluación', async () => {
    const id = await saveSession({
      session: { kind: 'libre', lang: 'es', startedAt: 1, endedAt: 2, activeMs: 60000, words: 100, wpm: 100 },
      probes: [],
    })
    render(<RecallStep sessionId={id} lang="es" compareText={'Texto original para comparar.'} />)
    fireEvent.change(screen.getByLabelText(t('recall.label')), { target: { value: 'Lo que recuerdo' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: t('recall.compare') }))
    })
    expect(await screen.findByText('Texto original para comparar.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t('recall.grade.medio') }))
    expect(await screen.findByText(t('recall.selfAssessed'))).toBeInTheDocument()
    await waitFor(async () => expect(await db.readingSessions.get(id)).toMatchObject({ recall: 'Lo que recuerdo', recallGrade: 'medio' }))
  })
})
