import { addCard, countDue, deleteCard, dueCards, gradeCard, listCards, updateCard } from './cards'
import { db } from './db'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('fichas', () => {
  it('una ficha nueva vence de inmediato y tras calificarla deja de estar pendiente', async () => {
    const id = await addCard({ kind: 'ficha', front: '¿Qué es una sacada?', back: 'Un salto del ojo', lang: 'es' })
    const now = new Date()
    expect(await countDue(now)).toBe(1)
    await gradeCard(id, 'good', now)
    expect(await countDue(now)).toBe(0)
    expect((await dueCards(new Date(now.getTime() + 30 * 86400000))).map((c) => c.id)).toEqual([id])
  })

  it('edita y borra', async () => {
    const id = await addCard({ kind: 'ficha', front: 'a', back: 'b', lang: 'es' })
    await updateCard(id, { front: 'A' })
    expect((await listCards())[0].front).toBe('A')
    await deleteCard(id)
    expect(await listCards()).toEqual([])
  })
})
