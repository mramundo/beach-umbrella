import { haversineKm } from './geo'
import type { SpotCategory, SwimSpot } from './types'

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
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

/**
 * Everything swimmable around a point, from OpenStreetMap.
 * Explicitly excludes places tagged as no-swimming or private access;
 * pools and lakes must be named (unnamed ones are mostly backyard pools
 * and map noise). Legality/safety still has to be checked on site — the
 * FAQ says so.
 */
function buildQuery(lat: number, lon: number, radiusM: number): string {
  const around = `(around:${radiusM},${lat.toFixed(5)},${lon.toFixed(5)})`
  return `[out:json][timeout:30];
(
  nwr["natural"="beach"]["swimming"!="no"]["access"!="private"]${around};
  nwr["natural"="bay"]["name"]${around};
  nwr["leisure"="swimming_area"]["access"!="private"]${around};
  nwr["leisure"="bathing_place"]${around};
  nwr["leisure"="beach_resort"]${around};
  nwr["leisure"="water_park"]${around};
  nwr["leisure"="swimming_pool"]["name"]["access"!="private"]["access"!="customers"]${around};
  nwr["natural"="water"]["water"~"^(lake|lagoon|quarry)$"]["name"]["swimming"!="no"]["access"!="private"]${around};
);
out center tags 160;`
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

export async function fetchSwimSpots(
  lat: number,
  lon: number,
  radiusKm: number,
  signal?: AbortSignal,
): Promise<SwimSpot[]> {
  const query = buildQuery(lat, lon, Math.round(radiusKm * 1000))

  let lastError: unknown = null
  for (const endpoint of ENDPOINTS) {
    try {
      // GET keeps responses cacheable by the service worker.
      const url = `${endpoint}?data=${encodeURIComponent(query)}`
      const res = await fetch(url, { signal })
      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`)
      const data = (await res.json()) as { elements?: OverpassElement[] }
      return normalize(data.elements ?? [], lat, lon)
    } catch (err) {
      if (signal?.aborted) throw err
      lastError = err
    }
  }
  throw lastError ?? new Error('Overpass unavailable')
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
