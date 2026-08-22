import { createContext, useContext } from 'react'
import type { Lang } from './types'

const STORAGE_KEY = 'beach-umbrella.lang'

type Dict = Record<string, string>

const en: Dict = {
  'app.tagline': 'Love the sea, not the sun?',
  'app.tagline.pre': 'Love the',
  'app.tagline.sea': 'sea',
  'app.tagline.mid': ', not the',
  'app.tagline.sun': 'sun',
  'marquee': '☀️ Less UV · 🌊 Calm sea · ⛱️ Zero sunburn · 🏖️ Happy dips · 🕶️ Golden hour swims',
  'app.subtitle':
    'Beach Umbrella finds the best low-sun time windows for your swim — anywhere with water.',
  'app.description':
    'Pick a place (or use your location): we cross-check sun, sea and weather data and give you a simple 0–100 Dip Index for every hour of the day.',

  'lang.label': 'Language',

  'search.placeholder': 'Search a seaside town, a lake, anywhere…',
  'search.noResults': 'No places found. Try a different name.',
  'search.searching': 'Searching…',
  'search.useLocation': 'Use my location',
  'search.locating': 'Locating you…',
  'search.geoError': 'Could not get your position. Please allow location access or search by name.',
  'search.quickPicks': 'No ideas? Dive into one of these:',
  'search.yourLocation': 'Your location',

  'place.localTime': 'Local time',
  'place.timezone': 'Time zone',

  'now.title': 'Dip Index now',
  'now.updated': 'Based on the latest forecast for this hour',
  'now.night':
    'The sun is down — the index is on pause. Check tomorrow’s best swim windows below.',

  'band.perfect': 'Perfect dip',
  'band.great': 'Great time',
  'band.fair': 'Decent',
  'band.poor': 'Not ideal',
  'band.bad': 'Avoid',
  'band.night': 'After dark',

  'stat.air': 'Air',
  'stat.water': 'Water',
  'stat.uv': 'UV index',
  'stat.waves': 'Waves',
  'stat.wind': 'Wind',
  'stat.rain': 'Rain chance',
  'stat.estimated': 'no sea data nearby — estimated',

  'windows.title': 'Best swim windows',
  'windows.subtitle': 'Low sun, warm water, calm sea — these are your moments.',
  'windows.none':
    'No good windows on this day. The weather (or the sun) says no — try another day.',
  'windows.avg': 'avg. index',

  'chart.title': 'Hour by hour',
  'chart.subtitle': 'The Dip Index across the day — taller and darker is better.',
  'chart.legend': '0 = avoid · 100 = perfect dip',
  'chart.now': 'now',
  'chart.table': 'Show as table',
  'chart.chart': 'Show as chart',
  'chart.colHour': 'Hour',
  'chart.colIndex': 'Index',

  'day.today': 'Today',
  'day.tomorrow': 'Tomorrow',

  'spots.title': 'Where to swim nearby',
  'spots.subtitle':
    'Beaches, coves, pools, lakes and other swimmable places around {place}, from OpenStreetMap.',
  'spots.loading': 'Scanning the map for swimmable water…',
  'spots.empty': 'No swimmable spots found within {km} km.',
  'spots.error':
    'The OpenStreetMap servers are busy right now and did not answer. Please try again in a minute.',
  'spots.partial': 'Some map sources did not answer — the list may be incomplete.',
  'spots.refining': 'Quick results — completing the list…',
  'spots.expand': 'Search wider ({km} km)',
  'spots.showMore': 'Show more spots',
  'spots.checkHere': 'Conditions here',
  'spots.map': 'Map',
  'spots.away': 'away',
  'spots.all': 'All',
  'spots.radiusNote': 'Showing spots within {km} km',
  'spots.unnamed.beach': 'Unnamed beach',
  'spots.unnamed.cove': 'Unnamed cove',
  'spots.unnamed.generic': 'Unnamed spot',

  'cat.beach': 'Beach',
  'cat.cove': 'Cove',
  'cat.swim_area': 'Swimming area',
  'cat.beach_resort': 'Beach resort',
  'cat.pool': 'Pool',
  'cat.water_park': 'Water park',
  'cat.lake': 'Lake',
  'cat.lagoon': 'Lagoon',
  'cat.quarry': 'Quarry lake',

  'faq.title': 'FAQ',
  'faq.subtitle': 'How Beach Umbrella works, in plain words.',

  'faq.q1': 'What is the Dip Index?',
  'faq.a1':
    'The Dip Index is a 0–100 score that tells you how good a given hour is for a swim — if you love the water but not the sun. 100 means gentle sun, pleasant air, warm water and a calm sea; 0 means stay away (scorching UV, storms, cold or rough water). Anything above 60 is a good moment for a dip.',

  'faq.q2': 'How is the Dip Index calculated?',
  'faq.a2':
    'For every daylight hour we combine six ingredients, each scored 0–100 and weighted:\n• Gentle sun (UV index) — 35%. The heart of the app: low UV scores high, UV above ~7 drops to zero.\n• Rain risk — 15%. Probability and amount of precipitation.\n• Air comfort — 15%. Ideal between 24 and 31 °C.\n• Water temperature — 15%. Sea surface temperature; 24 °C and above is ideal.\n• Calm sea — 12%. Wave height; a flat sea scores best.\n• Light wind — 8%. Breezes are fine, strong wind is not.\nTwo ceilings then apply on top: thunderstorms force the score to almost zero regardless of the rest, and the UV index caps it on the WHO scale, so a punishing sun can never be sold as a good swim however perfect the sea is. Moderate UV (3–5) tops out at 79, so it is never a “perfect dip”; high UV (6–7) tops out at 59, at best “decent”; very high (8–10) at 39; extreme (11+) at 19. Hours after sunset are not scored. “Best swim windows” are the contiguous daylight hours with the highest index.',

  'faq.q3': 'Where does the data come from?',
  'faq.a3':
    'Everything comes from free and open sources: weather, UV and marine forecasts (waves, sea temperature) from Open-Meteo; place search from the Open-Meteo geocoding service; swimmable places from OpenStreetMap, read through Photon (a fast search index, used to fill the list in about a second) and the Overpass API (slower but complete, and the only one that can check access and no-swimming tags); reverse geocoding from BigDataCloud. No paid API is used, and no API key is required.',

  'faq.q4': 'Why does it usually suggest early morning or late afternoon?',
  'faq.a4':
    'UV radiation peaks when the sun is highest, roughly between 11:00 and 16:00 in summer. In the early morning and from late afternoon until sunset the UV index drops quickly while air and water are still warm — the sweet spot for people who burn easily or simply dislike baking on a towel.',

  'faq.q5': 'Are the suggested spots always legal and safe for swimming?',
  'faq.a5':
    'The spots come from OpenStreetMap, a community-maintained map, and we filter out places explicitly marked as no-swimming or private. Still, rules change: harbours, protected areas, reservoirs and some lakes may restrict bathing, and water quality varies. Always check local signage, flags and official water-quality reports (in Italy, your regional ARPA) before diving in. Never swim alone at night.',

  'faq.q6': 'What if I pick a lake or an inland place?',
  'faq.a6':
    'Marine forecasts (waves and sea temperature) only exist for seas and oceans. For lakes and inland spots the index still works using sun, air, wind and rain; water temperature is treated as “unknown but plausible” and clearly marked as estimated.',

  'faq.q7': 'Can I install Beach Umbrella as an app?',
  'faq.a7':
    'Yes — it is a Progressive Web App. On your phone, open the browser menu and choose “Add to Home Screen” (iOS Safari) or “Install app” (Android Chrome). On desktop, look for the install icon in the address bar. Once installed it launches full-screen and the last forecasts you loaded remain available even with a flaky connection.',

  'faq.q8': 'What about my privacy?',
  'faq.a8':
    'Your position is used only inside your browser to query the weather and places services; it is never stored on a server, and there are no accounts, cookies or trackers. The only things saved on your device are your language choice and cached forecasts.',

  'faq.q9': 'Why is the interface in Italian / English?',
  'faq.a9':
    'Beach Umbrella detects the country you are browsing from: in Italy it speaks Italian, everywhere else English. You can always switch manually with the IT/EN toggle in the header — your choice is remembered.',

  'footer.data': 'Weather data by {openmeteo} · Places © {osm} contributors',
  'footer.made': 'Made for people who love the sea, not the sunburn.',
  'footer.disclaimer':
    'Forecasts and community map data can be wrong: always check conditions, flags and local rules on site.',

  'error.weather': 'Could not load the forecast. Check your connection and try again.',
  'error.retry': 'Retry',
  'loading.weather': 'Reading sun, sea and sky…',

  'a11y.selectDay': 'Select day',
  'a11y.close': 'Close',
  'a11y.logo': 'Beach Umbrella logo: a beach umbrella with a sun lounger',
}

const it: Dict = {
  'app.tagline': 'Ami il mare, ma non il sole?',
  'app.tagline.pre': 'Ami il',
  'app.tagline.sea': 'mare',
  'app.tagline.mid': ', ma non il',
  'app.tagline.sun': 'sole',
  'marquee': '☀️ Meno UV · 🌊 Mare calmo · ⛱️ Zero scottature · 🏖️ Bagni felici · 🕶️ Tuffi alla golden hour',
  'app.subtitle':
    'Beach Umbrella trova le fasce orarie con poco sole per il tuo bagno — ovunque ci sia acqua.',
  'app.description':
    'Scegli una località (o usa la tua posizione): incrociamo dati su sole, mare e meteo e ti diamo un semplice Dip Index da 0 a 100 per ogni ora del giorno.',

  'lang.label': 'Lingua',

  'search.placeholder': 'Cerca una località di mare, un lago, ovunque…',
  'search.noResults': 'Nessuna località trovata. Prova con un altro nome.',
  'search.searching': 'Ricerca in corso…',
  'search.useLocation': 'Usa la mia posizione',
  'search.locating': 'Ti sto localizzando…',
  'search.geoError':
    'Impossibile ottenere la posizione. Consenti l’accesso alla posizione o cerca per nome.',
  'search.quickPicks': 'Nessuna idea? Tuffati in una di queste:',
  'search.yourLocation': 'La tua posizione',

  'place.localTime': 'Ora locale',
  'place.timezone': 'Fuso orario',

  'now.title': 'Dip Index adesso',
  'now.updated': 'Basato sulle previsioni più recenti per quest’ora',
  'now.night':
    'Il sole è tramontato — l’indice è in pausa. Guarda qui sotto le fasce migliori di domani.',

  'band.perfect': 'Bagno perfetto',
  'band.great': 'Ottimo momento',
  'band.fair': 'Discreto',
  'band.poor': 'Poco adatto',
  'band.bad': 'Da evitare',
  'band.night': 'Dopo il tramonto',

  'stat.air': 'Aria',
  'stat.water': 'Acqua',
  'stat.uv': 'Indice UV',
  'stat.waves': 'Onde',
  'stat.wind': 'Vento',
  'stat.rain': 'Prob. pioggia',
  'stat.estimated': 'niente dati marini vicino — stimata',

  'windows.title': 'Le fasce migliori per il bagno',
  'windows.subtitle': 'Poco sole, acqua calda, mare calmo — questi sono i tuoi momenti.',
  'windows.none':
    'Nessuna fascia buona in questo giorno. Il meteo (o il sole) dice di no — prova un altro giorno.',
  'windows.avg': 'indice medio',

  'chart.title': 'Ora per ora',
  'chart.subtitle': 'Il Dip Index lungo la giornata — più alto e più scuro è meglio.',
  'chart.legend': '0 = da evitare · 100 = bagno perfetto',
  'chart.now': 'adesso',
  'chart.table': 'Mostra come tabella',
  'chart.chart': 'Mostra come grafico',
  'chart.colHour': 'Ora',
  'chart.colIndex': 'Indice',

  'day.today': 'Oggi',
  'day.tomorrow': 'Domani',

  'spots.title': 'Dove fare il bagno nei dintorni',
  'spots.subtitle':
    'Spiagge, calette, piscine, laghi e altri luoghi balneabili attorno a {place}, da OpenStreetMap.',
  'spots.loading': 'Cerco acqua balneabile sulla mappa…',
  'spots.empty': 'Nessun luogo balneabile trovato entro {km} km.',
  'spots.error':
    'I server di OpenStreetMap sono occupati e non hanno risposto. Riprova tra un minuto.',
  'spots.partial': 'Alcune fonti della mappa non hanno risposto — l’elenco potrebbe essere incompleto.',
  'spots.refining': 'Risultati rapidi — sto completando l’elenco…',
  'spots.expand': 'Allarga la ricerca ({km} km)',
  'spots.showMore': 'Mostra altri luoghi',
  'spots.checkHere': 'Condizioni qui',
  'spots.map': 'Mappa',
  'spots.away': 'di distanza',
  'spots.all': 'Tutti',
  'spots.radiusNote': 'Luoghi entro {km} km',
  'spots.unnamed.beach': 'Spiaggia senza nome',
  'spots.unnamed.cove': 'Caletta senza nome',
  'spots.unnamed.generic': 'Luogo senza nome',

  'cat.beach': 'Spiaggia',
  'cat.cove': 'Caletta',
  'cat.swim_area': 'Area di balneazione',
  'cat.beach_resort': 'Stabilimento balneare',
  'cat.pool': 'Piscina',
  'cat.water_park': 'Parco acquatico',
  'cat.lake': 'Lago',
  'cat.lagoon': 'Laguna',
  'cat.quarry': 'Cava allagata',

  'faq.title': 'FAQ',
  'faq.subtitle': 'Come funziona Beach Umbrella, spiegato semplice.',

  'faq.q1': 'Che cos’è il Dip Index?',
  'faq.a1':
    'Il Dip Index è un punteggio da 0 a 100 che ti dice quanto è buona una certa ora per fare il bagno — se ami l’acqua ma non il sole. 100 significa sole gentile, aria piacevole, acqua calda e mare calmo; 0 significa meglio lasciar perdere (UV altissimo, temporali, acqua fredda o mare mosso). Sopra 60 è un buon momento per un tuffo.',

  'faq.q2': 'Come viene calcolato il Dip Index?',
  'faq.a2':
    'Per ogni ora di luce combiniamo sei ingredienti, ognuno con un punteggio 0–100 e un peso:\n• Sole gentile (indice UV) — 35%. Il cuore dell’app: UV basso vale tanto, sopra ~7 il punteggio crolla a zero.\n• Rischio pioggia — 15%. Probabilità e quantità di precipitazioni.\n• Comfort dell’aria — 15%. Ideale tra 24 e 31 °C.\n• Temperatura dell’acqua — 15%. Temperatura superficiale del mare; da 24 °C in su è l’ideale.\n• Mare calmo — 12%. Altezza delle onde; mare piatto = punteggio massimo.\n• Vento leggero — 8%. La brezza va bene, il vento forte no.\nSopra a tutto agiscono due tetti: i temporali portano il punteggio quasi a zero a prescindere dal resto, e l’indice UV lo limita secondo la scala dell’OMS, così un sole punitivo non può mai risultare un buon bagno per quanto perfetto sia il mare. Con UV moderato (3–5) il massimo è 79, quindi mai “bagno perfetto”; con UV alto (6–7) il massimo è 59, al più “discreto”; molto alto (8–10) 39; estremo (11+) 19. Le ore dopo il tramonto non vengono valutate. Le “fasce migliori” sono le ore di luce consecutive con l’indice più alto.',

  'faq.q3': 'Da dove arrivano i dati?',
  'faq.a3':
    'Tutto arriva da fonti gratuite e aperte: previsioni meteo, UV e marine (onde, temperatura del mare) da Open-Meteo; la ricerca delle località dal servizio di geocoding di Open-Meteo; i luoghi balneabili da OpenStreetMap, letti tramite Photon (un indice di ricerca veloce, che riempie l’elenco in circa un secondo) e le API Overpass (più lente ma complete, e le uniche che possono verificare i tag di accesso e divieto di balneazione); il reverse geocoding da BigDataCloud. Nessuna API a pagamento e nessuna chiave richiesta.',

  'faq.q4': 'Perché suggerisce quasi sempre mattina presto o tardo pomeriggio?',
  'faq.a4':
    'I raggi UV sono al massimo quando il sole è alto, in estate all’incirca tra le 11:00 e le 16:00. Al mattino presto e dal tardo pomeriggio fino al tramonto l’indice UV cala rapidamente mentre aria e acqua restano calde — il momento perfetto per chi si scotta facilmente o semplicemente non ama arrostire sull’asciugamano.',

  'faq.q5': 'I luoghi suggeriti sono sempre balneabili, legali e sicuri?',
  'faq.a5':
    'I luoghi arrivano da OpenStreetMap, una mappa mantenuta dalla community, e filtriamo quelli segnati esplicitamente come vietati alla balneazione o privati. Le regole però cambiano: porti, aree protette, invasi e alcuni laghi possono vietare il bagno, e la qualità dell’acqua varia. Controlla sempre cartelli, bandiere e i bollettini ufficiali sulla qualità delle acque (in Italia, l’ARPA della tua regione) prima di tuffarti. Mai bagni notturni in solitaria.',

  'faq.q6': 'E se scelgo un lago o una località nell’entroterra?',
  'faq.a6':
    'Le previsioni marine (onde e temperatura del mare) esistono solo per mari e oceani. Per laghi e luoghi interni l’indice funziona comunque usando sole, aria, vento e pioggia; la temperatura dell’acqua viene considerata “sconosciuta ma plausibile” e indicata chiaramente come stimata.',

  'faq.q7': 'Posso installare Beach Umbrella come app?',
  'faq.a7':
    'Sì — è una Progressive Web App. Sul telefono apri il menu del browser e scegli “Aggiungi a schermata Home” (Safari su iOS) o “Installa app” (Chrome su Android). Su desktop cerca l’icona di installazione nella barra degli indirizzi. Una volta installata si apre a schermo intero e le ultime previsioni caricate restano disponibili anche con una connessione ballerina.',

  'faq.q8': 'E la mia privacy?',
  'faq.a8':
    'La tua posizione viene usata solo dentro il tuo browser per interrogare i servizi meteo e delle località; non viene mai salvata su un server e non ci sono account, cookie o tracker. Sul tuo dispositivo restano solo la lingua scelta e le previsioni in cache.',

  'faq.q9': 'Perché l’interfaccia è in italiano / inglese?',
  'faq.a9':
    'Beach Umbrella riconosce il Paese da cui navighi: in Italia parla italiano, altrove inglese. Puoi sempre cambiare manualmente con l’interruttore IT/EN nell’intestazione — la scelta viene ricordata.',

  'footer.data': 'Dati meteo di {openmeteo} · Luoghi © contributor di {osm}',
  'footer.made': 'Fatta per chi ama il mare, non le scottature.',
  'footer.disclaimer':
    'Previsioni e dati della community possono sbagliare: verifica sempre condizioni, bandiere e regole locali sul posto.',

  'error.weather': 'Impossibile caricare le previsioni. Controlla la connessione e riprova.',
  'error.retry': 'Riprova',
  'loading.weather': 'Leggo sole, mare e cielo…',

  'a11y.selectDay': 'Seleziona il giorno',
  'a11y.close': 'Chiudi',
  'a11y.logo': 'Logo Beach Umbrella: un ombrellone con un lettino da mare',
}

const dicts: Record<Lang, Dict> = { en, it }

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let text = dicts[lang][key] ?? dicts.en[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
  }
  return text
}

export function getSavedLang(): Lang | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'it' || v === 'en' ? v : null
  } catch {
    return null
  }
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* private mode — ignore */
  }
}

function langFromNavigator(): Lang {
  const l = (navigator.language || '').toLowerCase()
  return l.startsWith('it') ? 'it' : 'en'
}

/**
 * Language rule: Italian when browsing from Italy, English everywhere else.
 * Detection order: saved choice → IP country (two free providers) → browser locale.
 */
export async function detectLang(): Promise<Lang> {
  const saved = getSavedLang()
  if (saved) return saved

  const providers: Array<() => Promise<string | undefined>> = [
    async () => {
      const r = await fetchWithTimeout('https://ipwho.is/?fields=country_code', 4000)
      const j = (await r.json()) as { country_code?: string }
      return j.country_code
    },
    async () => {
      const r = await fetchWithTimeout('https://ipapi.co/json/', 4000)
      const j = (await r.json()) as { country_code?: string }
      return j.country_code
    },
  ]

  for (const p of providers) {
    try {
      const code = await p()
      if (code) return code.toUpperCase() === 'IT' ? 'it' : 'en'
    } catch {
      /* try next provider */
    }
  }
  return langFromNavigator()
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res
}

export interface I18n {
  lang: Lang
  t: (key: string, params?: Record<string, string | number>) => string
  setLang: (lang: Lang) => void
}

export const I18nContext = createContext<I18n>({
  lang: 'en',
  t: (key, params) => translate('en', key, params),
  setLang: () => {},
})

export function useI18n(): I18n {
  return useContext(I18nContext)
}
