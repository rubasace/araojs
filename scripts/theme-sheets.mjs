#!/usr/bin/env node
// The built-in themes' contact sheets, for their docs page (docs/guide/built-in-themes.md).
//
//   npm run theme-sheets                  every built-in theme (themes/*.css)
//   npm run theme-sheets -- carbon folio  only these
//   npm run theme-sheets -- --tiles /tmp/tiles   also keep each picture, full size, there
//
// It serves scripts/theme-sheets/Tour.vue on the library's source (scripts/docs-server.mjs: the
// built-in themes only, the docs examples' snippets and pictures), opens each of its slides at its
// last step (the code slide before its highlight) in each theme at 1920x1080, then the presenter
// view on its second slide, and lays the pictures out on one sheet per theme, three to a row:
// docs/assets/themes/<name>.png. Any console warning or error of the deck fails the run. Run on demand, not in CI, and commit the result. Chromium as
// in the smoke test (npx playwright-core install chromium, or ARAO_CHROMIUM).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { launchChromium, LOCALE, REPO, settle, startDecksServer } from './docs-server.mjs'

const THEMES = join(REPO, 'themes')
const SHEETS = join(REPO, 'docs/assets/themes')
const EXAMPLES = join(REPO, 'docs/examples')
// the built-in themes: one file each, named as its theme
const themes = readdirSync(THEMES).filter((f) => f.endsWith('.css')).map((f) => f.slice(0, -4)).sort()
for (const name of themes) {
  if (!readFileSync(join(THEMES, `${name}.css`), 'utf8').includes(`[data-theme="${name}"]`))
    throw new Error(`themes/${name}.css has no [data-theme="${name}"] rule: a built-in theme is named as its file`)
}

const args = process.argv.slice(2)
const tilesAt = args.indexOf('--tiles')
const tiles = tilesAt >= 0 ? args.splice(tilesAt, 2)[1] : null
for (const name of args) if (!themes.includes(name)) throw new Error(`no built-in theme ${name} (themes/${name}.css)`)
const names = args.length ? args : themes

const STEPS = { 4: 1 } // a slide shown at another step than its last: the code before its highlight
const W = 1920, H = 1080, TILE = 1 / 3 // each picture on the sheet: 640x360

const server = await startDecksServer({
  decks: join(REPO, 'scripts/theme-sheets'),
  folders: { snippets: join(EXAMPLES, 'snippets'), images: join(EXAMPLES, 'images') },
})
const browser = await launchChromium()
const problems = []
try {
  mkdirSync(SHEETS, { recursive: true })
  if (tiles) mkdirSync(tiles, { recursive: true })
  const context = await browser.newContext({ viewport: { width: W, height: H }, locale: LOCALE })
  for (const theme of names) {
    const shots = []
    const page = await context.newPage()
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && problems.push(`${theme}: ${m.text()}`))
    page.on('pageerror', (e) => problems.push(`${theme}: ${e.message}`))
    await page.goto(`${server.url}tour?theme=${theme}`)
    await settle(page, 0)
    const slides = await page.locator('.ar-slide').count()
    const visits = [...Array.from({ length: slides }, (_, i) => `tour?theme=${theme}#/${i + 1}/${STEPS[i + 1] ?? 99}`), `tour?theme=${theme}&presenter#/2/1`]
    for (const [i, path] of visits.entries()) {
      await page.goto(`${server.url}${path}`)
      // a new hash on the same page is no navigation: reload, so each slide is drawn afresh
      await page.reload()
      await settle(page)
      const shot = await page.screenshot()
      if (tiles) writeFileSync(join(tiles, `${theme}-${String(i + 1).padStart(2, '0')}.png`), shot)
      shots.push(shot.toString('base64'))
    }
    await page.close()
    const sheet = await context.newPage()
    await sheet.setContent(sheetHtml(theme, shots))
    await sheet.evaluate(() => Promise.all([...document.images].map((img) => img.decode())))
    const file = join(SHEETS, `${theme}.png`)
    await sheet.locator('.sheet').screenshot({ path: file })
    await sheet.close()
    console.log(relative(REPO, file))
  }
} finally {
  await browser.close()
  await server.close()
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}

// the pictures in rows of three, on the presenter view's background
function sheetHtml(theme, shots) {
  const img = (b64) => `<img src="data:image/png;base64,${b64}" width="${W * TILE}" height="${H * TILE}">`
  return `<!doctype html><style>
    body { margin: 0; }
    .sheet { display: inline-grid; grid-template-columns: repeat(3, auto); gap: 16px; padding: 16px; background: #14161b; }
    img { display: block; border-radius: 4px; }
  </style><div class="sheet" data-theme="${theme}">${shots.map(img).join('')}</div>`
}
