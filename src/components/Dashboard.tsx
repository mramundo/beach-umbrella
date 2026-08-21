import { useCallback, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { fetchWeather } from '../lib/weather'
import { scoreHours } from '../lib/score'
import { nowInTimezone } from '../lib/format'
import type { Place, WeatherBundle } from '../lib/types'
import { LocationCard } from './LocationCard'
import { NowCard } from './NowCard'
import { DaySection } from './DaySection'
import { SpotsSection } from './SpotsSection'
import { LoadingBall } from './LoadingBall'

interface Props {
  place: Place
  onSelectPlace: (place: Place) => void
}

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; weather: WeatherBundle }

/** Everything shown once a place is selected: clock, index, forecast, spots. */
export function Dashboard({ place, onSelectPlace }: Props) {
  const { t } = useI18n()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [nowIso, setNowIso] = useState<string | null>(null)

  const load = useCallback(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    fetchWeather(place.lat, place.lon, controller.signal)
      .then((weather) => {
        setState({ status: 'ready', weather })
        setNowIso(nowInTimezone(weather.timezone))
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [place.lat, place.lon])

  useEffect(() => load(), [load])

  // Keep "now" fresh so the current-hour marker and gauge follow the clock.
  useEffect(() => {
    if (state.status !== 'ready') return
    const id = setInterval(() => setNowIso(nowInTimezone(state.weather.timezone)), 30_000)
    return () => clearInterval(id)
  }, [state])

  const scored = useMemo(
    () => (state.status === 'ready' ? scoreHours(state.weather.hours) : []),
    [state],
  )

  const nowScored = useMemo(() => {
    if (state.status !== 'ready' || !nowIso) return null
    const prefix = nowIso.slice(0, 13)
    return scored.find((s) => s.hour.time.startsWith(prefix)) ?? null
  }, [state, scored, nowIso])

  if (state.status === 'loading') {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <LoadingBall label={t('loading.weather')} />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-6">
        <p role="alert" className="chip inline-block bg-coral-100 px-4 py-2 font-semibold">
          {t('error.weather')}
        </p>
        <div className="mt-3">
          <button type="button" onClick={load} className="btn-pop bg-sun-400 px-5 py-2">
            {t('error.retry')}
          </button>
        </div>
      </div>
    )
  }

  const { weather } = state

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 sm:px-6">
      <LocationCard place={place} timezone={weather.timezone} />
      <NowCard now={nowScored} hasMarine={weather.hasMarine} />
      {nowIso && <DaySection weather={weather} scored={scored} nowIso={nowIso} />}
      <SpotsSection place={place} onSelectPlace={onSelectPlace} />
    </div>
  )
}
