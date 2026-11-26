const files = import.meta.glob<string>('./dia-*.md', { query: '?raw', import: 'default', eager: true })

export interface Lesson {
  day: number
  title: string
  body: string
  minutes: number
  /** Idioma del contenido de la lección. */
  lang: string
}

const lessons: Lesson[] = Object.entries(files)
  .map(([path, raw]) => {
    const day = Number(path.match(/dia-(\d+)\.md$/)![1])
    const text = raw.replace(/\r\n?/g, '\n').trim()
    const title = text.match(/^# (.+)$/m)?.[1].trim() ?? `Día ${day}`
    const body = text.replace(/^# .+\n+/, '')
    return { day, title, body, minutes: 3, lang: 'es' }
  })
  .sort((a, b) => a.day - b.day)

export function getLessons(): Lesson[] {
  return lessons
}

export function getLesson(day: number): Lesson {
  const lesson = lessons.find((l) => l.day === day)
  if (!lesson) throw new Error(`No hay lección para el día ${day}`)
  return lesson
}
