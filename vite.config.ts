import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Deployed at https://<user>.github.io/beach-umbrella/
const BASE = '/beach-umbrella/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.svg', 'apple-touch-icon.png', 'robots.txt'],
      manifest: {
        name: 'Beach Umbrella',
        short_name: 'BeachUmbrella',
        description:
          'Find the best low-sun time windows for a swim. Weather-aware dip planning for people who love the sea but not the sun.',
        lang: 'en',
        dir: 'ltr',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#FFF7E8',
        theme_color: '#0891B2',
        categories: ['weather', 'travel', 'lifestyle'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: `${BASE}index.html`,
        runtimeCaching: [
          {
            // Weather, marine and geocoding data (Open-Meteo)
            urlPattern: /^https:\/\/(api|marine-api|geocoding-api)\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Swim spots (OpenStreetMap Overpass API)
            urlPattern: /^https:\/\/(overpass-api\.de|overpass\.kumi\.systems)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'overpass',
              networkTimeoutSeconds: 20,
              expiration: { maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Reverse geocoding + IP country detection
            urlPattern: /^https:\/\/(api\.bigdatacloud\.net|ipwho\.is|ipapi\.co)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'geo-meta',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 20, maxAgeSeconds: 12 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
