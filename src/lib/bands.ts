import type { BandId } from './types'

/** Status colors for band chips and the gauge — always shown with a text label. */
export const BAND_COLORS: Record<BandId, { bg: string; fg: string; emoji: string }> = {
  perfect: { bg: '#0e7490', fg: '#ffffff', emoji: '🤿' },
  great: { bg: '#1ba7c4', fg: '#ffffff', emoji: '🏊' },
  fair: { bg: '#ffc531', fg: '#0b3b5c', emoji: '🌤️' },
  poor: { bg: '#ff7a6e', fg: '#0b3b5c', emoji: '🧴' },
  bad: { bg: '#e6484d', fg: '#ffffff', emoji: '⛔' },
  night: { bg: '#33607f', fg: '#ffffff', emoji: '🌙' },
}

/**
 * Sequential sea-hue ramp for the hourly chart (magnitude: light → dark).
 * Bar height is the primary encoding; color is redundant support.
 */
export function rampColor(score: number): string {
  if (score >= 80) return '#0e7490'
  if (score >= 60) return '#1ba7c4'
  if (score >= 40) return '#55c8de'
  if (score >= 20) return '#99e3f0'
  return '#cff3f9'
}
