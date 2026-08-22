import { useI18n } from '../lib/i18n'

const ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
const NUM_COLORS = ['bg-sun-300', 'bg-coral-100', 'bg-sea-100']

/** FAQ — how the Dip Index works, data sources, PWA install, privacy. */
export function Faq() {
  const { t } = useI18n()

  return (
    <section id="faq" className="bg-sea-400 pt-6 pb-16">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <h2 className="font-display text-4xl font-extrabold text-white drop-shadow-[3px_3px_0_var(--color-ink)] sm:text-5xl">
          ⛱️ {t('faq.title')}
        </h2>
        <p className="mt-2 text-lg font-bold text-sea-50">{t('faq.subtitle')}</p>

        <div className="mt-7 flex flex-col gap-4">
          {ITEMS.map((n, i) => (
            <details
              key={n}
              className={`card group rounded-2xl open:bg-sand-50 ${i % 2 === 0 ? 'rotate-[0.35deg]' : '-rotate-[0.35deg]'}`}
            >
              <summary className="flex cursor-pointer items-center gap-4 px-4 py-4 font-display text-lg font-bold select-none sm:px-5 [&::-webkit-details-marker]:hidden">
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[3px] border-ink text-sm shadow-[2.5px_2.5px_0_0_var(--color-ink)] ${NUM_COLORS[i % NUM_COLORS.length]} ${i % 2 === 0 ? '-rotate-3' : 'rotate-3'}`}
                >
                  {String(n).padStart(2, '0')}
                </span>
                <span className="flex-1">{t(`faq.q${n}`)}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl transition-transform group-open:rotate-45"
                >
                  ＋
                </span>
              </summary>
              <div className="px-5 pb-5 font-semibold whitespace-pre-line text-ink-soft sm:px-[4.6rem]">
                {t(`faq.a${n}`)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
