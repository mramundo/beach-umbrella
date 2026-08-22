import { haversineKm } from './geo'
import type { SpotCategory, SwimSpot } from './types'

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

export const DEFAULT_RADIUS_KM = 25
export const WIDE_RADIUS_KM = 60

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements?: OverpassElement[]
  /** Overpass reports runtime errors (e.g. timeouts) here with HTTP 200 */
  remark?: string
}

/**
 * Two separate queries so one heavy clause can't starve the rest:
 * a cheap "coastal & leisure" query, and an "inland water" query over the
 * huge natural=water category (equality filters only — regexes on that
 * category are what made the original single query time out server-side).
 * Explicitly excludes places tagged no-swimming or private; pools and
 * lakes must be named (unnamed ones are mostly backyard pools and noise).
 */
function coastalQuery(around: string): string {
  return `[out:json][timeout:25];
(
  nwr["natural"="beach"]["swimming"!="no"]["access"!="private"]${around};
  nwr["natural"="bay"]["name"]${around};
  nwr["leisure"="swimming_area"]["access"!="private"]${around};
  nwr["leisure"="bathing_place"]${around};
  nwr["leisure"="beach_resort"]${around};
  nwr["leisure"="water_park"]${around};
  nwr["leisure"="swimming_pool"]["name"]["access"!="private"]["access"!="customers"]${around};
);
out center qt 120;`
}

function lakesQuery(around: string): string {
  return `[out:json][timeout:25];
(
  wr["natural"="water"]["water"="lake"]["name"]["swimming"!="no"]["access"!="private"]${around};
  wr["natural"="water"]["water"="lagoon"]["name"]["swimming"!="no"]${around};
  wr["natural"="water"]["water"="quarry"]["name"]["swimming"!="no"]${around};
);
out center qt 60;`
}

function categorize(tags: Record<string, string>): SpotCategory | null {
  if (tags.natural === 'beach') return 'beach'
  if (tags.natural === 'bay') return 'cove'
  if (tags.leisure === 'swimming_area' || tags.leisure === 'bathing_place') return 'swim_area'
  if (tags.leisure === 'beach_resort') return 'beach_resort'
  if (tags.leisure === 'water_park') return 'water_park'
  if (tags.leisure === 'swimming_pool') return 'pool'
  if (tags.natural === 'water') {
    if (tags.water === 'lagoon') return 'lagoon'
    if (tags.water === 'quarry') return 'quarry'
    return 'lake'
  }
  return null
}

export const CATEGORY_EMOJI: Record<SpotCategory, string> = {
  beach: '🏖️',
  cove: '🏝️',
  swim_area: '🏊',
  beach_resort: '⛱️',
  pool: '🩱',
  water_park: '🛝',
  lake: '🏞️',
  lagoon: '🦩',
  quarry: '💎',
}

/** Accent colors per category for the spot cards (badge backgrounds). */
export const CATEGORY_COLOR: Record<SpotCategory, string> = {
  beach: 'var(--color-sun-300)',
  cove: 'var(--color-sea-200)',
  swim_area: 'var(--color-sea-100)',
  beach_resort: 'var(--color-coral-100)',
  pool: 'var(--color-sea-100)',
  water_park: 'var(--color-coral-100)',
  lake: 'var(--color-sea-200)',
  lagoon: 'var(--color-coral-100)',
  quarry: 'var(--color-sand-200)',
}

async function runQuery(query: string, signal?: AbortSignal): Promise<OverpassElement[]> {
  let lastError: unknown = null
  for (const endpoint of ENDPOINTS) {
    // Per-endpoint timeout so one hung instance doesn't stall the whole list.
    const timeout = AbortSignal.timeout(32_000)
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
    try {
      // GET keeps responses cacheable by the service worker.
      const url = `${endpoint}?data=${encodeURIComponent(query)}`
      const res = await fetch(url, { signal: combined })
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`)
      const data = (await res.json()) as OverpassResponse
      const elements = data.elements ?? []
      // Overpass signals timeouts/errors via `remark` while returning 200.
      if (elements.length === 0 && data.remark && /error|timed out/i.test(data.remark)) {
        throw new Error(`Overpass remark: ${data.remark}`)
      }
      return elements
    } catch (err) {
      if (signal?.aborted) throw err
      lastError = err
    }
  }
  throw lastError ?? new Error('Overpass unavailable')
}

export interface SpotsResult {
  spots: SwimSpot[]
  /** true when the inland-water query failed and only coastal spots are shown */
  partial: boolean
}

export async function fetchSwimSpots(
  lat: number,
  lon: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<SpotsResult> {
  const around = `(around:${Math.round(radiusKm * 1000)},${lat.toFixed(5)},${lon.toFixed(5)})`

  const [coastal, lakes] = await Promise.allSettled([
    runQuery(coastalQuery(around), signal),
    runQuery(lakesQuery(around), signal),
  ])

  if (coastal.status === 'rejected' && lakes.status === 'rejected') {
    throw coastal.reason
  }

  const elements = [
    ...(coastal.status === 'fulfilled' ? coastal.value : []),
    ...(lakes.status === 'fulfilled' ? lakes.value : []),
  ]
  return {
    spots: normalize(elements, lat, lon),
    partial: coastal.status === 'rejected' || lakes.status === 'rejected',
  }
}

function normalize(elements: OverpassElement[], lat: number, lon: number): SwimSpot[] {
  const spots: SwimSpot[] = []

  for (const el of elements) {
    const tags = el.tags ?? {}
    const category = categorize(tags)
    if (!category) continue

    const elLat = el.lat ?? el.center?.lat
    const elLon = el.lon ?? el.center?.lon
    if (elLat == null || elLon == null) continue

    spots.push({
      id: `${el.type}-${el.id}`,
      name: tags.name ?? null,
      category,
      lat: elLat,
      lon: elLon,
      distanceKm: haversineKm(lat, lon, elLat, elLon),
    })
  }

  spots.sort((a, b) => a.distanceKm - b.distanceKm)

  // Dedupe: same name (or both unnamed, same category) within ~400 m.
  const kept: SwimSpot[] = []
  for (const spot of spots) {
    const dup = kept.some(
      (k) =>
        haversineKm(k.lat, k.lon, spot.lat, spot.lon) < 0.4 &&
        (k.name && spot.name ? k.name === spot.name : k.category === spot.category),
    )
    if (!dup) kept.push(spot)
  }

  // Unnamed spots are useful (beaches!) but noisy — keep a reasonable amount.
  const named = kept.filter((s) => s.name)
  const unnamed = kept.filter((s) => !s.name).slice(0, 15)
  return [...named, ...unnamed].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 80)
}

export function osmLink(spot: SwimSpot): string {
  return `https://www.openstreetmap.org/?mlat=${spot.lat}&mlon=${spot.lon}#map=16/${spot.lat}/${spot.lon}`
}
