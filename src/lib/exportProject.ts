import { t } from '../i18n'
import { bibliography, formatReference, inTextCitation } from './citation'
import type { Note, NoteKind, Project, Source } from './storage/db'

export interface ExportBlock {
  kind: NoteKind | 'texto'
  text: string
  quote?: string
  citation?: string
}

export interface ProjectDocument {
  title: string
  kindLabel: string
  topic: string
  thesis: string
  sections: { title: string; blocks: ExportBlock[] }[]
  references: ReturnType<typeof formatReference>[]
}

/**
 * Estructura del documento a exportar. Las notas borradas se omiten; las ideas propias no llevan cita;
 * una nota de una fuente borrada se cita como «fuente eliminada» y no entra en la bibliografía.
 */
export function buildProjectDocument(project: Project, notes: Map<number, Note>, sources: Map<number, Source>): ProjectDocument {
  const used = new Map<number, Source>()
  const sections = project.sections.map((section) => ({
    title: section.title,
    blocks: section.items.flatMap((item): ExportBlock[] => {
      if (item.type === 'text') return item.text.trim() ? [{ kind: 'texto', text: item.text.trim() }] : []
      const note = notes.get(item.noteId)
      if (!note) return []
      const source = sources.get(note.sourceId)
      if (source) used.set(source.id!, source)
      return [
        {
          kind: note.kind,
          text: note.text.trim(),
          quote: note.quote?.trim() || undefined,
          citation: note.kind === 'idea' ? undefined : inTextCitation(source, note.page),
        },
      ]
    }),
  }))
  return {
    title: project.title.trim() || t('project.untitled'),
    kindLabel: t(`project.kind.${project.kind}`),
    topic: project.topic.trim(),
    thesis: project.thesis.trim(),
    sections,
    references: bibliography([...used.values()]),
  }
}

/** Escapa los signos de Markdown del texto del usuario para que se vea tal cual. */
export function escapeMd(s: string): string {
  return s
    .replace(/^[ \t]{4,}/gm, '')
    .replace(/([\\`*_[\]<>#|~&])/g, '\\$1')
    .replace(/^([ \t]*)([-=])(?=\2*[ \t]*$)/gm, '$1\\$2')
    .replace(/^([ \t]*)([+-])([ \t])/gm, '$1\\$2$3')
    .replace(/^([ \t]*\d+)([.)])([ \t])/gm, '$1\\$2$3')
}

const withCitation = (text: string, citation?: string) => (citation ? `${text} ${escapeMd(citation)}` : text)

export function toMarkdown(doc: ProjectDocument): string {
  const out: string[] = [`# ${escapeMd(doc.title)}`, `*${escapeMd(doc.kindLabel)}*`]
  if (doc.topic) out.push(`**${t('export.topic')}:** ${escapeMd(doc.topic)}`)
  if (doc.thesis) out.push(`**${t('export.thesis')}:** ${escapeMd(doc.thesis)}`)
  for (const section of doc.sections) {
    out.push(`## ${escapeMd(section.title || t('project.untitledSection'))}`)
    for (const b of section.blocks) {
      if (b.quote) {
        out.push(`> ${withCitation(`«${escapeMd(b.quote)}»`, b.citation).replace(/\n/g, '\n> ')}`)
        if (b.text) out.push(escapeMd(b.text))
      } else if (b.text) {
        out.push(withCitation(escapeMd(b.text), b.citation))
      }
    }
  }
  if (doc.references.length) {
    out.push(`## ${t('export.references')}`)
    for (const r of doc.references) {
      if (!r.italic) out.push(escapeMd(r.text))
      else {
        const [a, b] = r.italic
        out.push(`${escapeMd(r.text.slice(0, a))}*${escapeMd(r.text.slice(a, b))}*${escapeMd(r.text.slice(b))}`)
      }
    }
  }
  return out.join('\n\n') + '\n'
}
