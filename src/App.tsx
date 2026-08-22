import { useCallback, useEffect, useMemo, useState } from 'react'
import { I18nContext, detectLang, getSavedLang, saveLang, translate } from './lib/i18n'
import type { Lang, Place } from './lib/types'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Marquee } from './components/Marquee'
import { Dashboard } from './components/Dashboard'
import { Faq } from './components/Faq'
import { Footer } from './components/Footer'
import { WaveDivider } from './components/WaveDivider'

const PLACE_KEY = 'beach-umbrella.place'

function loadSavedPlace(): Place | null {
  try {
    const raw = localStorage.getItem(PLACE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Place
    if (typeof p?.lat === 'number' && typeof p?.lon === 'number' && p?.name) return p
    return null
  } catch {
    return null
  }
}

export default function App() {
  const [lang, setLangState] = useState<Lang>(
    () => getSavedLang() ?? (navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en'),
  )
  const [place, setPlaceState] = useState<Place | null>(loadSavedPlace)

  // Country-based language: Italian in Italy, English elsewhere (saved choice wins).
  useEffect(() => {
    let cancelled = false
    detectLang().then((detected) => {
      if (!cancelled && !getSavedLang()) setLangState(detected)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    saveLang(l)
  }, [])

  const setPlace = useCallback((p: Place | null) => {
    setPlaceState(p)
    try {
      if (p) localStorage.setItem(PLACE_KEY, JSON.stringify(p))
      else localStorage.removeItem(PLACE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const i18n = useMemo(
    () => ({
      lang,
      t: (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
      setLang,
    }),
    [lang, setLang],
  )

  return (
    <I18nContext.Provider value={i18n}>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">
          <Hero place={place} onSelect={setPlace} />
          <Marquee />
          {place && <Dashboard key={place.id} place={place} onSelectPlace={setPlace} />}
          <WaveDivider />
          <Faq />
        </main>
        <Footer />
      </div>
    </I18nContext.Provider>
  )
}
