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

/**
 * Badge tint per category. The nine categories fall into three families, and a
 * tint belongs to exactly one family, so the colour means something instead of
 * repeating at random; the emoji beside it carries the precise category.
 */
export const CATEGORY_COLOR: Record<SpotCategory, string> = {
  // open coast and sea
  beach: 'var(--color-sun-300)',
  cove: 'var(--color-sun-300)',
  lagoon: 'var(--color-sun-300)',
  // supervised or built bathing places
  swim_area: 'var(--color-sea-200)',
  beach_resort: 'var(--color-sea-200)',
  pool: 'var(--color-sea-200)',
  water_park: 'var(--color-sea-200)',
  // inland fresh water
  lake: 'var(--color-coral-100)',
  quarry: 'var(--color-coral-100)',
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
  /** true when part of the data is missing, so the list may be incomplete */
  partial: boolean
}

/** The authoritative source: full tags, so exclusions and categories are exact. */
async function fetchFromOverpass(
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

/* ------------------------------------------------------------------ *
 * Fast preview (Photon)
 *
 * Overpass is thorough but slow (seconds to tens of seconds). Photon is a
 * search index over the same OSM data and answers in about a second, so it
 * fills the list immediately while Overpass is still running.
 *
 * Photon returns no `access`/`swimming` tags, so we only ask it for tags that
 * denote a bathing place or open coast. Pools (often private or hotel-only)
 * and generic water bodies (reservoirs where swimming is usually banned) are
 * left to Overpass, which can check those tags.
 * ------------------------------------------------------------------ */
const PHOTON_TAGS: Array<[string, SpotCategory]> = [
  ['natural:beach', 'beach'],
  ['natural:bay', 'cove'],
  ['leisure:beach_resort', 'beach_resort'],
  ['leisure:swimming_area', 'swim_area'],
  ['leisure:bathing_place', 'swim_area'],
  ['leisure:water_park', 'water_park'],
]

/**
 * Photon returns the N nearest matches overall, so a resort-dense town (a row
 * of beach clubs on one stretch of sand) would fill every slot and push the
 * actual beaches out. Querying the groups separately gives each its own slots.
 */
const PHOTON_GROUPS: string[][] = [
  ['natural:beach', 'natural:bay', 'leisure:swimming_area', 'leisure:bathing_place'],
  ['leisure:beach_resort', 'leisure:water_park'],
]

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    osm_id?: number
    osm_type?: string
    osm_key?: string
    osm_value?: string
    name?: string
  }
}

async function fetchPhotonGroup(
  tags: string[],
  lat: number,
  lon: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<SwimSpot[]> {
  const url = new URL('https://photon.komoot.io/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))
  url.searchParams.set('radius', String(radiusKm))
  url.searchParams.set('limit', '40')
  // Only 'default', 'en', 'de' and 'fr' are supported; 'default' keeps the
  // local OSM name, which is what people actually call the place.
  url.searchParams.set('lang', 'default')
  for (const tag of tags) url.searchParams.append('osm_tag', tag)

  const timeout = AbortSignal.timeout(8000)
  const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout })
  if (!res.ok) throw new Error(`Photon HTTP ${res.status}`)
  const data = (await res.json()) as { features?: PhotonFeature[] }

  const byTag = new Map(PHOTON_TAGS)
  const spots: SwimSpot[] = []

  for (const f of data.features ?? []) {
    const p = f.properties
    const coords = f.geometry?.coordinates
    if (!p || !coords) continue

    const category = byTag.get(`${p.osm_key}:${p.osm_value}`)
    if (!category || !p.name) continue

    const [spotLon, spotLat] = coords
    const distanceKm = haversineKm(lat, lon, spotLat, spotLon)
    if (distanceKm > radiusKm) continue

    // Same id shape as Overpass, so the two sources dedupe against each other.
    const type = p.osm_type === 'W' ? 'way' : p.osm_type === 'R' ? 'relation' : 'node'
    spots.push({
      id: `${type}-${p.osm_id}`,
      name: p.name,
      category,
      lat: spotLat,
      lon: spotLon,
      distanceKm,
    })
  }

  return spots
}

async function fetchFromPhoton(
  lat: number,
  lon: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<SwimSpot[]> {
  const groups = await Promise.allSettled(
    PHOTON_GROUPS.map((tags) => fetchPhotonGroup(tags, lat, lon, radiusKm, signal)),
  )
  if (groups.every((g) => g.status === 'rejected')) {
    throw (groups[0] as PromiseRejectedResult).reason
  }

  const seen = new Set<string>()
  const spots: SwimSpot[] = []
  for (const g of groups) {
    if (g.status !== 'fulfilled') continue
    for (const spot of g.value) {
      if (seen.has(spot.id)) continue
      seen.add(spot.id)
      spots.push(spot)
    }
  }
  return spots.sort((a, b) => a.distanceKm - b.distanceKm)
}

interface LoadOptions {
  signal?: AbortSignal
  /** Called with the fast preview if it arrives before the full list. */
  onPreview?: (spots: SwimSpot[]) => void
}

/**
 * Load swim spots: show Photon's answer within about a second, then replace it
 * with the tag-verified Overpass list when that lands. If Overpass fails
 * outright we keep the preview rather than showing nothing.
 */
export async function loadSwimSpots(
  lat: number,
  lon: number,
  radiusKm: number,
  { signal, onPreview }: LoadOptions = {},
): Promise<SpotsResult> {
  let overpassSettled = false

  const overpass = fetchFromOverpass(lat, lon, radiusKm, signal).finally(() => {
    overpassSettled = true
  })
  const photon = fetchFromPhoton(lat, lon, radiusKm, signal)

  photon
    .then((spots) => {
      if (!overpassSettled && spots.length > 0 && !signal?.aborted) onPreview?.(spots)
    })
    .catch(() => {
      /* the preview is a bonus; Overpass is the real answer */
    })

  try {
    return await overpass
  } catch (overpassError) {
    const preview = await photon.catch(() => null)
    if (preview && preview.length > 0) return { spots: preview, partial: true }
    throw overpassError
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

/* ---------------- local cache: instant list when coming back --------------- */

const CACHE_PREFIX = 'beach-umbrella.spots.'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 12

function cacheKey(lat: number, lon: number, radiusKm: number): string {
  // ~100 m granularity: revisiting the same place reuses the same entry.
  return `${CACHE_PREFIX}${lat.toFixed(3)},${lon.toFixed(3)},${radiusKm}`
}

export function readCachedSpots(lat: number, lon: number, radiusKm: number): SwimSpot[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(lat, lon, radiusKm))
    if (!raw) return null
    const entry = JSON.parse(raw) as { t: number; spots: SwimSpot[] }
    if (!Array.isArray(entry.spots) || Date.now() - entry.t > CACHE_TTL_MS) return null
    return entry.spots
  } catch {
    return null
  }
}

export function writeCachedSpots(
  lat: number,
  lon: number,
  radiusKm: number,
  spots: SwimSpot[],
): void {
  try {
    localStorage.setItem(cacheKey(lat, lon, radiusKm), JSON.stringify({ t: Date.now(), spots }))

    // Keep only the most recent entries so storage cannot grow without bound.
    const entries: Array<[string, number]> = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(CACHE_PREFIX)) continue
      try {
        entries.push([key, (JSON.parse(localStorage.getItem(key) ?? '{}') as { t?: number }).t ?? 0])
      } catch {
        entries.push([key, 0])
      }
    }
    entries
      .sort((a, b) => b[1] - a[1])
      .slice(CACHE_MAX_ENTRIES)
      .forEach(([key]) => localStorage.removeItem(key))
  } catch {
    /* private mode or quota exceeded — the cache is optional */
  }
}
