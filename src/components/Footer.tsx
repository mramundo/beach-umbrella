import type { JSX } from 'react'
import { useI18n } from '../lib/i18n'

export function Footer() {
  const { t } = useI18n()
  const openmeteo = (
    <a
      key="om"
      href="https://open-meteo.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-2 underline-offset-2 hover:text-sun-300"
    >
      Open-Meteo
    </a>
  )
  const osm = (
    <a
      key="osm"
      href="https://www.openstreetmap.org/copyright"
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-2 underline-offset-2 hover:text-sun-300"
    >
      OpenStreetMap
    </a>
  )

  // Split "footer.data" around its {openmeteo}/{osm} placeholders to keep links localized.
  const template = t('footer.data')
  const parts: Array<string | JSX.Element> = []
  template.split(/(\{openmeteo\}|\{osm\})/).forEach((chunk) => {
    if (chunk === '{openmeteo}') parts.push(openmeteo)
    else if (chunk === '{osm}') parts.push(osm)
    else if (chunk) parts.push(chunk)
  })

  return (
    <footer className="bg-ink py-8 text-center text-sand-100">
      <div className="mx-auto max-w-4xl space-y-2 px-4 sm:px-6">
        <p className="font-display text-xl font-bold">
          ⛱️ Beach Umbrella
        </p>
        <p className="font-semibold">{t('footer.made')}</p>
        <p className="text-sm font-semibold text-sand-100/80">{parts}</p>
        <p className="text-xs font-semibold text-sand-100/60">{t('footer.disclaimer')}</p>
      </div>
    </footer>
  )
}
