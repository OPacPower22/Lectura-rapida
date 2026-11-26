import { t } from '../i18n'
import type { ProjectDocument } from './exportProject'

/** Genera el .docx en el navegador; la librería se descarga solo al exportar. */
export async function toDocx(doc: ProjectDocument): Promise<Blob> {
  const { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx')

  /** Respeta los saltos de línea del texto del usuario. */
  const runs = (text: string, opts: { italics?: boolean; bold?: boolean } = {}) =>
    text.split('\n').map((line, i) => new TextRun({ text: line, break: i > 0 ? 1 : undefined, ...opts }))

  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: runs(doc.title) }),
    new Paragraph({ children: runs(doc.kindLabel, { italics: true }) }),
  ]
  if (doc.topic) children.push(new Paragraph({ children: [new TextRun({ text: `${t('export.topic')}: `, bold: true }), ...runs(doc.topic)] }))
  if (doc.thesis) children.push(new Paragraph({ children: [new TextRun({ text: `${t('export.thesis')}: `, bold: true }), ...runs(doc.thesis)] }))

  for (const section of doc.sections) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs(section.title || t('project.untitledSection')) }))
    for (const b of section.blocks) {
      if (b.quote) {
        children.push(
          new Paragraph({
            indent: { left: 720, right: 720 },
            alignment: AlignmentType.JUSTIFIED,
            children: [...runs(`«${b.quote}»`), ...(b.citation ? [new TextRun(` ${b.citation}`)] : [])],
          }),
        )
        if (b.text) children.push(new Paragraph({ children: runs(b.text) }))
      } else if (b.text) {
        children.push(new Paragraph({ children: [...runs(b.text), ...(b.citation ? [new TextRun(` ${b.citation}`)] : [])] }))
      }
    }
  }

  if (doc.references.length) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t('export.references'))] }))
    for (const r of doc.references) {
      const [a, b] = r.italic ?? [r.text.length, r.text.length]
      children.push(
        new Paragraph({
          indent: { left: 720, hanging: 720 },
          children: [
            new TextRun(r.text.slice(0, a)),
            ...(b > a ? [new TextRun({ text: r.text.slice(a, b), italics: true })] : []),
            new TextRun(r.text.slice(b)),
          ],
        }),
      )
    }
  }

  const document = new Document({
    creator: 'Lectura Rápida',
    title: doc.title,
    styles: { default: { document: { run: { font: 'Calibri', size: 24 } } } },
    sections: [{ children }],
  })
  return Packer.toBlob(document)
}
