import type { BandId, HourPoint, ScoreBreakdown, ScoredHour, SwimWindow } from './types'

/**
 * The Dip Index — a 0–100 "how good is this hour for a swim" score,
 * tuned for people who love the water but not the sun.
 *
 * Weights (documented in the FAQ — keep both in sync):
 *   gentle sun (UV)    35%
 *   rain risk          15%
 *   air comfort        15%
 *   water temperature  15%
 *   calm sea (waves)   12%
 *   light wind          8%
 *
 * Thunderstorms cap the score near zero; hours after sunset are not scored.
 */
const WEIGHTS = {
  sun: 0.35,
  rain: 0.15,
  air: 0.15,
  water: 0.15,
  waves: 0.12,
  wind: 0.08,
} as const

/** Fallback water score when no marine data exists (lakes, inland spots). */
const WATER_SCORE_ESTIMATE = 65

/** Piecewise-linear interpolation over sorted [x, score] breakpoints. */
function piecewise(x: number, points: Array<[number, number]>): number {
  if (x <= points[0][0]) return points[0][1]
  const last = points[points.length - 1]
  if (x >= last[0]) return last[1]
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1]
    const [x2, y2] = points[i]
    if (x <= x2) {
      const t = (x - x1) / (x2 - x1)
      return y1 + t * (y2 - y1)
    }
  }
  return last[1]
}

const clamp01to100 = (v: number) => Math.max(0, Math.min(100, v))

/** Low UV is the whole point: great up to ~2, worthless from ~7.5. */
export function sunScore(uv: number): number {
  return clamp01to100(piecewise(uv, [
    [1, 100],
    [2, 88],
    [3, 70],
    [4, 52],
    [5, 34],
    [6, 18],
    [7, 6],
    [7.5, 0],
  ]))
}

/** Pleasant air: ideal 24–31 °C, harsh below 18 or above 38. */
export function airScore(temp: number): number {
  return clamp01to100(piecewise(temp, [
    [12, 0],
    [18, 40],
    [22, 80],
    [24, 100],
    [31, 100],
    [34, 70],
    [38, 25],
    [42, 0],
  ]))
}

/** Water you actually want to get into: 24 °C+ ideal, below 16 °C a shock. */
export function waterScore(waterTemp: number | undefined): number {
  if (waterTemp == null) return WATER_SCORE_ESTIMATE
  return clamp01to100(piecewise(waterTemp, [
    [12, 0],
    [16, 15],
    [18, 40],
    [20, 65],
    [22, 85],
    [24, 100],
  ]))
}

/** Calm sea: flat is perfect, above ~1.5 m stay out. */
export function wavesScore(waveHeight: number | undefined): number {
  if (waveHeight == null) return 70
  return clamp01to100(piecewise(waveHeight, [
    [0.1, 100],
    [0.3, 90],
    [0.6, 65],
    [1.0, 35],
    [1.5, 0],
  ]))
}

/** Breeze fine, wind bad (km/h). */
export function windScore(wind: number): number {
  return clamp01to100(piecewise(wind, [
    [8, 100],
    [15, 80],
    [22, 55],
    [30, 25],
    [40, 0],
  ]))
}

/** Rain risk from probability (%) and actual amount (mm). */
export function rainScore(prob: number, amount: number): number {
  let s = clamp01to100(piecewise(prob, [
    [0, 100],
    [20, 85],
    [40, 55],
    [60, 25],
    [80, 0],
  ]))
  if (amount > 0.5) s = Math.min(s, 25)
  return s
}

/** WMO weather codes: thunderstorms are a hard no, heavy rain nearly so. */
function weatherCodeCap(code: number): number {
  if (code >= 95) return 3 // thunderstorm
  if (code === 65 || code === 67 || code === 82) return 25 // heavy rain / violent showers
  return 100
}

export function scoreHour(hour: HourPoint): ScoredHour {
  if (!hour.isDay) {
    return { hour, score: null, band: 'night', breakdown: null }
  }

  const breakdown: ScoreBreakdown = {
    sun: Math.round(sunScore(hour.uv)),
    air: Math.round(airScore(hour.temp)),
    water: Math.round(waterScore(hour.waterTemp)),
    waves: Math.round(wavesScore(hour.waveHeight)),
    wind: Math.round(windScore(hour.wind)),
    rain: Math.round(rainScore(hour.precipProb, hour.precip)),
  }

  const weighted =
    breakdown.sun * WEIGHTS.sun +
    breakdown.rain * WEIGHTS.rain +
    breakdown.air * WEIGHTS.air +
    breakdown.water * WEIGHTS.water +
    breakdown.waves * WEIGHTS.waves +
    breakdown.wind * WEIGHTS.wind

  const score = Math.round(Math.min(weighted, weatherCodeCap(hour.code)))
  return { hour, score, band: bandFor(score), breakdown }
}

export function bandFor(score: number): BandId {
  if (score >= 80) return 'perfect'
  if (score >= 60) return 'great'
  if (score >= 40) return 'fair'
  if (score >= 20) return 'poor'
  return 'bad'
}

export function scoreHours(hours: HourPoint[]): ScoredHour[] {
  return hours.map(scoreHour)
}

/**
 * Best swim windows for one day: contiguous daylight hours whose score
 * clears a threshold. If the day is mediocre, the bar adapts downward so
 * we can still point at "the least bad" moments — but never below 45.
 */
export function findSwimWindows(dayHours: ScoredHour[]): SwimWindow[] {
  const scored = dayHours.filter((s) => s.score != null)
  if (scored.length === 0) return []

  const max = Math.max(...scored.map((s) => s.score as number))
  const threshold = Math.max(45, Math.min(65, max - 8))
  if (max < 45) return []

  const windows: SwimWindow[] = []
  let run: ScoredHour[] = []

  const flush = () => {
    if (run.length === 0) return
    const avg = run.reduce((a, s) => a + (s.score as number), 0) / run.length
    const lastTime = run[run.length - 1].hour.time
    windows.push({ start: run[0].hour.time, end: addOneHour(lastTime), avgScore: Math.round(avg) })
    run = []
  }

  for (const s of dayHours) {
    if (s.score != null && s.score >= threshold) run.push(s)
    else flush()
  }
  flush()

  return windows.sort((a, b) => b.avgScore - a.avgScore).slice(0, 3)
}

function addOneHour(isoLocal: string): string {
  const [date, time] = isoLocal.split('T')
  const [h, m] = time.split(':').map(Number)
  if (h === 23) return `${date}T23:59`
  return `${date}T${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
