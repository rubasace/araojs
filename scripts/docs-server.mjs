// Shared by scripts/shots.mjs and scripts/hero-gif.mjs: a Vite dev server for small decks on the
// library's source (like the playground), and the Chromium that draws them.
//
//   const server = await startDecksServer({ decks: '/abs/folder' })   // server.url, server.close()
//   const browser = await launchChromium()
//
// The server's root is a throwaway folder under node_modules/.cache (index.html and src/main.js,
// nothing else), so that 'vue' and the library's dependencies resolve from the repository.
// The decks folder's snippets/, images/ and themes/ subfolders are the plugin's other folders.
// Chromium is playwright-core's (npx playwright-core install chromium), or ARAO_CHROMIUM; what
// it needs on this machine (LD_LIBRARY_PATH, FONTCONFIG_FILE) passes through the environment.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import arao from '../vite/index.js'

export const REPO = fileURLToPath(new URL('..', import.meta.url))

export async function startDecksServer({ decks, port = 5190 }) {
  const root = join(REPO, 'node_modules/.cache/arao-docs', String(process.pid))
  mkdirSync(join(root, 'src'), { recursive: true })
  writeFileSync(join(root, 'index.html'), '<!doctype html>\n<div id="app"></div>\n<script type="module" src="/src/main.js"></script>\n')
  writeFileSync(join(root, 'src/main.js'), "import { createDeckApp } from 'araojs'\ncreateDeckApp({ deckList: 'always' }).mount('#app')\n")
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'warn',
    plugins: [arao({ decks, ...folders(decks) })],
    resolve: { alias: [{ find: /^araojs$/, replacement: join(REPO, 'src/index.js') }] },
    server: { host: '127.0.0.1', port, strictPort: false },
  })
  await server.listen()
  const url = server.resolvedUrls.local[0]
  return {
    url,
    root,
    vite: server,
    async close() {
      await server.close()
      rmSync(root, { recursive: true, force: true })
    },
  }
}

// the decks folder's subfolders that exist, as the plugin's options (it reports a missing one)
function folders(decks) {
  const all = { snippets: join(decks, 'snippets'), images: join(decks, 'images'), themes: join(decks, 'themes') }
  return Object.fromEntries(Object.entries(all).filter(([, dir]) => existsSync(dir)))
}

export async function launchChromium() {
  const { chromium } = await import('playwright-core')
  return chromium.launch({ executablePath: process.env.ARAO_CHROMIUM || undefined })
}

// Waits until the deck on the page has drawn: a slide, no element still loading (data-ar-busy:
// snippets, pictures), the fonts in, and the step fade over.
export async function settle(page, ms = 900) {
  await page.waitForSelector('.ar-slide')
  await page.waitForFunction(() => !document.querySelector('[data-ar-busy]'), null, { timeout: 15000 })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(ms)
}
