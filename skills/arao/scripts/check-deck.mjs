#!/usr/bin/env node
// Headless check of one Arao deck, against a running dev server.
//   node check-deck.mjs <url> [outDir]
//   e.g. node check-deck.mjs http://localhost:5173/mytalk shots   (the URL Vite prints)
// Run it from the slides project (it imports playwright-core, a dependency of araojs). Chromium
// once: npx playwright-core install chromium.
// Prints: console warnings/errors and page errors, the slide count, the highest step reached on
// each slide, slides whose content overflows, Slide API that is gone (a removed prop is no error
// in Vue: it lands on the slide as a plain HTML attribute and does nothing), components that are
// gone (Cols, Rows, Grid: Vue renders an element of that name that lays nothing out), each with its
// replacement, and saves a screenshot of every step in outDir (default ./deck-check), named
// s<slide>-<step>.png. Exit code 1 if any warning, error, overflow, removed Slide API or
// component, quirks mode (no <!doctype html>) or no slide rendered.
// It warns, without failing, about what may be gone or may be the deck's own: a center element
// (the Center component, or HTML's old <center>) and the class small (now text-sm, or a class of
// the deck's). It also warns, without failing, about named templates that are no zone of their slide's layout
// (the project's layouts and their zones from `arao layouts --json`, run in the project; not
// checked when that fails, as with an older araojs): the layout's CSS does not place them, but a
// theme or the deck's own CSS may (.ar-zone-<name>), and then the type check needs them declared
// (ProjectLayoutZones: docs/guide/slides-and-layouts.md). And about a slide whose header has an h3
// subtitle (the h3 right after its title) while its body goes on with h3 headings: the first one
// was most likely meant as a heading of the body too.
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
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

// the zones of each layout the project has (name → zone names), from the araojs it has installed:
// null when that cannot be asked (an araojs without arao layouts, a config that does not load)
const zonesOf = (() => {
  try {
    const bin = join(dirname(require.resolve('araojs/package.json')), 'bin', 'arao.js')
    const run = spawnSync(process.execPath, [bin, 'layouts', '--json'], { encoding: 'utf8' })
    if (run.status !== 0) return null
    return Object.fromEntries(JSON.parse(run.stdout).layouts.map((l) => [l.name, l.zones.map((z) => z.name)]))
  } catch {
    return null
  }
})()

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const problems = []
page.on('console', (m) => {
  if (m.type() === 'warning' || m.type() === 'error') problems.push(`${m.type()}: ${m.text().split('\n')[0]}`)
})
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))

const fail = async (message) => {
  console.log(message)
  if (problems.length) console.log(`console problems (${problems.length}):\n  ${problems.join('\n  ')}`)
  await browser.close()
  process.exit(1)
}

try {
  await page.goto(url.replace(/#.*$/, '') + '#/1/1')
  await page.waitForSelector('.ar-slide', { timeout: 15000 })
} catch (e) {
  await fail(`no .ar-slide rendered at ${url} (wrong URL or port? is the dev server running?): ${e.message.split('\n')[0]}`)
}
await page.waitForTimeout(800)
// no <!doctype html> in index.html: quirks mode, tables lose their theme
if ((await page.evaluate(() => document.compatMode)) === 'BackCompat') {
  problems.push('quirks mode: index.html has no <!doctype html> as its first line')
}
const slides = await page.locator('.ar-slide').count()

// Slide API that is gone (araojs 0.5): its props fall through to the slide's section as plain
// attributes, and template(#background) is a zone like any other (.ar-zone-background), as are
// split's old #left and #right
const removed = await page.evaluate(() => {
  const now = {
    bg: 'Background(src="…") inside the slide, or style="background: …" for a colour',
    bgopacity: 'Background(opacity)', bgposition: 'Background(position)', bgblur: 'Background(blur)', bgfit: 'Background(fit)',
    ratio: 'columns="2fr 1fr", a parameter of image-left, image-right and split',
    align: 'the classes top, center, bottom (the body starts at the top by default)',
    footer: 'the classes no-footer, with-footer',
    title: "the slide's first heading, which names it",
  }
  return [...document.querySelectorAll('.ar-slide')].flatMap((slide, i) => {
    const found = [...slide.attributes].map((a) => a.name).filter((n) => now[n.replace(/-/g, '')])
      .map((n) => `${n} (now ${now[n.replace(/-/g, '')]})`)
    if (slide.querySelector(':scope > .ar-zone-background')) found.push('template(#background) (now Background inside the slide)')
    if (slide.matches('.layout-split') && slide.querySelector(':scope > :is(.ar-zone-left, .ar-zone-right)'))
      found.push('template(#left) / template(#right) on split (now its two sides are the body\'s two children, a div each)')
    return found.length ? [`slide ${i + 1}: ${found.join('; ')}`] : []
  })
})

// components and classes that are gone (araojs 0.5): Cols, Rows, Grid and Center are no
// components (Vue warns once and renders an element of that name, cols, rows, grid, center, that
// lays nothing out), and the class small is text-sm. A slide's columns are its layout (split,
// grid); inside a block, the utility classes (src/styles/utilities.css: npx arao layouts).
// cols, rows and grid are no HTML elements: found, they are the removed components, and fail the
// check. A center element may be HTML's own old <center>, and a class small the deck's own: those
// two are warnings, which do not fail it
const { gone, maybeGone } = await page.evaluate(() => {
  const now = {
    cols: 'Cols (now: Slide(layout="split") for two sides, layout="grid" for blocks; inside a block, .cols, uneven with style="--ar-cols: 2fr 1fr")',
    rows: 'Rows (now: .stack, with .grow on what fills; or .rows, style="--ar-rows: auto 1fr")',
    grid: 'Grid (now: Slide(layout="grid"), a div per block, columns="3", cards="…"; inside a block, .cols-2, .cols-3, .cols-4)',
  }
  const maybe = {
    center: 'a center element: the removed Center? (now: .center.grow; .stack.center.grow around a picture with a size; nothing around a Snippet)',
    '.small': 'the class small: the removed one? (now text-sm)',
  }
  const per = (table) => [...document.querySelectorAll('.ar-slide')].flatMap((slide, i) => {
    const found = Object.keys(table).filter((sel) => slide.querySelector(sel)).map((sel) => table[sel])
    return found.length ? [`slide ${i + 1}: ${found.join('; ')}`] : []
  })
  return { gone: per(now), maybeGone: per(maybe) }
})

// named templates that are no zone of their slide's layout: its CSS does not place them (a theme
// or the deck's CSS may), and the type check turns them down unless they are declared. A warning:
// it does not fail the check. A layout the project has no file for is not judged, nor
// template(#background) (removed Slide API, above)
const strayZones = zonesOf == null ? [] : await page.evaluate((zones) => [...document.querySelectorAll('.ar-slide')].flatMap((slide, i) => {
  const layout = [...slide.classList].find((c) => c.startsWith('layout-'))?.slice('layout-'.length) ?? 'default'
  const own = zones[layout]
  if (!own) return []
  const stray = [...slide.querySelectorAll(':scope > .ar-zone')]
    .flatMap((z) => [...z.classList].filter((c) => c.startsWith('ar-zone-')).map((c) => c.slice('ar-zone-'.length)))
    .filter((n) => n !== 'background' && !own.includes(n))
  return stray.length ? [`slide ${i + 1} (layout ${layout}): ${stray.map((n) => `template(#${n})`).join(', ')}; its zones: ${own.length ? own.map((n) => `#${n}`).join(', ') : 'none'}`] : []
}), zonesOf)

// an h3 right after the title is its subtitle (Slide.vue), even when the slide's other h3 are
// headings of its body: a slide with an h3 subtitle and an h3 directly in its body likely meant
// the first one as a body heading. A warning: it does not fail the check
const subtitleHeadings = await page.evaluate(() => [...document.querySelectorAll('.ar-slide')].flatMap((slide, i) => {
  const sub = slide.querySelector(':scope > .ar-header > h3.ar-subtitle')
  return sub && slide.querySelector(':scope > .ar-body > h3') ? [`slide ${i + 1}: "${sub.textContent.trim()}"`] : []
}))

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
if (removed.length) console.log(`removed Slide API (${removed.length} slides):\n  ${removed.join('\n  ')}`)
if (gone.length) console.log(`removed components (${gone.length} slides; troubleshooting.md, decks written for an older Arao):\n  ${gone.join('\n  ')}`)
if (maybeGone.length) console.log(`warning: maybe removed, maybe the deck's own (${maybeGone.length} slides; troubleshooting.md, decks written for an older Arao):\n  ${maybeGone.join('\n  ')}`)
if (zonesOf == null) console.log('zones: not checked (npx arao layouts --json failed)')
else if (strayZones.length) console.log(`warning: templates that are no zone of their layout, placed only if a theme or the deck's CSS styles .ar-zone-<name> (${strayZones.length} slides; npx arao layouts):\n  ${strayZones.join('\n  ')}`)
if (subtitleHeadings.length) console.log(`warning: an h3 right after the title is its subtitle, and these slides have more h3 in the body: did you mean a body heading? Put something before it (a p), or use template(#title) for the header (${subtitleHeadings.length} slides):\n  ${subtitleHeadings.join('\n  ')}`)
if (problems.length) console.log(`console problems (${problems.length}):\n  ${problems.join('\n  ')}`)
else console.log('console: clean')
console.log(`screenshots: ${outDir}/`)
process.exit(problems.length || overflow.size || removed.length || gone.length ? 1 : 0)
