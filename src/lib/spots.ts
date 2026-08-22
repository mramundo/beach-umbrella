import { haversineKm } from './geo'
import type { SpotCategory, SwimSpot } from './types'

/**
 * Public Overpass instances. They rate-limit per IP and answer 429/503 when
 * busy, so we try them in a rotating order and fall through on failure.
 */
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
  /** Overpass reports runtime errors (timeouts) here alongside HTTP 200 */
  remark?: string
}

/**
 * A bounding box around a point, as Overpass wants it: south,west,north,east.
 *
 * We query by bbox rather than `around` on purpose: `around` bypasses the
 * spatial index and made these queries time out server-side. The bbox is a
 * square, so results are re-filtered to the exact radius client-side.
 */
function bboxAround(lat: number, lon: number, radiusKm: number): string {
  const dLat = radiusKm / 111.32
  // cos(lat) → 0 near the poles, so clamp the longitude span.
  const cos = Math.cos((lat * Math.PI) / 180)
  const dLon = Math.min(180, radiusKm / (111.32 * Math.max(0.01, cos)))
  const south = Math.max(-90, lat - dLat)
  const north = Math.min(90, lat + dLat)
  const west = Math.max(-180, lon - dLon)
  const east = Math.min(180, lon + dLon)
  return `${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)}`
}

/**
 * Coastal and built swimming places. Tag exclusions (private access, explicit
 * no-swimming) are applied client-side in `isSwimmable`: negated filters are
 * expensive server-side, and we receive the tags anyway.
 *
 * No numeric `out` limit: Overpass emits nodes before ways, so any limit
 * silently truncates the ways — which is where most beaches live.
 */
function coastalQuery(bbox: string): string {
  return `[out:json][timeout:30][bbox:${bbox}];
(
  nwr["natural"="beach"];
  nwr["natural"="bay"]["name"];
  nwr["leisure"="swimming_area"];
  nwr["leisure"="bathing_place"];
  nwr["leisure"="beach_resort"];
  nwr["leisure"="water_park"];
  nwr["leisure"="swimming_pool"]["name"];
);
out center qt;`
}

/** Inland water: lakes, lagoons and flooded quarries (named ones only). */
function inlandQuery(bbox: string): string {
  return `[out:json][timeout:30][bbox:${bbox}];
(
  wr["natural"="water"]["water"="lake"]["name"];
  wr["natural"="water"]["water"="lagoon"]["name"];
  wr["natural"="water"]["water"="quarry"]["name"];
);
out center qt;`
}

/** Tags that mean "you cannot (or should not) swim here". */
const BLOCKED_ACCESS = new Set(['private', 'no', 'permit', 'customers', 'members'])

function isSwimmable(tags: Record<string, string>): boolean {
  if (tags.swimming === 'no' || tags.swimming === 'private') return false
  if (tags.access && BLOCKED_ACCESS.has(tags.access)) return false
  if (tags.bathing === 'no') return false
  return true
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
  // Rotate the starting endpoint so we spread load instead of always
  // hammering (and getting throttled by) the same instance.
  const offset = Math.floor(Math.random() * ENDPOINTS.length)
  let lastError: unknown = null

  for (let i = 0; i < ENDPOINTS.length; i++) {
    const endpoint = ENDPOINTS[(offset + i) % ENDPOINTS.length]
    const timeout = AbortSignal.timeout(35_000)
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
    try {
      // GET keeps responses cacheable by the service worker.
      const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { signal: combined })
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`)
      const data = (await res.json()) as OverpassResponse
      // Overpass signals query timeouts via `remark` while returning HTTP 200.
      if (data.remark && /error|timed out/i.test(data.remark)) {
        throw new Error(`Overpass remark: ${data.remark}`)
      }
      return data.elements ?? []
    } catch (err) {
      if (signal?.aborted) throw err
      lastError = err
    }
  }
  throw lastError ?? new Error('Overpass unavailable')
}

export interface SpotsResult {
  spots: SwimSpot[]
  /** true when one of the two queries failed and the list may be incomplete */
  partial: boolean
}

export async function fetchSwimSpots(
  lat: number,
  lon: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<SpotsResult> {
  const bbox = bboxAround(lat, lon, radiusKm)

  const [coastal, inland] = await Promise.allSettled([
    runQuery(coastalQuery(bbox), signal),
    runQuery(inlandQuery(bbox), signal),
  ])

  if (coastal.status === 'rejected' && inland.status === 'rejected') {
    throw coastal.reason
  }

  const elements = [
    ...(coastal.status === 'fulfilled' ? coastal.value : []),
    ...(inland.status === 'fulfilled' ? inland.value : []),
  ]

  return {
    spots: normalize(elements, lat, lon, radiusKm),
    partial: coastal.status === 'rejected' || inland.status === 'rejected',
  }
}

function normalize(
  elements: OverpassElement[],
  lat: number,
  lon: number,
  radiusKm: number,
): SwimSpot[] {
  const spots: SwimSpot[] = []

  for (const el of elements) {
    const tags = el.tags ?? {}
    if (!isSwimmable(tags)) continue

    const category = categorize(tags)
    if (!category) continue

    const elLat = el.lat ?? el.center?.lat
    const elLon = el.lon ?? el.center?.lon
    if (elLat == null || elLon == null) continue

    // The bbox is a square: trim its corners back to the requested radius.
    const distanceKm = haversineKm(lat, lon, elLat, elLon)
    if (distanceKm > radiusKm) continue

    spots.push({
      id: `${el.type}-${el.id}`,
      name: tags.name ?? null,
      category,
      lat: elLat,
      lon: elLon,
      distanceKm,
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

  // Unnamed spots are useful (free beaches!) but noisy — keep a few.
  const named = kept.filter((s) => s.name)
  const unnamed = kept.filter((s) => !s.name).slice(0, 15)
  return [...named, ...unnamed].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 80)
}

export function osmLink(spot: SwimSpot): string {
  return `https://www.openstreetmap.org/?mlat=${spot.lat}&mlon=${spot.lon}#map=16/${spot.lat}/${spot.lon}`
}
