import { useI18n } from '../lib/i18n'

/** Tilted coral ticker strip — pure summer energy between sections. */
export function Marquee() {
  const { t } = useI18n()
  const text = t('marquee')

  return (
    // The strip is tilted and pulled past the edges, so it must be clipped:
    // otherwise it widens the page and the browser shows a horizontal scrollbar.
    <div className="overflow-x-clip">
      <div
        aria-hidden="true"
        className="relative z-10 -mx-2 -rotate-1 overflow-hidden border-y-4 border-ink bg-coral-500 py-2.5 shadow-[0_5px_0_0_var(--color-ink)]"
      >
        <div className="marquee-track flex w-max whitespace-nowrap">
          {[0, 1].map((copy) => (
            <span
              key={copy}
              className="px-4 font-display text-lg font-extrabold tracking-wide text-white"
            >
              {`${text} · ${text} · ${text} · `}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
