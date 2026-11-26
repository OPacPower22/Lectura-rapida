import type { Note, Project, Source } from './storage/db'
import { buildProjectDocument, toMarkdown } from './exportProject'

const sources = new Map<number, Source>([
  [1, { id: 1, type: 'libro', title: 'La lectura atenta', author: 'Pérez, A.', year: '2020', publisher: 'Paidós', createdAt: 0 }],
  [2, { id: 2, type: 'web', title: 'Atención y memoria', author: 'Ávila, R.', year: '2019', url: 'https://x.org', createdAt: 0 }],
])
const note = (n: Partial<Note> & Pick<Note, 'id' | 'kind'>): Note => ({ sourceId: 1, text: '', lang: 'es', createdAt: 0, ...n })
const notes = new Map<number, Note>([
  [10, note({ id: 10, kind: 'cita', quote: 'La atención es *limitada*', text: 'Clave para la tesis', page: 12 })],
  [11, note({ id: 11, kind: 'parafrasis', sourceId: 2, text: '# No es un título' })],
  [12, note({ id: 12, kind: 'idea', text: 'Mi idea propia' })],
  [13, note({ id: 13, kind: 'parafrasis', sourceId: 77, text: 'De una fuente borrada' })],
])
const project: Project = {
  id: 1,
  title: 'Trazado: «La atención»',
  kind: 'trazado',
  topic: 'La atención en la lectura',
  thesis: 'La atención se entrena',
  lang: 'es',
  createdAt: 0,
  updatedAt: 0,
  sections: [
    { id: 'a', title: 'Introducción', items: [{ type: 'text', text: 'Primer párrafo con _guiones_\ny salto' }, { type: 'note', noteId: 10 }] },
    { id: 'b', title: 'Desarrollo', items: [{ type: 'note', noteId: 11 }, { type: 'note', noteId: 12 }, { type: 'note', noteId: 999 }, { type: 'note', noteId: 13 }] },
  ],
}

describe('buildProjectDocument', () => {
  const doc = buildProjectDocument(project, notes, sources)
  it('omite notas borradas y cita cada nota con su fuente', () => {
    expect(doc.sections[1].blocks).toHaveLength(3)
    expect(doc.sections[0].blocks[1]).toMatchObject({ kind: 'cita', quote: 'La atención es *limitada*', citation: '(Pérez, 2020, p. 12)', text: 'Clave para la tesis' })
    expect(doc.sections[1].blocks[0]).toMatchObject({ kind: 'parafrasis', citation: '(Ávila, 2019)' })
    expect(doc.sections[1].blocks[1]).toMatchObject({ kind: 'idea', citation: undefined })
    expect(doc.sections[1].blocks[2]).toMatchObject({ citation: '(fuente eliminada)' })
  })
  it('bibliografía con las fuentes usadas, en orden alfabético', () => {
    expect(doc.references.map((r) => r.text)).toEqual([
      'Ávila, R. (2019). Atención y memoria. https://x.org',
      'Pérez, A. (2020). La lectura atenta. Paidós.',
    ])
  })
})

describe('toMarkdown', () => {
  const md = toMarkdown(buildProjectDocument(project, notes, sources))
  it('título, tipo, tema y tesis', () => {
    expect(md).toMatch(/^# Trazado: «La atención»\n/)
    expect(md).toContain('**Tema:** La atención en la lectura')
    expect(md).toContain('**Tesis:** La atención se entrena')
  })
  it('escapa el formato del texto del usuario', () => {
    expect(md).toContain('> «La atención es \\*limitada\\*» (Pérez, 2020, p. 12)')
    expect(md).toContain('\\# No es un título (Ávila, 2019)')
    expect(md).toContain('Primer párrafo con \\_guiones\\_\ny salto')
    expect(md).not.toMatch(/^# No es/m)
  })
  it('referencias con el título en cursiva', () => {
    expect(md).toContain('## Referencias')
    expect(md).toContain('Pérez, A. (2020). *La lectura atenta*. Paidós.')
    expect(md).toContain('Ávila, R. (2019). *Atención y memoria*. https://x.org')
  })
})

describe('toMarkdown: texto que Markdown interpretaría', () => {
  const doc = (text: string) => ({
    title: 'T', kindLabel: 'Ensayo', topic: '', thesis: '', references: [],
    sections: [{ title: 'S', blocks: [{ kind: 'texto' as const, text }] }],
  })
  it('una línea de guiones o iguales no se convierte en título ni en separador', () => {
    expect(toMarkdown(doc('Título falso\n---'))).toContain('Título falso\n\\---')
    expect(toMarkdown(doc('Otro\n===='))).toContain('Otro\n\\====')
  })
  it('los & no forman entidades y la sangría no crea bloques de código', () => {
    const md = toMarkdown(doc('A &amp; B\n\n    código'))
    expect(md).toContain('A \\&amp; B')
    expect(md).toMatch(/\ncódigo/)
    expect(md).not.toMatch(/\n {4}código/)
  })
})
