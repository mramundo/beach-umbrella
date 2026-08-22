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
    <div className="card animate-rise flex flex-col justify-between gap-5 bg-gradient-to-r from-sea-50 to-sand-50 p-5 sm:flex-row sm:items-center sm:p-6">
      <div>
        <h2 className="font-display text-4xl font-extrabold tracking-tight">
          {flagEmoji(place.countryCode)} {place.name}
        </h2>
        <p className="mt-1.5 text-lg font-bold text-ink-soft">
          {[place.admin, place.country].filter(Boolean).join(', ')}
        </p>
      </div>
      <div className="flex flex-col items-start sm:items-end">
        <div className="sticker rotate-1 bg-sun-300 px-5 py-2.5">
          <p className="text-[11px] font-extrabold tracking-widest uppercase">
            🕐 {t('place.localTime')}
          </p>
          <p className="font-display text-4xl leading-tight font-extrabold tabular-nums sm:text-5xl" aria-live="off">
            {clockIn(timezone, lang)}
          </p>
        </div>
        <p className="mt-2.5 font-semibold text-ink-soft">
          {dateStringIn(timezone, lang)} · {timezone.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  )
}
