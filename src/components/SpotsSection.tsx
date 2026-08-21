import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { CATEGORY_EMOJI, DEFAULT_RADIUS_KM, WIDE_RADIUS_KM, fetchSwimSpots, osmLink } from '../lib/spots'
import { formatKm } from '../lib/format'
import type { Place, SpotCategory, SwimSpot } from '../lib/types'
import { LoadingBall } from './LoadingBall'

interface Props {
  place: Place
  onSelectPlace: (place: Place) => void
}

type Status = 'loading' | 'ready' | 'error'

const PAGE = 12

/** Swimmable places around the selected location, from OpenStreetMap. */
export function SpotsSection({ place, onSelectPlace }: Props) {
  const { lang, t } = useI18n()
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)
  const [status, setStatus] = useState<Status>('loading')
  const [spots, setSpots] = useState<SwimSpot[]>([])
  const [filter, setFilter] = useState<SpotCategory | 'all'>('all')
  const [limit, setLimit] = useState(PAGE)

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    fetchSwimSpots(place.lat, place.lon, radiusKm, controller.signal)
      .then((found) => {
        setSpots(found)
        setStatus('ready')
        setLimit(PAGE)
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error')
      })
    return () => controller.abort()
  }, [place.lat, place.lon, radiusKm])

  const categories = useMemo(() => {
    const present = new Set(spots.map((s) => s.category))
    return [...present].sort()
  }, [spots])

  const filtered = filter === 'all' ? spots : spots.filter((s) => s.category === filter)
  const shown = filtered.slice(0, limit)

  const unnamedLabel = (s: SwimSpot) =>
    s.category === 'beach'
      ? t('spots.unnamed.beach')
      : s.category === 'cove'
        ? t('spots.unnamed.cove')
        : t('spots.unnamed.generic')

  const checkConditionsHere = (s: SwimSpot) => {
    onSelectPlace({
      id: `spot-${s.id}`,
      name: s.name ?? unnamedLabel(s),
      admin: place.name,
      country: place.country,
      countryCode: place.countryCode,
      lat: s.lat,
      lon: s.lon,
      source: 'spot',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="animate-rise">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{t('spots.title')}</h2>
          <p className="mt-1 max-w-2xl font-semibold text-ink-soft">
            {t('spots.subtitle', { place: place.name })}
          </p>
        </div>
        <p className="chip bg-white px-3 py-1 text-xs">{t('spots.radiusNote', { km: radiusKm })}</p>
      </div>

      {status === 'loading' && <LoadingBall label={t('spots.loading')} />}

      {status === 'error' && (
        <p role="alert" className="chip mt-4 inline-block bg-coral-100 px-4 py-2 font-semibold">
          {t('spots.error')}
        </p>
      )}

      {status === 'ready' && spots.length === 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="chip inline-block bg-sand-100 px-4 py-2 font-semibold">
            {t('spots.empty', { km: radiusKm })}
          </p>
          {radiusKm < WIDE_RADIUS_KM && (
            <button
              type="button"
              onClick={() => setRadiusKm(WIDE_RADIUS_KM)}
              className="btn-pop bg-sun-400 px-4 py-2 text-sm"
            >
              {t('spots.expand', { km: WIDE_RADIUS_KM })}
            </button>
          )}
        </div>
      )}

      {status === 'ready' && spots.length > 0 && (
        <>
          {categories.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <FilterChip
                active={filter === 'all'}
                label={`${t('spots.all')} (${spots.length})`}
                onClick={() => setFilter('all')}
              />
              {categories.map((c) => (
                <FilterChip
                  key={c}
                  active={filter === c}
                  label={`${CATEGORY_EMOJI[c]} ${t(`cat.${c}`)} (${spots.filter((s) => s.category === c).length})`}
                  onClick={() => setFilter(c)}
                />
              ))}
            </div>
          )}

          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((s) => (
              <li key={s.id} className="card flex flex-col justify-between gap-3 rounded-2xl p-4">
                <div>
                  <p className="text-2xl" aria-hidden="true">
                    {CATEGORY_EMOJI[s.category]}
                  </p>
                  <h3 className="mt-1 font-display text-lg leading-tight font-extrabold">
                    {s.name ?? unnamedLabel(s)}
                  </h3>
                  <p className="mt-0.5 text-sm font-bold text-ink-soft">
                    {t(`cat.${s.category}`)} · {formatKm(s.distanceKm, lang)} {t('spots.away')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => checkConditionsHere(s)}
                    className="btn-pop bg-sea-400 px-3.5 py-1.5 text-sm text-white"
                  >
                    {t('spots.checkHere')}
                  </button>
                  <a
                    href={osmLink(s)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-pop inline-block bg-white px-3.5 py-1.5 text-sm"
                  >
                    🗺️ {t('spots.map')}
                  </a>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {shown.length < filtered.length && (
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="btn-pop bg-white px-5 py-2.5"
              >
                {t('spots.showMore')} ({filtered.length - shown.length})
              </button>
            )}
            {radiusKm < WIDE_RADIUS_KM && (
              <button
                type="button"
                onClick={() => setRadiusKm(WIDE_RADIUS_KM)}
                className="btn-pop bg-sun-400 px-5 py-2.5"
              >
                {t('spots.expand', { km: WIDE_RADIUS_KM })}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`chip cursor-pointer px-3.5 py-1.5 text-sm transition-colors ${
        active ? 'bg-ink text-sun-300' : 'bg-white hover:bg-sea-50'
      }`}
    >
      {label}
    </button>
  )
}
