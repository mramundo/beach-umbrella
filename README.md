# ⛱️ Beach Umbrella

**Love the sea, not the sun?** Beach Umbrella is a Progressive Web App that finds
the best *low-sun* time windows for a swim — for people who love the water but
hate baking on a towel.

Pick any place (search or geolocation) and Beach Umbrella cross-checks sun, sea
and weather forecasts to give you a simple **Dip Index (0–100)** for every hour
of the day, the **best swim windows**, the **local time**, and a list of
**swimmable spots nearby** — beaches, coves, pools, lakes, lagoons, quarry
lakes, water parks.

The interface speaks **Italian when you browse from Italy** and **English
everywhere else** (with a manual IT/EN toggle).

## ✨ Features

- 🔍 **Place search** with autocomplete (localized) + 📍 **device geolocation**
- 📊 **Dip Index** — a 0–100 hourly score tuned for sun-avoiders
- ⭐ **Best swim windows** per day, over a 7-day forecast
- 🕐 **Live local clock** of the selected place
- 🏖️ **Where to swim nearby** — swimmable places from OpenStreetMap, filterable
  by category, each with distance, a map link and a one-tap "conditions here".
  Loaded in two phases: Photon fills the list in about a second, then Overpass
  replaces it with the tag-verified set (private and no-swimming places
  excluded); results are cached locally for a day
- ❓ **FAQ** explaining exactly how the index is computed
- 📱 **Installable PWA** with offline caching of the app shell and last forecasts
- 🎨 Bold summer design, fully responsive (desktop + mobile), reduced-motion aware

## 🧮 The Dip Index

For every daylight hour, six ingredients are scored 0–100 and combined:

| Ingredient | Weight | Ideal |
|---|---|---|
| Gentle sun (UV index) | **35%** | UV ≤ 2 · zero above ~7 |
| Rain risk (probability + amount) | 15% | 0% |
| Air comfort | 15% | 24–31 °C |
| Water temperature (sea surface) | 15% | ≥ 24 °C |
| Calm sea (wave height) | 12% | flat |
| Light wind | 8% | ≤ 8 km/h |

Two ceilings then apply on top: thunderstorms cap the score near zero, and
the UV index caps it on the WHO scale (moderate 3–5 → max 79, high 6–7 → max 59,
very high 8–10 → max 39, extreme 11+ → max 19), so a punishing sun is never
sold as a good swim however perfect the sea is. Hours after sunset are not
scored. *Best swim windows* are the contiguous daylight hours
with the highest index. The Open-Meteo hourly UV index already accounts for
cloud cover — a genuinely overcast summer morning scores high, which is
exactly the point.

Implementation: [`src/lib/score.ts`](src/lib/score.ts) (weights are documented
in the FAQ too — keep both in sync).

## 🔌 Data sources (all free, no API keys)

| Service | Used for |
|---|---|
| [Open-Meteo Forecast API](https://open-meteo.com/) | weather, UV, wind, rain, sunrise/sunset, timezone |
| [Open-Meteo Marine API](https://open-meteo.com/) | wave height, sea surface temperature |
| [Open-Meteo Geocoding API](https://open-meteo.com/) | place search (localized) |
| [Photon](https://photon.komoot.io/) (Komoot) | fast first list of swim spots (~1 s) |
| [OpenStreetMap Overpass API](https://overpass-api.de/) | complete, tag-verified swim spots |
| [BigDataCloud reverse geocoding](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api) | naming your geolocated position |
| [ipwho.is](https://ipwho.is/) / [ipapi.co](https://ipapi.co/) | country detection for the IT/EN language rule |

Marine data is used only when Open-Meteo's nearest sea grid cell is within
~40 km; for lakes and inland places the water temperature is treated as an
estimate and labeled as such.

## 🛠️ Tech stack

- [Vite 7](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript (strict)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox): precached app
  shell, `NetworkFirst` runtime caching for all APIs, auto-updating service worker
- Self-hosted fonts via [Fontsource](https://fontsource.org/) (Baloo 2 + Nunito)
- No runtime state library, no backend, no keys, no trackers — 100% static

## 🚀 Development

```bash
npm install
npm run dev        # dev server
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
npm run icons      # regenerate PWA icons from public/logo.svg
```

## 📦 Deploy (GitHub Pages)

The app is built with base `/beach-umbrella/` and ships with a workflow
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that builds
the site and publishes `dist/` to the `gh-pages` branch on every push to
`main`. Creating the `gh-pages` branch auto-enables GitHub Pages; if it ever
needs to be set manually: **Settings → Pages → Deploy from a branch →
`gh-pages` / root**.

## 🔒 Privacy

Geolocation is used only in the browser to query the services above; nothing
is stored server-side. The only local data is the language choice, the last
selected place, and cached forecasts.

## ⚠️ Disclaimer

Forecasts and community map data can be wrong. Always check conditions, flags,
water-quality bulletins and local rules on site — and never swim alone at night.

## 📄 License

[MIT](LICENSE) · Weather data by [Open-Meteo](https://open-meteo.com/)
(CC BY 4.0) · Places © [OpenStreetMap](https://www.openstreetmap.org/copyright)
contributors (ODbL)
