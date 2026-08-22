import type { Lang } from './types'

/** "2026-08-21T14:00" → "14:00" */
export function hourLabel(isoLocal: string): string {
  return isoLocal.slice(11, 16)
}

/** "2026-08-21T14:00" → 14 */
export function hourOf(isoLocal: string): number {
  return Number(isoLocal.slice(11, 13))
}

/** "2026-08-21T14:00" → "2026-08-21" */
export function dateOf(isoLocal: string): string {
  return isoLocal.slice(0, 10)
}

/** Current date+time in a given IANA timezone, as local ISO "YYYY-MM-DDTHH:mm". */
export function nowInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  // en-CA + hour12:false can yield "24" at midnight
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`
}

/** Live clock string for a timezone, localized. */
export function clockIn(timezone: string, lang: Lang, withSeconds = true): string {
  return new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false,
  }).format(new Date())
}

/** Localized date string for a timezone, e.g. "giovedì 21 agosto". */
export function dateStringIn(timezone: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

/** Short weekday + day label for a "YYYY-MM-DD" date. */
export function dayTabLabel(date: string, lang: Lang): string {
  const d = new Date(`${date}T12:00:00`)
  return new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatKm(km: number, lang: Lang): string {
  const locale = lang === 'it' ? 'it-IT' : 'en-GB'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(km)} km`
}

export function round1(v: number): string {
  return (Math.round(v * 10) / 10).toString()
}

/** WMO weather code → a friendly emoji for the day tabs. */
export function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code === 1) return '🌤️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 57) return '🌦️'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌤️'
}
