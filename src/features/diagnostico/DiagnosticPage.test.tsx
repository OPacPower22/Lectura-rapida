import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { PracticeText } from '../../content/types'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { listSessions } from '../../lib/storage/repo'
import { DiagnosticPage } from './DiagnosticPage'

const control = vi.hoisted(() => ({ failSave: false }))

vi.mock('../../lib/storage/repo', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../lib/storage/repo')>()
  return {
    ...mod,
    saveSession: (input: Parameters<typeof mod.saveSession>[0]) =>
      control.failSave ? Promise.reject(new Error('sin almacenamiento')) : mod.saveSession(input),
  }
})

const fixture: PracticeText = {
  id: 'diag-expositivo',
  lang: 'es',
  title: 'Texto de prueba',
  kind: 'expositivo',
  source: 'original',
  body: 'palabra '.repeat(300).trim(),
  questions: [
    { id: 'q1', type: 'literal', prompt: '¿Uno?', options: ['U0', 'U1', 'U2', 'U3'], answerIndex: 0 },
    { id: 'q2', type: 'idea-central', prompt: '¿Dos?', options: ['D0', 'D1', 'D2', 'D3'], answerIndex: 0 },
  ],
}

vi.mock('../../content', () => ({ diagnosticTextFor: () => fixture }))

async function completeFlow() {
  let now = 0
  render(
    <MemoryRouter>
      <DiagnosticPage now={() => now} />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: t('diag.continue') }))
  fireEvent.click(screen.getByRole('button', { name: t('diag.continue') }))
  fireEvent.click(screen.getByRole('button', { name: t('reader.start') }))
  now = 120000
  fireEvent.click(screen.getByRole('button', { name: t('reader.finish') }))
  fireEvent.click(screen.getByLabelText('U0'))
  fireEvent.click(screen.getByLabelText('D1'))
  fireEvent.click(screen.getByRole('button', { name: t('quiz.submit') }))
}

beforeEach(async () => {
  control.failSave = false
  await db.delete()
  await db.open()
})

describe('DiagnosticPage', () => {
  it('completa el diagnóstico, muestra resultados y los guarda', async () => {
    await completeFlow()
    expect(await screen.findByText('50 %')).toBeInTheDocument()
    expect(screen.getByText('150 ppm')).toBeInTheDocument()
    await waitFor(async () => {
      const rows = await listSessions()
      expect(rows).toHaveLength(1)
      expect(rows[0].session.kind).toBe('diagnostico')
      expect(rows[0].quiz?.correct).toBe(1)
    })
  })

  it('muestra los resultados aunque falle el guardado', async () => {
    control.failSave = true
    await completeFlow()
    expect(await screen.findByText(t('results.saveError'))).toBeInTheDocument()
    expect(screen.getByText('50 %')).toBeInTheDocument()
  })
})
