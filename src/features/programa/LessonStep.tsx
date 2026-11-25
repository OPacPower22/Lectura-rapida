import { getLesson } from '../../content/lecciones'
import { t } from '../../i18n'
import { renderMarkdown } from '../../lib/markdown'
import { primary } from './exercises/common'

export function LessonStep({ day, onDone }: { day: number; onDone(): void }) {
  const lesson = getLesson(day)
  return (
    <article className="space-y-3 leading-relaxed">
      <h2 className="text-2xl font-semibold">{lesson.title}</h2>
      {renderMarkdown(lesson.body)}
      <button type="button" className={primary} onClick={onDone}>
        {t('program.lessonDone')}
      </button>
    </article>
  )
}
