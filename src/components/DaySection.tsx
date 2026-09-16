import { useMemo, useState, type CSSProperties } from 'react'
import { useI18n } from '../lib/i18n'
import { findSwimWindows } from '../lib/score'
import { dateOf, dayTabLabel, hourLabel, weatherEmoji } from '../lib/format'
import type { ScoredHour, WeatherBundle } from '../lib/types'
import { HourlyChart } from './HourlyChart'

interface Props {
  weather: WeatherBundle
  scored: ScoredHour[]
  nowIso: string
}

/** Day tabs + best swim windows + the hourly chart. */
export function DaySection({ weather, scored, nowIso }: Props) {
  const { lang, t } = useI18n()
  const [dayIndex, setDayIndex] = useState(0)

  const byDate = useMemo(() => {
    const map = new Map<string, ScoredHour[]>()
    for (const s of scored) {
      const date = dateOf(s.hour.time)
      const list = map.get(date) ?? []
      list.push(s)
      map.set(date, list)
    }
    return map
  }, [scored])

  const day = weather.days[dayIndex]
  const dayHours = (day && byDate.get(day.date)) ?? []
  const windows = useMemo(() => findSwimWindows(dayHours), [dayHours])
  const today = dateOf(nowIso)

  return (
    <section className="card animate-rise p-5 sm:p-6">
      <div
        className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pt-1.5 pb-3.5"
        role="tablist"
        aria-label={t('a11y.selectDay')}
      >
        {weather.days.map((d, i) => {
          const selected = i === dayIndex
          const label =
            i === 0 && d.date === today
              ? t('day.today')
              : i === 1 && weather.days[0].date === today
                ? t('day.tomorrow')
                : dayTabLabel(d.date, lang)
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setDayIndex(i)}
              className={`chip flex shrink-0 cursor-pointer items-center gap-1.5 px-4 py-2 font-display text-base transition-colors ${
                selected ? '-rotate-1 bg-ink text-sun-300' : 'bg-white hover:bg-sea-50'
              }`}
            >
              <span aria-hidden="true">{weatherEmoji(d.code)}</span>
              {label}
              <span className={`font-sans text-xs font-extrabold ${selected ? 'text-sun-300/80' : 'text-ink-soft'}`}>
                {Math.round(d.tMax)}°
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 mb-7">
        <h3 className="squiggle inline-block font-display text-2xl font-extrabold">
          {t('windows.title')}
        </h3>
        <p className="mt-1.5 text-sm font-bold text-ink-soft">{t('windows.subtitle')}</p>
        {windows.length === 0 ? (
          <p className="chip mt-3.5 inline-block bg-sand-100 px-4 py-2 text-sm font-semibold">
            {t('windows.none')}
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-3.5">
            {windows.map((w, i) => (
              <li
                key={w.start}
                className={`sticker flex items-center gap-2.5 px-4 py-2 text-lg sm:text-xl ${
                  i === 0 ? 'bg-sun-400' : 'bg-white'
                }`}
                style={{ '--sticker-tilt': i === 0 ? '-1.5deg' : `${(i % 2) * 2 - 0.5}deg` } as CSSProperties}
              >
                {i === 0 && <span aria-hidden="true">⭐</span>}
                <span className="tabular-nums">
                  {hourLabel(w.start)} – {hourLabel(w.end)}
                </span>
                <span className="rounded-full border-[3px] border-ink bg-sea-50 px-2 py-0.5 font-sans text-xs font-extrabold">
                  {w.avgScore} {t('windows.avg')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <HourlyChart hours={dayHours} nowIso={day && day.date === today ? nowIso : null} />
    </section>
  )
}
