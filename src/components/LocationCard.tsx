import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { flagEmoji } from '../lib/geo'
import { clockIn, dateStringIn } from '../lib/format'
import type { Place } from '../lib/types'

interface Props {
  place: Place
  timezone: string
}

/** Selected place with its live local clock. */
export function LocationCard({ place, timezone }: Props) {
  const { lang, t } = useI18n()
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="card animate-rise flex flex-col justify-between gap-4 bg-sea-50 p-5 sm:flex-row sm:items-center">
      <div>
        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          {flagEmoji(place.countryCode)} {place.name}
        </h2>
        <p className="mt-1 font-semibold text-ink-soft">
          {[place.admin, place.country].filter(Boolean).join(', ')}
        </p>
      </div>
      <div className="sm:text-right">
        <p className="text-sm font-bold text-ink-soft uppercase">{t('place.localTime')}</p>
        <p className="font-display text-4xl font-extrabold tabular-nums" aria-live="off">
          {clockIn(timezone, lang)}
        </p>
        <p className="font-semibold text-ink-soft">
          {dateStringIn(timezone, lang)} · {timezone.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  )
}
