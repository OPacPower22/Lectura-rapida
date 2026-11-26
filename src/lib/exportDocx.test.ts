// @vitest-environment node
import JSZip from 'jszip'
import type { ProjectDocument } from './exportProject'
import { toDocx } from './exportDocx'

const doc: ProjectDocument = {
  title: 'Trazado de prueba ñandú',
  kindLabel: 'Trazado',
  topic: 'Atención',
  thesis: 'Se entrena',
  sections: [
    {
      title: 'Introducción',
      blocks: [
        { kind: 'texto', text: 'Párrafo propio con acentos: canción, pingüino' },
        { kind: 'cita', quote: 'La atención es limitada', text: 'Comentario', citation: '(Pérez, 2020, p. 12)' },
      ],
    },
  ],
  references: [
    { text: 'Ávila, R. (2019). Atención y memoria. https://x.org', italic: [18, 36] },
    { text: 'Pérez, A. (2020). La lectura atenta. Paidós.', italic: [18, 35] },
  ],
}

describe('toDocx', () => {
  it('genera un .docx válido con título, cita, referencias y caracteres especiales', async () => {
    const blob = await toDocx(doc)
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    const xml = await zip.file('word/document.xml')!.async('string')
    expect(xml).toContain('Trazado de prueba ñandú')
    expect(xml).toContain('«La atención es limitada»')
    expect(xml).toContain('(Pérez, 2020, p. 12)')
    expect(xml).toContain('Párrafo propio con acentos: canción, pingüino')
    expect(xml).toContain('Atención y memoria')
    expect(xml).toContain('Referencias')
    // El título del libro va en una ejecución en cursiva.
    expect(xml).toMatch(/<w:i\/>[\s\S]*?La lectura atenta/)
    const core = await zip.file('docProps/core.xml')!.async('string')
    expect(core).toContain('Trazado de prueba ñandú')
    expect(core).toContain('Lectura Rápida')
  })
})
