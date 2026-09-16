import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useI18n } from '../lib/i18n'
import {
  CATEGORY_COLOR,
  CATEGORY_EMOJI,
  DEFAULT_RADIUS_KM,
  WIDE_RADIUS_KM,
  loadSwimSpots,
  osmLink,
  readCachedSpots,
  writeCachedSpots,
} from '../lib/spots'
import { formatKm } from '../lib/format'
import type { Place, SpotCategory, SwimSpot } from '../lib/types'

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
  const [partial, setPartial] = useState(false)
  const [refining, setRefining] = useState(false)
  const [filter, setFilter] = useState<SpotCategory | 'all'>('all')
  const [limit, setLimit] = useState(PAGE)
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setLimit(PAGE)

    // A recent list for this place shows instantly; the fetch still refreshes it.
    const cached = readCachedSpots(place.lat, place.lon, radiusKm)
    if (cached && cached.length > 0) {
      setSpots(cached)
      setPartial(false)
      setStatus('ready')
    } else {
      setSpots([])
      setStatus('loading')
    }

    loadSwimSpots(place.lat, place.lon, radiusKm, {
      signal: controller.signal,
      // Photon answers in about a second — show it while Overpass finishes.
      onPreview: (preview) => {
        if (controller.signal.aborted) return
        setSpots(preview)
        setPartial(false)
        setStatus('ready')
        setRefining(true)
      },
    })
      .then((result) => {
        if (controller.signal.aborted) return
        setSpots(result.spots)
        setPartial(result.partial)
        setStatus('ready')
        setRefining(false)
        if (!result.partial && result.spots.length > 0) {
          writeCachedSpots(place.lat, place.lon, radiusKm, result.spots)
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setRefining(false)
        if (!cached?.length) setStatus('error')
      })

    return () => controller.abort()
  }, [place.lat, place.lon, radiusKm, attempt])

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="squiggle inline-block font-display text-3xl font-extrabold sm:text-4xl">
            🗺️ {t('spots.title')}
          </h2>
          <p className="mt-2 max-w-2xl font-bold text-ink-soft">
            {t('spots.subtitle', { place: place.name })}
          </p>
        </div>
        <p className="sticker bg-white px-3 py-1 text-xs" style={{ '--sticker-tilt': '1.5deg' } as CSSProperties}>
          {t('spots.radiusNote', { km: radiusKm })}
        </p>
      </div>

      {status === 'loading' && <SpotsSkeleton label={t('spots.loading')} />}

      {status === 'error' && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p role="alert" className="chip inline-block bg-coral-100 px-4 py-2 font-semibold">
            {t('spots.error')}
          </p>
          <button type="button" onClick={retry} className="btn-pop bg-sun-400 px-5 py-2">
            {t('error.retry')}
          </button>
        </div>
      )}

      {status === 'ready' && spots.length === 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
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
          {refining && (
            <p className="chip mt-4 inline-flex items-center gap-2 bg-sea-50 px-4 py-1.5 text-sm font-semibold">
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-sea-500" />
              {t('spots.refining')}
            </p>
          )}
          {partial && !refining && (
            <p className="chip mt-4 inline-block bg-sand-100 px-4 py-1.5 text-sm font-semibold">
              ⚠️ {t('spots.partial')}
            </p>
          )}

          {categories.length > 1 && (
            <div className="mt-5 flex flex-wrap gap-2.5">
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

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((s, i) => (
              <li
                key={s.id}
                className="card hover-pop animate-rise flex flex-col justify-between gap-3 rounded-2xl p-4"
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-[3px] border-ink text-2xl shadow-pop-xs"
                    style={{ backgroundColor: CATEGORY_COLOR[s.category] }}
                  >
                    {CATEGORY_EMOJI[s.category]}
                  </span>
                  <div>
                    <h3 className="font-display text-lg leading-tight font-extrabold">
                      {s.name ?? unnamedLabel(s)}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-ink-soft">
                      {t(`cat.${s.category}`)} · {formatKm(s.distanceKm, lang)} {t('spots.away')}
                    </p>
                  </div>
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

          <div className="mt-6 flex flex-wrap justify-center gap-3">
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

/** Placeholder cards: the layout appears at once instead of a blank wait. */
function SpotsSkeleton({ label }: { label: string }) {
  return (
    <div className="mt-6" role="status" aria-live="polite">
      <p className="chip inline-flex items-center gap-2 bg-white px-4 py-1.5 text-sm font-semibold">
        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-sea-500" />
        {label}
      </p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="card animate-pulse rounded-2xl p-4" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 shrink-0 rounded-xl border-[3px] border-ink bg-sand-200" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-3/4 rounded-full bg-sand-200" />
                <div className="h-3 w-1/2 rounded-full bg-sand-100" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-28 rounded-full border-[3px] border-ink bg-sand-100" />
              <div className="h-8 w-20 rounded-full border-[3px] border-ink bg-sand-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`chip cursor-pointer px-3.5 py-1.5 text-sm transition-colors ${
        active ? '-rotate-1 bg-ink text-sun-300' : 'bg-white hover:bg-sea-50'
      }`}
    >
      {label}
    </button>
  )
}
