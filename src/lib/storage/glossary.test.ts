import { db } from './db'
import { addGlossaryEntry, deleteGlossaryEntry, listGlossary, updateGlossaryEntry } from './glossary'

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
})
