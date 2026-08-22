import type { CSSProperties } from 'react'
import { useI18n } from '../lib/i18n'
import { BAND_COLORS } from '../lib/bands'
import { round1 } from '../lib/format'
import type { ScoredHour } from '../lib/types'
import { Gauge } from './Gauge'

interface Props {
  now: ScoredHour | null
  hasMarine: boolean
}

const STAT_EMOJI: Record<string, string> = {
  air: '🌡️',
  water: '🌊',
  uv: '☀️',
  waves: '〰️',
  wind: '💨',
  rain: '🌦️',
}

/** The hero card: current Dip Index gauge + the numbers behind it. */
export function NowCard({ now, hasMarine }: Props) {
  const { t } = useI18n()
  if (!now) return null

  const band = BAND_COLORS[now.band]
  const isNight = now.score == null
  const h = now.hour

  const stats: Array<{ key: string; label: string; value: string; note?: string }> = [
    { key: 'air', label: t('stat.air'), value: `${Math.round(h.temp)}°C` },
    {
      key: 'water',
      label: t('stat.water'),
      value: h.waterTemp != null ? `${Math.round(h.waterTemp)}°C` : '—',
      note: !hasMarine ? t('stat.estimated') : undefined,
    },
    { key: 'uv', label: t('stat.uv'), value: round1(h.uv) },
    {
      key: 'waves',
      label: t('stat.waves'),
      value: h.waveHeight != null ? `${round1(h.waveHeight)} m` : '—',
    },
    { key: 'wind', label: t('stat.wind'), value: `${Math.round(h.wind)} km/h` },
    { key: 'rain', label: t('stat.rain'), value: `${Math.round(h.precipProb)}%` },
  ]

  return (
    <div className="card animate-rise flex flex-col overflow-hidden sm:flex-row">
      {/* Gauge panel on a sea-tinted ground */}
      <div className="flex flex-col items-center border-b-4 border-ink bg-gradient-to-b from-sea-100 to-sea-50 px-6 pt-6 pb-7 sm:w-[46%] sm:border-r-4 sm:border-b-0">
        <span className="sticker bg-white px-4 py-1 text-base tracking-wide uppercase" style={{ '--sticker-tilt': '-1.5deg' } as CSSProperties}>
          {t('now.title')}
        </span>
        <Gauge value={now.score} color={band.bg} label={t('now.title')} />
        <span
          className="sticker -mt-1 px-5 py-1.5 text-xl"
          style={{ backgroundColor: band.bg, color: band.fg, '--sticker-tilt': '2deg' } as CSSProperties}
        >
          {band.emoji} {t(`band.${now.band}`)}
        </span>
        <p className="mt-4 max-w-xs text-center text-sm font-bold text-ink-soft">
          {isNight ? t('now.night') : t('now.updated')}
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid flex-1 grid-cols-2 gap-3 p-5 sm:content-center sm:gap-3.5 sm:p-6 md:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.key}
            className="hover-wiggle rounded-2xl border-[3px] border-ink bg-sand-50 px-3 py-3 shadow-[3px_3px_0_0_var(--color-ink)]"
          >
            <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-ink-soft uppercase">
              <span aria-hidden="true" className="text-base">
                {STAT_EMOJI[s.key]}
              </span>
              {s.label}
            </p>
            <p className="mt-0.5 font-display text-[1.7rem] leading-none font-extrabold">{s.value}</p>
            {s.note && (
              <p className="mt-1 text-[11px] leading-tight font-semibold text-ink-soft">{s.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
