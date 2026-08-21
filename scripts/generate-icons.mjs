// Generates the PWA PNG icons from public/logo.svg using sharp.
// Run: npm run icons
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const logoSvg = await readFile(path.join(root, 'public', 'logo.svg'), 'utf8')

// Sunny background so icons never sit on transparency.
const framed = (inset) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#cff3f9"/>
      <stop offset="1" stop-color="#fff4dd"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
  <g transform="translate(${(512 * (1 - inset)) / 2} ${(512 * (1 - inset)) / 2}) scale(${inset})">
    ${logoSvg.replace(/<\/?svg[^>]*>/g, '')}
  </g>
</svg>`

const jobs = [
  { file: 'pwa-192x192.png', size: 192, inset: 1 },
  { file: 'pwa-512x512.png', size: 512, inset: 1 },
  // Maskable: keep artwork inside the ~80% safe zone.
  { file: 'maskable-icon-512x512.png', size: 512, inset: 0.72 },
  { file: 'apple-touch-icon.png', size: 180, inset: 1 },
]

for (const { file, size, inset } of jobs) {
  const png = await sharp(Buffer.from(framed(inset)), { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer()
  await writeFile(path.join(root, 'public', file), png)
  console.log('✓', file)
}
