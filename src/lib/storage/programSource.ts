import { addSource } from './library'
import { getSetting, setSetting } from './settings'
import { db } from './db'

/** Fuente donde se guardan las notas de los ejercicios del programa (mapas, esquemas). */
export async function programSourceId(title: string): Promise<number> {
  const id = await getSetting<number>('program:sourceId')
  if (id !== undefined && (await db.sources.get(id))) return id
  const created = await addSource({ type: 'documento', title })
  await setSetting('program:sourceId', created)
  return created
}
