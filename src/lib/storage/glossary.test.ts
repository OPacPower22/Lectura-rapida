import { db } from './db'
import { addGlossaryEntry, deleteGlossaryEntry, listGlossary, updateGlossaryEntry } from './glossary'
import { listCards } from './cards'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('glosario', () => {
  it('ordena alfabéticamente según el idioma y filtra por idioma', async () => {
    await addGlossaryEntry({ term: 'zeta', lang: 'es', definition: 'z' })
    await addGlossaryEntry({ term: 'ábaco', lang: 'es', definition: 'a' })
    await addGlossaryEntry({ term: 'apple', lang: 'en', definition: 'manzana' })
    expect((await listGlossary('es')).map((e) => e.term)).toEqual(['ábaco', 'zeta'])
    expect(await listGlossary()).toHaveLength(3)
  })

  it('actualiza y borra', async () => {
    const id = await addGlossaryEntry({ term: 'sacada', lang: 'es', definition: '' })
    await updateGlossaryEntry(id, { definition: 'movimiento rápido del ojo' })
    expect((await listGlossary('es'))[0].definition).toBe('movimiento rápido del ojo')
    await deleteGlossaryEntry(id)
    expect(await listGlossary('es')).toEqual([])
  })

  it('cada entrada tiene su ficha, que se actualiza y se borra con ella', async () => {
    const id = await addGlossaryEntry({ term: 'sacada', lang: 'es', definition: 'salto del ojo', context: 'La sacada es rápida.' })
    let [card] = await listCards()
    expect(card).toMatchObject({ kind: 'glosario', glossaryId: id, front: 'sacada' })
    expect(card.back).toContain('salto del ojo')
    await updateGlossaryEntry(id, { definition: 'movimiento rápido del ojo', translation: 'saccade' })
    ;[card] = await listCards()
    expect(card.back).toContain('movimiento rápido del ojo')
    expect(card.back).toContain('saccade')
    await deleteGlossaryEntry(id)
    expect(await listCards()).toEqual([])
  })
})
