#!/usr/bin/env node
// Headless check of one Arao deck, against a running dev server.
//   node check-deck.mjs <url> [outDir]
//   e.g. node check-deck.mjs http://127.0.0.1:5173/mytalk shots
// Run it from the slides project (it imports playwright-core, a dependency of araojs). Chromium
// once: npx playwright-core install chromium.
// Prints: console warnings/errors and page errors, the slide count, the highest step reached on
// each slide, slides whose content overflows, and saves a screenshot of every step in outDir
// (default ./deck-check), named s<slide>-<step>.png. Exit code 1 if any warning, error or overflow.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

// playwright-core is resolved from the project (the current folder), not from this script's
// folder: the skill may be installed outside the project.
const require = createRequire(join(process.cwd(), 'package.json'))
const resolvePw = () => {
  try {
    return require.resolve('playwright-core')
  } catch {
    // not hoisted: the copy araojs depends on
    return createRequire(join(process.cwd(), 'node_modules/araojs/package.json')).resolve('playwright-core')
  }
}
const pw = await import(pathToFileURL(resolvePw()).href)
const chromium = pw.chromium ?? pw.default.chromium

const [url, outDir = 'deck-check'] = process.argv.slice(2)
if (!url) {
  console.error('usage: node check-deck.mjs <deck url> [outDir]')
  process.exit(2)
}
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const problems = []
page.on('console', (m) => {
  if (m.type() === 'warning' || m.type() === 'error') problems.push(`${m.type()}: ${m.text().split('\n')[0]}`)
})
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

await page.goto(url.replace(/#.*$/, '') + '#/1/1')
await page.waitForSelector('.ar-slide')
await page.waitForTimeout(800)
const slides = await page.locator('.ar-slide').count()

const hash = () => page.evaluate(() => location.hash)
const parse = (h) => (h.match(/^#\/(\d+)\/(\d+)/) || []).slice(1).map(Number)
const steps = {}
const overflow = new Set()
// each state: wait for the slide transition to end, then check overflow and take a screenshot
const visit = async () => {
  await page.waitForTimeout(700)
  const [s, st] = parse(await hash())
  steps[s] = Math.max(steps[s] || 0, st)
  const over = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.ar-slide')].find((e) => getComputedStyle(e).display !== 'none')
    return el ? el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1 : false
  })
  if (over) overflow.add(s)
  await page.screenshot({ path: join(outDir, `s${s}-${st}.png`) })
}

await visit()
for (let guard = 0; guard < 2000; guard++) {
  const before = await hash()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(100)
  if ((await hash()) === before) break
  await visit()
}
await browser.close()

console.log(`slides: ${slides}`)
console.log(`steps per slide: ${Object.entries(steps).map(([k, v]) => `${k}:${v}`).join(' ')}`)
if (overflow.size) console.log(`overflow on slides: ${[...overflow].join(', ')}`)
if (problems.length) console.log(`console problems (${problems.length}):\n  ${problems.join('\n  ')}`)
else console.log('console: clean')
console.log(`screenshots: ${outDir}/`)
process.exit(problems.length || overflow.size ? 1 : 0)
