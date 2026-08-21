import { useI18n } from '../lib/i18n'
import type { Lang } from '../lib/types'

const LANGS: Lang[] = ['it', 'en']

export function Header() {
  const { lang, setLang, t } = useI18n()

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
      <a href="#top" className="flex items-center gap-3">
        <img
          src={`${import.meta.env.BASE_URL}logo.svg`}
          alt={t('a11y.logo')}
          className="animate-sway h-12 w-12 sm:h-14 sm:w-14"
        />
        {/* App title: always English, in both languages */}
        <span className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Beach<span className="text-coral-500"> Umbrella</span>
        </span>
      </a>

      <div
        className="chip flex overflow-hidden bg-white p-1"
        role="group"
        aria-label={t('lang.label')}
      >
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            className={`cursor-pointer rounded-full px-3 py-1 font-display text-sm font-bold uppercase transition-colors ${
              lang === l ? 'bg-ink text-sun-300' : 'text-ink hover:bg-sand-100'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </header>
  )
}
