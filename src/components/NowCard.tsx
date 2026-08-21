import { useI18n } from '../lib/i18n'
import { BAND_COLORS } from '../lib/bands'
import { round1 } from '../lib/format'
import type { ScoredHour } from '../lib/types'
import { Gauge } from './Gauge'

interface Props {
  now: ScoredHour | null
  hasMarine: boolean
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

  const STAT_EMOJI: Record<string, string> = {
    air: '🌡️',
    water: '🌊',
    uv: '☀️',
    waves: '〰️',
    wind: '💨',
    rain: '🌦️',
  }

  return (
    <div className="card animate-rise overflow-hidden">
      <div className="flex flex-col items-center gap-2 px-5 pt-6 sm:flex-row sm:justify-around sm:gap-6">
        <div className="flex flex-col items-center">
          <h3 className="font-display text-xl font-extrabold uppercase tracking-wide">
            {t('now.title')}
          </h3>
          <Gauge value={now.score} color={band.bg} label={t('now.title')} />
          <span
            className="chip -mt-1 px-4 py-1.5 font-display text-lg"
            style={{ backgroundColor: band.bg, color: band.fg }}
          >
            {band.emoji} {t(`band.${now.band}`)}
          </span>
          <p className="mt-3 mb-2 max-w-xs text-center text-sm font-semibold text-ink-soft">
            {isNight ? t('now.night') : t('now.updated')}
          </p>
        </div>

        <div className="grid w-full max-w-md grid-cols-2 gap-2.5 pb-6 sm:grid-cols-3 sm:pt-2">
          {stats.map((s) => (
            <div key={s.key} className="rounded-2xl border-[2.5px] border-ink bg-sand-50 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-ink-soft uppercase">
                <span aria-hidden="true">{STAT_EMOJI[s.key]}</span>
                {s.label}
              </p>
              <p className="font-display text-2xl font-extrabold">{s.value}</p>
              {s.note && <p className="text-[11px] leading-tight font-semibold text-ink-soft">{s.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
