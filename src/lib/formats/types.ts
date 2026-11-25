import type { Chapter, Source } from '../storage/db'

export interface ImportedDocument {
  title: string
  author?: string
  lang?: string
  chapters: Chapter[]
  source: Omit<Source, 'id' | 'createdAt'>
}

export type ImportErrorCode = 'no-content' | 'no-text' | 'drm' | 'invalid' | 'too-large'

export class ImportError extends Error {
  code: ImportErrorCode
  constructor(code: ImportErrorCode) {
    super(code)
    this.name = 'ImportError'
    this.code = code
  }
}

/** Tamaño máximo de archivo importado: 200 MB. */
export const MAX_IMPORT_BYTES = 200 * 1024 * 1024

export function hasWords(chapters: Chapter[]): boolean {
  return chapters.some((c) => c.paragraphs.some((p) => /[\p{L}\p{N}]/u.test(p)))
}
