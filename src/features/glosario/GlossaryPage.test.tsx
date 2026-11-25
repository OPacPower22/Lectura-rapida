import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { addGlossaryEntry, listGlossary } from '../../lib/storage/glossary'
import { GlossaryPage } from './GlossaryPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})
afterEach(() => vi.restoreAllMocks())

describe('GlossaryPage', () => {
  it('agrupa por idioma, edita y borra entradas', async () => {
    await addGlossaryEntry({ term: 'sacada', lang: 'es', definition: 'salto del ojo', context: 'La sacada es rápida.' })
    await addGlossaryEntry({ term: 'skim', lang: 'en', definition: 'leer por encima', translation: 'hojear' })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<GlossaryPage />)
    expect(await screen.findByRole('heading', { name: t('lang.es') })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: t('lang.en') })).toBeInTheDocument()
    expect(screen.getByText('La sacada es rápida.')).toBeInTheDocument()

    const item = screen.getByText('sacada').closest('li')!
    fireEvent.change(within(item).getByLabelText(t('glossary.definitionOf', { term: 'sacada' })), {
      target: { value: 'movimiento rápido del ojo' },
    })
    fireEvent.click(within(item).getByRole('button', { name: t('annot.save') }))
    await waitFor(async () => expect((await listGlossary('es'))[0].definition).toBe('movimiento rápido del ojo'))

    fireEvent.click(within(screen.getByText('skim').closest('li')!).getByRole('button', { name: t('notes.delete') }))
    await waitFor(async () => expect(await listGlossary('en')).toEqual([]))
    await waitFor(() => expect(screen.queryByText('skim')).not.toBeInTheDocument())
  })

  it('explica cómo añadir palabras cuando está vacío', async () => {
    render(<GlossaryPage />)
    expect(await screen.findByText(t('glossary.empty'))).toBeInTheDocument()
  })
})
