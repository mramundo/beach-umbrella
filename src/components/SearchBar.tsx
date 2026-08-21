import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { flagEmoji, locateMe, searchPlaces } from '../lib/geo'
import type { Place } from '../lib/types'

interface Props {
  onSelect: (place: Place) => void
}

export function SearchBar({ onSelect }: Props) {
  const { lang, t } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const boxRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setBusy(true)
      try {
        const found = await searchPlaces(q, lang, controller.signal)
        setResults(found)
        setOpen(true)
        setHighlight(found.length > 0 ? 0 : -1)
      } catch {
        if (!controller.signal.aborted) {
          setResults([])
          setOpen(true)
        }
      } finally {
        if (!controller.signal.aborted) setBusy(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, lang])

  // Close on outside click
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const pick = (place: Place) => {
    onSelect(place)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault()
      pick(results[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const locate = async () => {
    setLocating(true)
    setGeoError(false)
    try {
      const place = await locateMe(lang, t('search.yourLocation'))
      pick(place)
    } catch {
      setGeoError(true)
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div ref={boxRef} className="relative flex-1">
          <div className="card flex items-center gap-2 rounded-full px-4 py-3">
            <span aria-hidden="true" className="text-xl">🔍</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder={t('search.placeholder')}
              aria-label={t('search.placeholder')}
              aria-expanded={open}
              role="combobox"
              aria-controls="search-results"
              className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-ink-soft/70"
            />
          </div>

          {open && (
            <ul
              id="search-results"
              role="listbox"
              className="card absolute top-full right-0 left-0 z-30 mt-2 max-h-80 overflow-auto rounded-2xl p-1.5"
            >
              {busy && (
                <li className="px-4 py-3 font-semibold text-ink-soft">{t('search.searching')}</li>
              )}
              {!busy && results.length === 0 && (
                <li className="px-4 py-3 font-semibold text-ink-soft">{t('search.noResults')}</li>
              )}
              {!busy &&
                results.map((r, i) => (
                  <li key={r.id} role="option" aria-selected={i === highlight}>
                    <button
                      type="button"
                      onClick={() => pick(r)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`flex w-full cursor-pointer items-baseline gap-2 rounded-xl px-4 py-2.5 text-left ${
                        i === highlight ? 'bg-sea-100' : ''
                      }`}
                    >
                      <span className="font-bold">
                        {flagEmoji(r.countryCode)} {r.name}
                      </span>
                      <span className="truncate text-sm font-semibold text-ink-soft">
                        {[r.admin, r.country].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="btn-pop flex items-center justify-center gap-2 bg-sun-400 px-5 py-3 text-base disabled:opacity-70"
        >
          <span aria-hidden="true" className="text-xl">📍</span>
          {locating ? t('search.locating') : t('search.useLocation')}
        </button>
      </div>

      {geoError && (
        <p role="alert" className="chip self-start bg-coral-100 px-4 py-2 text-sm">
          {t('search.geoError')}
        </p>
      )}
    </div>
  )
}
