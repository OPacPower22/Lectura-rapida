import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getPracticeText, textsByRole } from '../../content'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { saveSession } from '../../lib/storage/repo'
import { PracticePage, PracticeRunPage } from './PracticePage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

function app(path = '/practica') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/practica" element={<PracticePage />} />
        <Route path="/practica/:textId" element={<PracticeRunPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PracticePage', () => {
  it('lista los textos de práctica: los no leídos primero y el leído con su comprensión', async () => {
    const read = textsByRole('practica')[0]
    await saveSession({
      session: { kind: 'practica', textId: read.id, textKind: read.kind, lang: 'es', startedAt: 1, endedAt: 2, activeMs: 60000, words: 300, wpm: 300 },
      probes: [],
      quiz: { textId: read.id, answers: [], correct: 4, total: 5, deferred: false, at: 1 },
    })
    app()
    const items = await screen.findAllByRole('listitem')
    expect(items).toHaveLength(textsByRole('practica').length)
    expect(items.at(-1)).toHaveTextContent(read.title)
    expect(items.at(-1)).toHaveTextContent(t('practice.read', { percent: 80 }))
    expect(items[0]).toHaveTextContent(t('practice.unread'))
  })

  it('abrir un texto no leído inicia la lectura medida', async () => {
    const text = textsByRole('practica')[1]
    app()
    await userEvent.click(await screen.findByRole('link', { name: new RegExp(text.title) }))
    expect(await screen.findByText(t('diag.purposeLabel'))).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: t('diag.continue') }))
    expect(await screen.findByRole('heading', { name: text.title })).toBeInTheDocument()
  })

  it('avisa si el texto ya se leyó o si lo usa un día pendiente del programa', async () => {
    const text = getPracticeText('practica-1')!
    await saveSession({
      session: { kind: 'practica', textId: text.id, textKind: text.kind, lang: 'es', startedAt: 1, endedAt: 2, activeMs: 60000, words: 300, wpm: 300 },
      probes: [],
      quiz: { textId: text.id, answers: [], correct: 4, total: 5, deferred: false, at: 1 },
    })
    app('/practica/practica-1')
    expect(await screen.findByText(t('practice.rereadWarning'))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(t('practice.programWarning', { days: '' }).slice(0, 20)))).toBeInTheDocument()
  })
})
