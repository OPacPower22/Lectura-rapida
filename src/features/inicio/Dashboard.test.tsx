import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createEmptyCard } from 'ts-fsrs'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { saveSession } from '../../lib/storage/repo'
import { setSetting } from '../../lib/storage/settings'
import { Dashboard } from './Dashboard'

beforeEach(async () => {
  localStorage.clear()
  await db.delete()
  await db.open()
})

const show = () => render(<MemoryRouter><Dashboard /></MemoryRouter>)

async function reading(kind: 'narrativo' | 'denso', wpm: number, correct: number, at: number) {
  await saveSession({
    session: { kind: 'practica', textId: `t-${at}`, textKind: kind, lang: 'es', startedAt: at, endedAt: at, activeMs: 120000, words: 400, wpm },
    probes: [{ at, answer: 'texto' }],
    quiz: { textId: `t-${at}`, answers: [], correct, total: 5, deferred: false, at },
  })
}

describe('Dashboard', () => {
  it('sin datos invita al diagnóstico y no muestra cifras vacías', async () => {
    show()
    expect(await screen.findByRole('link', { name: t('home.diagnosticCta') })).toBeInTheDocument()
    expect(await screen.findByText(t('dashboard.noData'))).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/NaN|undefined/)
    expect(screen.queryByText(t('backup.due'))).toBeNull()
  })

  it('muestra los botones de actividad', async () => {
    show()
    const nav = await screen.findByRole('region', { name: t('dashboard.activities') })
    for (const key of ['dashboard.act.program', 'dashboard.act.speed', 'dashboard.act.practice', 'dashboard.act.attention', 'dashboard.act.library', 'dashboard.act.physical', 'dashboard.act.glossary', 'dashboard.act.notebook', 'dashboard.act.projects', 'dashboard.act.progress'] as const) {
      expect(within(nav).getByRole('link', { name: new RegExp(t(key)) })).toBeInTheDocument()
    }
  })

  it('con sesiones y una ficha vencida muestra estadísticas y el repaso pendiente', async () => {
    const now = Date.now()
    await reading('narrativo', 240, 4, now - 3600_000)
    await reading('denso', 180, 3, now - 1800_000)
    await db.cards.add({ kind: 'ficha', front: 'f', back: 'b', lang: 'es', fsrs: createEmptyCard(new Date(now - 86_400_000)), createdAt: 1 })
    show()
    const acts = await screen.findByRole('region', { name: t('dashboard.activities') })
    expect(within(acts).getByRole('link', { name: new RegExp(t('dashboard.act.review', { count: 1 }).replace(/[()]/g, '\\$&')) })).toBeInTheDocument()
    const stats = screen.getByRole('region', { name: t('dashboard.stats') })
    expect(within(stats).getByText('240 ppm')).toBeInTheDocument()
    expect(within(stats).getByText('180 ppm')).toBeInTheDocument()
    expect(within(stats).getByText('70 %')).toBeInTheDocument()
    expect(within(stats).getByText(t('dashboard.days7', { days: 1 }))).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/NaN|undefined/)
  })

  it('avisa del respaldo si hay datos y nunca se respaldó, y no si es reciente', async () => {
    await reading('narrativo', 240, 4, Date.now())
    const { unmount } = show()
    expect(await screen.findByText(t('backup.due'))).toBeInTheDocument()
    unmount()
    await setSetting('backup:lastAt', Date.now())
    show()
    await screen.findByRole('region', { name: t('dashboard.stats') })
    expect(screen.queryByText(t('backup.due'))).toBeNull()
  })
})
