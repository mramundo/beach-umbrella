import type { Lang, Place } from './types'

interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  country_code?: string
  admin1?: string
}

/** Free place search — Open-Meteo geocoding, localized results, no API key. */
export async function searchPlaces(query: string, lang: Lang, signal?: AbortSignal): Promise<Place[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', query)
  url.searchParams.set('count', '8')
  url.searchParams.set('language', lang)
  url.searchParams.set('format', 'json')

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Geocoding failed: HTTP ${res.status}`)
  const data = (await res.json()) as { results?: GeocodingResult[] }

  return (data.results ?? []).map((r) => ({
    id: `gc-${r.id}`,
    name: r.name,
    admin: r.admin1,
    country: r.country,
    countryCode: r.country_code?.toUpperCase(),
    lat: r.latitude,
    lon: r.longitude,
    source: 'search' as const,
  }))
}

interface ReverseResult {
  city?: string
  locality?: string
  principalSubdivision?: string
  countryName?: string
  countryCode?: string
}

/** Free client-side reverse geocoding — BigDataCloud, no API key. */
export async function reverseGeocode(lat: number, lon: number, lang: Lang): Promise<ReverseResult | null> {
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client')
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('longitude', String(lon))
    url.searchParams.set('localityLanguage', lang)
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    return (await res.json()) as ReverseResult
  } catch {
    return null
  }
}

/** Browser geolocation wrapped in a promise. */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 5 * 60 * 1000,
    })
  })
}

/** Resolve the device position into a named Place. */
export async function locateMe(lang: Lang, fallbackName: string): Promise<Place> {
  const pos = await getCurrentPosition()
  const { latitude: lat, longitude: lon } = pos.coords
  const rev = await reverseGeocode(lat, lon, lang)
  const name = rev?.city || rev?.locality || fallbackName
  return {
    id: `geo-${lat.toFixed(3)}-${lon.toFixed(3)}`,
    name,
    admin: rev?.principalSubdivision,
    country: rev?.countryName,
    countryCode: rev?.countryCode?.toUpperCase(),
    lat,
    lon,
    source: 'geolocation',
  }
}

/** Country code → flag emoji ("IT" → 🇮🇹). */
export function flagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const base = 0x1f1e6
  const a = countryCode.toUpperCase().charCodeAt(0) - 65
  const b = countryCode.toUpperCase().charCodeAt(1) - 65
  if (a < 0 || a > 25 || b < 0 || b > 25) return ''
  return String.fromCodePoint(base + a, base + b)
}

/** Great-circle distance in km. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** A few Mediterranean starters shown before any search. */
export const QUICK_PICKS: Place[] = [
  { id: 'qp-rimini', name: 'Rimini', country: 'Italia', countryCode: 'IT', lat: 44.0594, lon: 12.5683, source: 'quickpick' },
  { id: 'qp-taormina', name: 'Taormina', country: 'Italia', countryCode: 'IT', lat: 37.8516, lon: 15.2853, source: 'quickpick' },
  { id: 'qp-alghero', name: 'Alghero', country: 'Italia', countryCode: 'IT', lat: 40.5579, lon: 8.3199, source: 'quickpick' },
  { id: 'qp-positano', name: 'Positano', country: 'Italia', countryCode: 'IT', lat: 40.6281, lon: 14.4837, source: 'quickpick' },
  { id: 'qp-nice', name: 'Nice', country: 'France', countryCode: 'FR', lat: 43.7102, lon: 7.262, source: 'quickpick' },
  { id: 'qp-barcelona', name: 'Barcelona', country: 'España', countryCode: 'ES', lat: 41.3874, lon: 2.1686, source: 'quickpick' },
]
