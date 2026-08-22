import { useI18n } from '../lib/i18n'
import { QUICK_PICKS, flagEmoji } from '../lib/geo'
import type { Place } from '../lib/types'
import { SearchBar } from './SearchBar'

interface Props {
  place: Place | null
  onSelect: (place: Place) => void
}

const PICK_COLORS = ['bg-white', 'bg-sun-300', 'bg-sea-100', 'bg-coral-100']
const PICK_TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2']

export function Hero({ place, onSelect }: Props) {
  const { t } = useI18n()
  const expanded = place == null

  return (
    <section id="top" className="relative w-full overflow-x-clip">
      {/* Floating summer scenery (decorative) */}
      {expanded && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <SunBurst className="absolute -top-16 -right-14 h-44 w-44 sm:-top-14 sm:-right-4 sm:h-80 sm:w-80" />
          <Cloud className="animate-cloud absolute top-16 -left-56 w-36 opacity-90" />
          <Cloud className="animate-cloud-slow absolute top-44 -left-56 w-24 opacity-70" />
          <BeachBall className="animate-float-slow absolute bottom-24 left-3 h-14 w-14 sm:left-10 sm:h-20 sm:w-20" />
          <span className="animate-float absolute right-4 bottom-16 hidden text-5xl sm:block" style={{ animationDelay: '-2s' }}>
            🦩
          </span>
        </div>
      )}

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className={`flex flex-col items-center text-center ${expanded ? 'pt-10 pb-6 sm:pt-14' : 'pt-6 pb-2'}`}>
          {expanded && (
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt=""
              aria-hidden="true"
              className="animate-float mb-5 h-36 w-36 drop-shadow-[6px_8px_0_rgba(11,59,92,0.15)] sm:h-48 sm:w-48"
            />
          )}

          {/* Tagline with highlighted "sea" and "sun" words (plain when compact) */}
          {expanded ? (
            <h1 className="animate-rise font-display text-[2.6rem] leading-[1.05] font-extrabold tracking-tight text-balance sm:text-7xl">
              {t('app.tagline.pre')}{' '}
              <span className="relative inline-block text-sea-500">
                {t('app.tagline.sea')}
                <WaveUnderline className="absolute -bottom-1 left-0 w-full text-sea-300" />
              </span>
              {t('app.tagline.mid')}{' '}
              <span className="relative inline-block -rotate-2 rounded-xl border-[3px] border-ink bg-sun-300 px-2 shadow-[4px_4px_0_0_var(--color-ink)]">
                {t('app.tagline.sun')}
              </span>
              <span className="ml-1.5">?</span>
            </h1>
          ) : (
            <h1 className="animate-rise font-display text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              {t('app.tagline.pre')} <span className="text-sea-500">{t('app.tagline.sea')}</span>
              {t('app.tagline.mid')} <span className="text-coral-500">{t('app.tagline.sun')}</span>?
            </h1>
          )}

          <p
            className={`animate-rise mt-4 max-w-2xl font-bold text-balance text-ink-soft ${
              expanded ? 'text-lg sm:text-2xl' : 'text-base'
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

        <div className="mx-auto max-w-3xl pb-6">
          <SearchBar onSelect={onSelect} />

          {expanded && (
            <div className="mt-10 text-center">
              <p className="font-display text-xl font-extrabold">{t('search.quickPicks')}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {QUICK_PICKS.map((qp, i) => (
                  <button
                    key={qp.id}
                    type="button"
                    onClick={() => onSelect(qp)}
                    className={`btn-pop hover-wiggle px-4 py-2 text-base ${PICK_COLORS[i % PICK_COLORS.length]} ${PICK_TILTS[i % PICK_TILTS.length]}`}
                  >
                    {flagEmoji(qp.countryCode)} {qp.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** Big sun with slowly rotating rays. */
function SunBurst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className}>
      <g className="animate-spin-slow" style={{ transformOrigin: '100px 100px' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x="96"
            y="14"
            width="8"
            height="34"
            rx="4"
            fill="var(--color-sun-400)"
            stroke="var(--color-ink)"
            strokeWidth="3.5"
            transform={`rotate(${i * 30} 100 100)`}
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="44" fill="var(--color-sun-400)" stroke="var(--color-ink)" strokeWidth="5" />
      <circle cx="86" cy="92" r="5" fill="var(--color-ink)" />
      <circle cx="114" cy="92" r="5" fill="var(--color-ink)" />
      <path d="M84 110 Q 100 124 116 110" fill="none" stroke="var(--color-ink)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className}>
      <path
        d="M20 48 A 16 16 0 0 1 26 18 A 20 20 0 0 1 64 12 A 16 16 0 0 1 96 22 A 14 14 0 0 1 98 48 Z"
        fill="#fff"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BeachBall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r="28" fill="#fff" stroke="var(--color-ink)" strokeWidth="4" />
      <path d="M32 4 A 28 28 0 0 1 32 60 A 44 44 0 0 0 32 4" fill="var(--color-coral-500)" />
      <path d="M32 4 A 28 28 0 0 0 32 60 A 44 44 0 0 1 32 4" fill="var(--color-sea-400)" />
      <path d="M32 4 A 28 28 0 0 1 57 18 A 58 58 0 0 0 32 12 A 58 58 0 0 0 7 18 A 28 28 0 0 1 32 4" fill="var(--color-sun-400)" />
      <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-ink)" strokeWidth="4" />
    </svg>
  )
}

function WaveUnderline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M2 7 Q 17 1 32 7 T 62 7 T 92 7 T 118 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}
