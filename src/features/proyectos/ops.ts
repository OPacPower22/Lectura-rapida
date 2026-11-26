import type { Project, ProjectItem, ProjectSection } from '../../lib/storage/db'

function swap<T>(list: T[], i: number, j: number): T[] {
  if (j < 0 || j >= list.length) return list
  const out = [...list]
  ;[out[i], out[j]] = [out[j], out[i]]
  return out
}

const mapSection = (p: Project, sectionId: string, fn: (s: ProjectSection) => ProjectSection): Project => ({
  ...p,
  sections: p.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
})

export const moveSection = (p: Project, index: number, delta: -1 | 1): Project => ({ ...p, sections: swap(p.sections, index, index + delta) })

export const moveItem = (p: Project, sectionId: string, index: number, delta: -1 | 1): Project =>
  mapSection(p, sectionId, (s) => ({ ...s, items: swap(s.items, index, index + delta) }))

export const removeItem = (p: Project, sectionId: string, index: number): Project =>
  mapSection(p, sectionId, (s) => ({ ...s, items: s.items.filter((_, i) => i !== index) }))

export const appendItems = (p: Project, sectionId: string, items: ProjectItem[]): Project =>
  mapSection(p, sectionId, (s) => ({ ...s, items: [...s.items, ...items] }))

export const updateItem = (p: Project, sectionId: string, index: number, item: ProjectItem): Project =>
  mapSection(p, sectionId, (s) => ({ ...s, items: s.items.map((it, i) => (i === index ? item : it)) }))

export const renameSection = (p: Project, sectionId: string, title: string): Project => mapSection(p, sectionId, (s) => ({ ...s, title }))

/** Mueve un elemento al final de otra sección. */
export function transferItem(p: Project, fromId: string, index: number, toId: string): Project {
  const item = p.sections.find((s) => s.id === fromId)?.items[index]
  if (!item || fromId === toId) return p
  return appendItems(removeItem(p, fromId, index), toId, [item])
}
