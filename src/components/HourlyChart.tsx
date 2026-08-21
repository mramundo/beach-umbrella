import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { BAND_COLORS, rampColor } from '../lib/bands'
import { hourLabel, hourOf, round1 } from '../lib/format'
import type { ScoredHour } from '../lib/types'

interface Props {
  /** Scored hours of one day (24 entries) */
  hours: ScoredHour[]
  /** local ISO "YYYY-MM-DDTHH:mm" of the current hour at the place, if this day is today */
  nowIso: string | null
}

const FIRST_HOUR = 6
const LAST_HOUR = 21

/** Hour-by-hour Dip Index bars (06–21) with tooltip, direct peak label and a table view. */
export function HourlyChart({ hours, nowIso }: Props) {
  const { t } = useI18n()
  const [hovered, setHovered] = useState<number | null>(null)
  const [tableView, setTableView] = useState(false)

  const visible = hours.filter((s) => {
    const h = hourOf(s.hour.time)
    return h >= FIRST_HOUR && h <= LAST_HOUR
  })
  if (visible.length === 0) return null

  const nowHourPrefix = nowIso ? nowIso.slice(0, 13) : null
  const maxScore = Math.max(0, ...visible.map((s) => s.score ?? 0))

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-display text-xl font-extrabold">{t('chart.title')}</h3>
          <p className="text-sm font-semibold text-ink-soft">{t('chart.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setTableView((v) => !v)}
          className="btn-pop bg-white px-3.5 py-1.5 text-xs"
        >
          {tableView ? t('chart.chart') : t('chart.table')}
        </button>
      </div>

      {tableView ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-105 border-collapse text-sm">
            <thead>
              <tr className="border-b-[3px] border-ink text-left font-display">
                <th className="py-2 pr-4">{t('chart.colHour')}</th>
                <th className="py-2 pr-4">{t('chart.colIndex')}</th>
                <th className="py-2 pr-4">{t('stat.uv')}</th>
                <th className="py-2">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.hour.time} className="border-b border-ink/15 font-semibold">
                  <td className="py-1.5 pr-4 tabular-nums">{hourLabel(s.hour.time)}</td>
                  <td className="py-1.5 pr-4 font-display text-base font-extrabold tabular-nums">
                    {s.score ?? '—'}
                  </td>
                  <td className="py-1.5 pr-4 tabular-nums">{round1(s.hour.uv)}</td>
                  <td className="py-1.5">
                    {BAND_COLORS[s.band].emoji} {t(`band.${s.band}`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-4" onMouseLeave={() => setHovered(null)}>
          <div className="flex h-44 items-end gap-1 sm:gap-1.5" role="img" aria-label={t('chart.title')}>
            {visible.map((s, i) => {
              const score = s.score
              const isNow = nowHourPrefix != null && s.hour.time.startsWith(nowHourPrefix)
              const isPeak = score != null && score === maxScore && maxScore > 0
              return (
                <button
                  key={s.hour.time}
                  type="button"
                  className="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end outline-none"
                  onMouseEnter={() => setHovered(i)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${hourLabel(s.hour.time)} — ${t('chart.colIndex')} ${score ?? '—'} — ${t(`band.${s.band}`)}`}
                >
                  {isPeak && (
                    <span className="mb-1 font-display text-xs font-extrabold sm:text-sm">{score}</span>
                  )}
                  {score == null ? (
                    <span aria-hidden="true" className="mb-1 text-xs opacity-50 sm:text-base">🌙</span>
                  ) : (
                    <div
                      className="animate-bar w-full rounded-t-md border-[2.5px] border-ink group-focus-visible:ring-[3px] group-focus-visible:ring-sea-400"
                      style={{
                        height: `${Math.max(5, score)}%`,
                        backgroundColor: rampColor(score),
                        animationDelay: `${i * 28}ms`,
                        borderBottomWidth: 0,
                      }}
                    />
                  )}
                  <div className={`h-1.5 w-full ${isNow ? 'bg-coral-500' : 'bg-ink'}`} />
                  <span
                    className={`mt-1 text-[10px] font-bold tabular-nums sm:text-xs ${
                      isNow ? 'text-coral-600' : 'text-ink-soft'
                    } ${hourOf(s.hour.time) % 3 === 0 || isNow ? '' : 'invisible sm:visible'}`}
                  >
                    {isNow ? t('chart.now') : `${hourOf(s.hour.time)}`}
                  </span>
                </button>
              )
            })}
          </div>

          {hovered != null && visible[hovered] && (
            <Tooltip scored={visible[hovered]} index={hovered} total={visible.length} />
          )}

          <p className="mt-2 text-right text-xs font-bold text-ink-soft">{t('chart.legend')}</p>
        </div>
      )}
    </div>
  )
}

function Tooltip({ scored, index, total }: { scored: ScoredHour; index: number; total: number }) {
  const { t } = useI18n()
  const h = scored.hour
  const band = BAND_COLORS[scored.band]
  const centerPct = ((index + 0.5) / total) * 100
  const align = centerPct < 25 ? 'left' : centerPct > 75 ? 'right' : 'center'

  const rows: Array<[string, string]> = [
    [t('stat.uv'), round1(h.uv)],
    [t('stat.air'), `${Math.round(h.temp)}°C`],
    ...(h.waterTemp != null ? ([[t('stat.water'), `${Math.round(h.waterTemp)}°C`]] as Array<[string, string]>) : []),
    ...(h.waveHeight != null ? ([[t('stat.waves'), `${round1(h.waveHeight)} m`]] as Array<[string, string]>) : []),
    [t('stat.wind'), `${Math.round(h.wind)} km/h`],
    [t('stat.rain'), `${Math.round(h.precipProb)}%`],
  ]

  return (
    <div
      className="card pointer-events-none absolute -top-2 z-20 w-48 -translate-y-full rounded-xl p-3 text-sm"
      style={{
        left: align === 'left' ? `${centerPct}%` : align === 'right' ? undefined : `${centerPct}%`,
        right: align === 'right' ? `${100 - centerPct}%` : undefined,
        transform: `translateY(-100%) ${align === 'center' ? 'translateX(-50%)' : ''}`,
      }}
    >
      <p className="flex items-center justify-between font-display text-base font-extrabold">
        {hourLabel(h.time)}
        <span>{scored.score ?? '—'}/100</span>
      </p>
      <p
        className="mt-1 inline-block rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold"
        style={{ backgroundColor: band.bg, color: band.fg }}
      >
        {band.emoji} {t(`band.${scored.band}`)}
      </p>
      <dl className="mt-2 space-y-0.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between font-semibold">
            <dt className="text-ink-soft">{label}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
