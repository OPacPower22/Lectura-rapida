import { useState } from 'react'
import { t } from '../../../i18n'
import { addCard } from '../../../lib/storage/cards'
import { CardForm } from '../../retencion/CardForm'
import { DoneButton } from './common'

/** Crear `count` fichas escritas por el usuario. */
export function MakeCards({ count, onDone }: { count: number; onDone(): void }) {
  const [made, setMade] = useState(0)
  if (made >= count) return <DoneButton onClick={onDone} />
  return (
    <div className="space-y-3">
      <p className="font-medium">{t('cards.progress', { n: made + 1, count })}</p>
      <CardForm
        key={made}
        onSave={async (front, back) => {
          await addCard({ kind: 'ficha', front, back, lang: 'es' })
          setMade((m) => m + 1)
        }}
      />
    </div>
  )
}
