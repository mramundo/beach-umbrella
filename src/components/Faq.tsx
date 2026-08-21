import { useI18n } from '../lib/i18n'

const ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

/** FAQ — how the Dip Index works, data sources, PWA install, privacy. */
export function Faq() {
  const { t } = useI18n()

  return (
    <section id="faq" className="bg-sea-400 pt-4 pb-14">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-extrabold text-white drop-shadow-[2px_2px_0_var(--color-ink)] sm:text-4xl">
          {t('faq.title')}
        </h2>
        <p className="mt-1 text-lg font-bold text-sea-50">{t('faq.subtitle')}</p>

        <div className="mt-6 flex flex-col gap-3">
          {ITEMS.map((n) => (
            <details key={n} className="card group rounded-2xl open:bg-sand-50">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-display text-lg font-bold select-none [&::-webkit-details-marker]:hidden">
                {t(`faq.q${n}`)}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl transition-transform group-open:rotate-45"
                >
                  ＋
                </span>
              </summary>
              <div className="px-5 pb-5 font-semibold whitespace-pre-line text-ink-soft">
                {t(`faq.a${n}`)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
