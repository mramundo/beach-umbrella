import { haversineKm } from './geo'
import type { HourPoint, DayInfo, WeatherBundle } from './types'

const FORECAST_DAYS = 7

interface ForecastResponse {
  timezone: string
  utc_offset_seconds: number
  hourly: {
    time: string[]
    temperature_2m: (number | null)[]
    apparent_temperature: (number | null)[]
    uv_index: (number | null)[]
    cloud_cover: (number | null)[]
    precipitation_probability: (number | null)[]
    precipitation: (number | null)[]
    weather_code: (number | null)[]
    wind_speed_10m: (number | null)[]
    wind_gusts_10m: (number | null)[]
    is_day: (number | null)[]
  }
  daily: {
    time: string[]
    sunrise: string[]
    sunset: string[]
    uv_index_max: (number | null)[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
    weather_code: (number | null)[]
  }
}

interface MarineResponse {
  latitude: number
  longitude: number
  hourly: {
    time: string[]
    wave_height: (number | null)[]
    sea_surface_temperature: (number | null)[]
  }
}

/**
 * Fetch weather + marine forecast for a point, merged per hour.
 * Marine data is only kept when Open-Meteo's nearest sea grid cell is close
 * enough to be meaningful (inland places would otherwise get a far-away sea).
 */
export async function fetchWeather(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherBundle> {
  const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast')
  forecastUrl.searchParams.set('latitude', String(lat))
  forecastUrl.searchParams.set('longitude', String(lon))
  forecastUrl.searchParams.set(
    'hourly',
    'temperature_2m,apparent_temperature,uv_index,cloud_cover,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,is_day',
  )
  forecastUrl.searchParams.set(
    'daily',
    'sunrise,sunset,uv_index_max,temperature_2m_max,temperature_2m_min,weather_code',
  )
  forecastUrl.searchParams.set('forecast_days', String(FORECAST_DAYS))
  forecastUrl.searchParams.set('timezone', 'auto')

  const marineUrl = new URL('https://marine-api.open-meteo.com/v1/marine')
  marineUrl.searchParams.set('latitude', String(lat))
  marineUrl.searchParams.set('longitude', String(lon))
  marineUrl.searchParams.set('hourly', 'wave_height,sea_surface_temperature')
  marineUrl.searchParams.set('forecast_days', String(FORECAST_DAYS))
  marineUrl.searchParams.set('timezone', 'auto')

  const [forecastRes, marineRes] = await Promise.allSettled([
    fetch(forecastUrl, { signal }),
    fetch(marineUrl, { signal }),
  ])

  if (forecastRes.status === 'rejected' || !forecastRes.value.ok) {
    throw new Error('Forecast request failed')
  }
  const forecast = (await forecastRes.value.json()) as ForecastResponse

  let marine: MarineResponse | null = null
  if (marineRes.status === 'fulfilled' && marineRes.value.ok) {
    try {
      const m = (await marineRes.value.json()) as MarineResponse
      // Keep marine data only when the sea grid cell is within ~40 km.
      const gridDistance = haversineKm(lat, lon, m.latitude, m.longitude)
      const hasValues = m.hourly?.sea_surface_temperature?.some((v) => v != null)
      if (gridDistance <= 40 && hasValues) marine = m
    } catch {
      marine = null
    }
  }

  const marineByTime = new Map<string, { wave?: number; water?: number }>()
  if (marine) {
    marine.hourly.time.forEach((t, i) => {
      marineByTime.set(t, {
        wave: marine.hourly.wave_height[i] ?? undefined,
        water: marine.hourly.sea_surface_temperature[i] ?? undefined,
      })
    })
  }

  const h = forecast.hourly
  const hours: HourPoint[] = h.time.map((time, i) => {
    const m = marineByTime.get(time)
    return {
      time,
      temp: h.temperature_2m[i] ?? 0,
      apparentTemp: h.apparent_temperature[i] ?? h.temperature_2m[i] ?? 0,
      uv: h.uv_index[i] ?? 0,
      cloud: h.cloud_cover[i] ?? 0,
      precipProb: h.precipitation_probability[i] ?? 0,
      precip: h.precipitation[i] ?? 0,
      wind: h.wind_speed_10m[i] ?? 0,
      gusts: h.wind_gusts_10m[i] ?? 0,
      code: h.weather_code[i] ?? 0,
      isDay: (h.is_day[i] ?? 0) === 1,
      waveHeight: m?.wave,
      waterTemp: m?.water,
    }
  })

  const d = forecast.daily
  const days: DayInfo[] = d.time.map((date, i) => ({
    date,
    sunrise: d.sunrise[i],
    sunset: d.sunset[i],
    uvMax: d.uv_index_max[i] ?? 0,
    tMax: d.temperature_2m_max[i] ?? 0,
    tMin: d.temperature_2m_min[i] ?? 0,
    code: d.weather_code[i] ?? 0,
  }))

  return {
    timezone: forecast.timezone,
    utcOffsetSeconds: forecast.utc_offset_seconds,
    hours,
    days,
    hasMarine: marine != null,
  }
}
