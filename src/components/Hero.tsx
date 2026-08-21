import { useI18n } from '../lib/i18n'
import { QUICK_PICKS, flagEmoji } from '../lib/geo'
import type { Place } from '../lib/types'
import { SearchBar } from './SearchBar'

interface Props {
  place: Place | null
  onSelect: (place: Place) => void
}

export function Hero({ place, onSelect }: Props) {
  const { t } = useI18n()
  const expanded = place == null

  return (
    <section id="top" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className={`flex flex-col items-center text-center ${expanded ? 'pt-10 pb-6 sm:pt-16' : 'pt-6 pb-2'}`}>
        {expanded && (
          <div className="animate-rise relative mb-6">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt=""
              aria-hidden="true"
              className="animate-float h-36 w-36 sm:h-44 sm:w-44"
            />
          </div>
        )}

        <h1
          className={`animate-rise font-display font-extrabold tracking-tight text-balance ${
            expanded ? 'text-4xl sm:text-6xl' : 'text-2xl sm:text-3xl'
          }`}
        >
          {t('app.tagline')}
        </h1>
        <p
          className={`animate-rise mt-3 max-w-2xl font-semibold text-balance text-ink-soft ${
            expanded ? 'text-lg sm:text-xl' : 'text-base'
          }`}
        >
          {t('app.subtitle')}
        </p>
        {expanded && (
          <p className="animate-rise mt-2 max-w-2xl text-base font-semibold text-balance text-ink-soft/80">
            {t('app.description')}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-3xl pb-4">
        <SearchBar onSelect={onSelect} />

        {expanded && (
          <div className="mt-8 text-center">
            <p className="font-display text-lg font-bold">{t('search.quickPicks')}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2.5">
              {QUICK_PICKS.map((qp) => (
                <button
                  key={qp.id}
                  type="button"
                  onClick={() => onSelect(qp)}
                  className="btn-pop bg-white px-4 py-2 text-sm"
                >
                  {flagEmoji(qp.countryCode)} {qp.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
