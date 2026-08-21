export type Lang = 'it' | 'en'

export interface Place {
  id: string
  name: string
  admin?: string
  country?: string
  countryCode?: string
  lat: number
  lon: number
  source: 'search' | 'geolocation' | 'spot' | 'quickpick'
}

export interface HourPoint {
  /** ISO local time at the location, e.g. "2026-08-21T14:00" */
  time: string
  temp: number
  apparentTemp: number
  uv: number
  cloud: number
  precipProb: number
  precip: number
  wind: number
  gusts: number
  code: number
  isDay: boolean
  waveHeight?: number
  waterTemp?: number
}

export interface DayInfo {
  /** "2026-08-21" */
  date: string
  sunrise: string
  sunset: string
  uvMax: number
  tMax: number
  tMin: number
  code: number
}

export interface WeatherBundle {
  timezone: string
  utcOffsetSeconds: number
  hours: HourPoint[]
  days: DayInfo[]
  /** true if real sea data (waves + water temperature) is available nearby */
  hasMarine: boolean
}

export interface ScoreBreakdown {
  sun: number
  air: number
  water: number
  waves: number
  wind: number
  rain: number
}

export type BandId = 'perfect' | 'great' | 'fair' | 'poor' | 'bad' | 'night'

export interface ScoredHour {
  hour: HourPoint
  /** 0..100 Dip Index, or null outside daylight */
  score: number | null
  band: BandId
  breakdown: ScoreBreakdown | null
}

export interface SwimWindow {
  /** local ISO of first hour */
  start: string
  /** local ISO of the hour AFTER the last included hour (exclusive end) */
  end: string
  avgScore: number
}

export type SpotCategory =
  | 'beach'
  | 'cove'
  | 'swim_area'
  | 'beach_resort'
  | 'pool'
  | 'water_park'
  | 'lake'
  | 'lagoon'
  | 'quarry'

export interface SwimSpot {
  id: string
  name: string | null
  category: SpotCategory
  lat: number
  lon: number
  distanceKm: number
}
