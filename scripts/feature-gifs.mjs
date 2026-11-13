#!/usr/bin/env node
// docs/assets/features/: the README's features, each a picture or a short looping GIF drawn from
// the example decks, so that what the README shows is what Arao does.
//
//   npm run feature-gifs                 every feature
//   npm run feature-gifs -- steps code   only these (the names of FEATURES below)
//
// Two folders of decks are served on the library's source (scripts/docs-server.mjs): the guides'
// examples (docs/examples/*.vue) and a small project of talks (docs/examples/talks/*.vue, with the
// examples' themes, snippets and images). Each feature opens a deck in an iframe of a page of its
// own, a browser window with the deck's URL in its bar and the key just pressed in a corner, and
// drives it with the real keys; each frame is a screenshot. A change of state fades from the
// picture before it (a crossfade, as the step and theme transitions are). ffmpeg (on the PATH,
// or FFMPEG=/path/to/ffmpeg) makes each GIF with a palette of its own. Any console warning or
// error of a deck fails the run.
//
// Run on demand, not in CI, and commit the result. Chromium as in the smoke test: playwright-core's
// (npx playwright-core install chromium), or ARAO_CHROMIUM=/path/to/chrome.
import { execFile, execFileSync } from 'node:child_process'
import { promisify } from 'node:util'
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { launchChromium, LOCALE, REPO, startDecksServer } from './docs-server.mjs'

const OUT = join(REPO, 'docs/assets/features')
const EXAMPLES = join(REPO, 'docs/examples')
const TALKS = join(EXAMPLES, 'talks')
const FPS = 12
const W = 640 // the window: a bar, then the deck at 640x360 (a third of the canvas)
const BAR = 28
const H = 360
const HOLD = 16 // frames a state stays on screen
const FADE = 4 // frames of a crossfade

const FEATURES = { canvas, steps, layouts, code, icons, images, themes, presenter, decks, jump, export: exportPdf, agents }

const only = process.argv.slice(2)
for (const name of only) if (!FEATURES[name]) throw new Error(`no feature ${name} (there are: ${Object.keys(FEATURES).join(', ')})`)

// the window around a deck: its bar, the key pressed, a pointer, the crossfade
const CHROME = `
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font: 12px/1 Inter, system-ui, sans-serif; overflow: hidden; }
  .bar { position: relative; height: ${BAR}px; background: #24292f; display: flex; align-items: center; gap: 6px; padding: 0 10px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .url { position: absolute; left: 76px; right: 76px; top: 5px; height: 18px; border-radius: 5px; background: #161b22;
         color: #c9d1d9; display: flex; align-items: center; justify-content: center; font-size: 11px; white-space: nowrap; overflow: hidden; }
  .url b { color: #8b949e; font-weight: 400; }
  iframe { display: block; border: 0; background: #000; transform-origin: 0 0; }
`
const DOTS = '<span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span>'
const SCRIPT = `
  const deck = document.getElementById('deck')
  window.open_ = (src) => { deck.src = src }
  window.url = (href) => {
    const u = new URL(href)
    document.getElementById('url').innerHTML = '<b>localhost:5173</b>' + (decodeURI(u.pathname + u.search + u.hash))
  }
  window.key = (label) => {
    const k = document.getElementById('key')
    if (!k) return
    k.textContent = label
    k.style.display = label ? 'block' : 'none'
  }
  window.ghost = (png) => {
    const g = document.getElementById('ghost')
    if (png) { g.src = 'data:image/png;base64,' + png; g.style.opacity = 1; g.style.display = 'block' }
    else g.style.display = 'none'
    return png ? g.decode() : null
  }
  window.ghostOpacity = (o) => { document.getElementById('ghost').style.opacity = o }
  window.pointer = (p) => {
    const c = document.getElementById('pointer')
    c.style.display = p ? 'block' : 'none'
    if (p) { c.style.left = p.x + 'px'; c.style.top = p.y + 'px' }
  }
  window.zoom = (z) => {
    Object.assign(deck.style, { width: ${W} * z + 'px', height: ${H} * z + 'px', transform: 'scale(' + 1 / z + ')' })
    document.body.classList.add('zoomed')
  }
`
const POINTER = `<svg id="pointer" width="18" height="24" viewBox="0 0 18 24" style="position:absolute;display:none;z-index:5;filter:drop-shadow(0 1px 2px #0008)">
  <path d="M1 1 L1 19 L6 14.5 L9.5 22 L12.5 20.6 L9 13.4 L15.5 13.4 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>`

mkdirSync(OUT, { recursive: true })
const examples = await startDecksServer({ decks: EXAMPLES })
const talks = await startDecksServer({
  decks: TALKS,
  folders: { snippets: join(EXAMPLES, 'snippets'), images: join(EXAMPLES, 'images'), themes: join(EXAMPLES, 'themes') },
})
const browser = await launchChromium()
const problems = []
try {
  writeFileSync(join(examples.root, 'window.html'), windowPage())
  writeFileSync(join(examples.root, 'canvas.html'), canvasPage())
  for (const name of only.length ? only : Object.keys(FEATURES)) await FEATURES[name]()
} finally {
  await browser.close()
  await examples.close()
  await talks.close()
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}

// --- the features ---

// The same slide in windows of other sizes and shapes: scaled whole, letterboxed, the same lines.
async function canvas() {
  const rec = await recorder('canvas', 'canvas.html')
  await rec.load(`${examples.url}grid#/1/5`)
  const sizes = [[576, 324, '16:9'], [420, 315, '4:3'], [184, 327, '9:16'], [608, 260, '21:9']]
  const size = (w, h, label) => rec.tab.evaluate(([w, h, label]) => window.resize(w, h, label), [w, h, label])
  await size(...sizes[0])
  await rec.settle()
  for (let i = 0; i < sizes.length; i++) {
    await rec.hold(HOLD)
    const [[w0, h0], [w1, h1, label]] = [sizes[i], sizes[(i + 1) % sizes.length]]
    for (let f = 1; f <= 6; f++) {
      const t = ease(f / 6)
      await size(Math.round(w0 + (w1 - w0) * t), Math.round(h0 + (h1 - h0) * t), f === 6 ? label : '')
      await rec.settle(60)
      await rec.shot()
    }
  }
  await rec.gif()
}

// A slide that reveals itself, one press at a time.
async function steps() {
  const rec = await recorder('steps')
  await rec.load(`${examples.url}steps#/1/1`)
  await rec.hold(HOLD)
  for (let i = 0; i < 2; i++) {
    await rec.change(() => rec.key('ArrowRight', '→'))
    await rec.hold(HOLD)
  }
  await rec.change(() => rec.go('#/1/1'), FADE + 2)
  await rec.gif()
}

// Layouts and composition: a cover, a split, a grid, a picture beside the text, a section.
async function layouts() {
  const rec = await recorder('layouts')
  const pages = [`${examples.url}cover`, `${examples.url}split#/1/2`, `${examples.url}grid#/1/5`, `${talks.url}cies-islands#/2/1`, `${talks.url}building-a-framework#/5/1`]
  await rec.load(pages[0])
  await rec.hold(HOLD)
  for (const page of [...pages.slice(1), pages[0]]) {
    await rec.change(() => rec.load(page), FADE + 1)
    if (page !== pages[0]) await rec.hold(HOLD)
  }
  await rec.gif()
}

// A code window whose highlights move with the steps.
async function code() {
  const rec = await recorder('code')
  await rec.load(`${talks.url}live-coding-with-vue#/2/1`)
  await rec.hold(HOLD)
  for (let i = 0; i < 2; i++) {
    await rec.change(() => rec.key('ArrowRight', '→'))
    await rec.hold(HOLD + 4)
  }
  await rec.change(() => rec.go('#/2/1'), FADE + 2)
  await rec.gif()
}

// Logos by name, in the text's colour.
async function icons() {
  const rec = await recorder('icons')
  await rec.load(`${examples.url}icons#/1/6`)
  await rec.png()
}

// A picture as a background, a picture beside the text, a picture faded behind it.
async function images() {
  const rec = await recorder('images')
  await rec.load(`${talks.url}cies-islands#/1/1`)
  await rec.hold(HOLD)
  for (let i = 0; i < 2; i++) {
    await rec.change(() => rec.key('ArrowRight', '→'), FADE + 1)
    await rec.hold(HOLD)
  }
  await rec.change(() => rec.go('#/1/1'), FADE + 2)
  await rec.gif()
}

// One slide, four themes, switched live with t.
async function themes() {
  const rec = await recorder('themes')
  await rec.load(`${examples.url}theme`)
  await rec.hold(HOLD)
  for (let i = 0; i < 4; i++) {
    await rec.change(() => rec.key('t'), FADE + 1)
    await rec.hold(HOLD)
  }
  await rec.gif()
}

// The presenter view: the slide, the next step, the notes of this step, the timer running.
async function presenter() {
  const rec = await recorder('presenter', 'window.html', { zoom: 2 })
  await rec.load(`${talks.url}building-a-framework?presenter#/2/1`)
  await rec.hold(HOLD)
  for (const [i, k] of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight'].entries()) {
    await rec.change(async () => {
      await rec.key(k, '→')
      await rec.tab.waitForTimeout(i ? 1000 : 0) // the timer runs in real time
    }, 2)
    await rec.hold(HOLD)
  }
  await rec.change(() => rec.load(`${talks.url}building-a-framework?presenter#/2/1`, { reset: true }), FADE + 2)
  await rec.gif()
}

// A URL per deck, and the list of decks at / with their covers.
async function decks() {
  const rec = await recorder('decks', 'window.html', { zoom: 2 })
  await rec.load(talks.url)
  await rec.hold(HOLD + 4)
  const card = rec.frame.locator('a[href$="cloud-native-java"]')
  await rec.change(() => rec.pointAt(card), 2)
  await rec.hold(8)
  await rec.change(async () => {
    await card.evaluate((a) => a.click()) // the pointer is drawn; the click needs no position
    await rec.pointAt(null)
    await rec.settle()
  }, FADE + 1)
  await rec.hold(HOLD)
  await rec.change(() => rec.key('ArrowRight', '→'), FADE)
  await rec.hold(HOLD)
  await rec.change(() => rec.load(talks.url), FADE + 2)
  await rec.gif()
}

// Keyboard: the jump menu (g), filtered by a word of a title, and Enter.
async function jump() {
  const rec = await recorder('jump', 'window.html', { zoom: 1.5 })
  await rec.load(`${talks.url}building-a-framework#/1/1`)
  await rec.hold(HOLD)
  await rec.change(() => rec.key('g'), 2)
  await rec.hold(10)
  for (const c of 'filter') {
    await rec.key(c, c)
    await rec.hold(2)
  }
  await rec.hold(10)
  await rec.change(() => rec.key('Enter', '⏎'), FADE)
  await rec.hold(HOLD)
  await rec.change(() => rec.go('#/1/1'), FADE + 2)
  await rec.gif()
}

// PDF export: the command, its summary line, and the pages it printed.
async function exportPdf() {
  const deck = 'building-a-framework'
  // the real command, run on the talks project (a Vite config with the plugin), printing from
  // the server already running
  writeFileSync(join(talks.root, 'vite.config.mjs'), `import arao from ${JSON.stringify(join(REPO, 'vite/index.js'))}
export default { plugins: [arao(${JSON.stringify({ decks: TALKS, snippets: join(EXAMPLES, 'snippets'), images: join(EXAMPLES, 'images'), themes: join(EXAMPLES, 'themes') })})] }
`)
  // (not execFileSync: the server it prints from runs in this process)
  const { stdout: out } = await promisify(execFile)(process.execPath, [join(REPO, 'bin/arao.js'), 'export', '--deck', deck, '--url', talks.url, '--out', 'exports/'], {
    cwd: talks.root,
    encoding: 'utf8',
  })
  const summary = out.trim().split('\n').at(-1)
  console.log(`  arao export: ${summary}`)

  // the pages, as the export view lays them out for printing
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 0.25, locale: LOCALE })
  const page = await context.newPage()
  watch(page, 'export')
  await page.goto(`${talks.url}${deck}?export`)
  await page.waitForSelector('.ar-export-done', { timeout: 30000 })
  const pages = []
  for (const el of await page.locator('.ar-book > *').all()) pages.push((await el.screenshot()).toString('base64'))
  await context.close()

  const tab = await browser.newPage({ viewport: { width: W, height: H + BAR }, locale: LOCALE })
  await tab.setContent(exportPage(`npm run export -- --deck ${deck}`, summary, pages))
  await tab.evaluate(() => document.fonts.ready)
  await tab.screenshot({ path: join(OUT, 'export.png') })
  await tab.close()
  report('export.png', `${pages.length} pages`)
}

// --- recording ---

async function recorder(name, pageName = 'window.html', { zoom = 1 } = {}) {
  const frames = mkdtempSync(join(tmpdir(), `arao-${name}-`))
  const tab = await browser.newPage({ viewport: { width: W, height: H + BAR }, locale: LOCALE })
  watch(tab, name)
  await tab.goto(`${examples.url}${pageName}`)
  // zoom: the deck's window that many times larger, drawn smaller (the presenter view and the list
  // of decks are laid out for a screen, not scaled like a slide); the key then shows at the bottom left
  if (zoom !== 1) await tab.evaluate((z) => window.zoom(z), zoom)
  let n = 0
  const rec = {
    tab,
    frame: null,
    // opens a deck in the window (a URL of either server)
    async load(url, { reset = false } = {}) {
      if (reset) await rec.frame.evaluate(() => sessionStorage.clear()) // the presenter's timer
      await tab.evaluate((url) => window.open_(url), url)
      const handle = await tab.waitForSelector('iframe')
      rec.frame = await handle.contentFrame()
      await rec.frame.waitForURL(url, { timeout: 15000 }).catch(() => {})
      await rec.frame.waitForSelector('.ar-slide', { state: 'attached' })
      await rec.settle()
    },
    // the deck drawn: nothing loading (data-ar-busy), the fonts in, the transitions over
    async settle(ms = 700) {
      await rec.frame.waitForFunction(() => !document.querySelector('[data-ar-busy]'), null, { timeout: 15000 })
      await rec.frame.evaluate(() => document.fonts.ready)
      await tab.waitForTimeout(ms)
      await tab.evaluate((url) => window.url(url), rec.frame.url())
    },
    async shot(times = 1) {
      const file = join(frames, `f${String(n++).padStart(4, '0')}.png`)
      await tab.screenshot({ path: file })
      for (let i = 1; i < times; i++) copyFileSync(file, join(frames, `f${String(n++).padStart(4, '0')}.png`))
    },
    hold: (times) => rec.shot(times),
    // presses a key in the deck, and shows it in the corner (label: what the key shows; none: the key)
    async key(key, label = key) {
      await tab.evaluate((label) => window.key(label), label)
      await tab.evaluate(() => document.getElementById('deck').focus())
      await tab.keyboard.press(key)
      await rec.settle(key.length === 1 && key !== 't' && key !== 'g' ? 150 : 700)
    },
    // moves within the deck without a key (the hash), as when the GIF loops back
    async go(hash) {
      await tab.evaluate(() => window.key(''))
      await rec.frame.evaluate((hash) => (location.hash = hash), hash)
      await rec.settle()
    },
    // a pointer over an element of the deck (null: none), drawn, as screenshots draw none
    async pointAt(locator) {
      if (!locator) return tab.evaluate(() => window.pointer(null))
      await locator.hover()
      const box = await locator.boundingBox()
      await tab.evaluate((p) => window.pointer(p), { x: box.x + box.width * 0.62, y: box.y + box.height * 0.42 })
      await rec.settle(400)
    },
    // a change of state, faded from the picture before it
    async change(action, fade = FADE) {
      const before = (await tab.screenshot()).toString('base64')
      await tab.evaluate((png) => window.ghost(png), before)
      await action()
      for (let i = 1; i <= fade; i++) {
        await tab.evaluate((o) => window.ghostOpacity(o), 1 - i / fade)
        await rec.shot()
      }
      await tab.evaluate(() => window.ghost(null))
    },
    async png() {
      await tab.screenshot({ path: join(OUT, `${name}.png`) })
      await tab.close()
      rmSync(frames, { recursive: true, force: true })
      report(`${name}.png`)
    },
    // dither: for pictures with gradients (bands otherwise); flat slides are smaller without
    async gif({ dither = false } = {}) {
      await tab.close()
      const out = join(OUT, `${name}.gif`)
      const ffmpeg = process.env.FFMPEG || 'ffmpeg'
      execFileSync(ffmpeg, [
        '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png'),
        '-vf', `split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=${dither ? 'bayer:bayer_scale=5' : 'none'}:diff_mode=rectangle`,
        '-loop', '0', out,
      ], { stdio: 'inherit' })
      const count = readdirSync(frames).length
      rmSync(frames, { recursive: true, force: true })
      report(`${name}.gif`, `${count} frames, ${(count / FPS).toFixed(1)} s`)
    },
  }
  return rec
}

function watch(page, name) {
  page.on('console', (m) => ['warning', 'error'].includes(m.type()) && problems.push(`${name}: ${m.text()}`))
  page.on('pageerror', (e) => problems.push(`${name}: ${e.message}`))
}

function report(file, what) {
  const path = join(OUT, file)
  console.log(`${relative(REPO, path)}: ${(statSync(path).size / 1024).toFixed(0)} KB${what ? `, ${what}` : ''}`)
}

function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

// --- the pages that hold the deck ---

function windowPage() {
  return `<!doctype html>
<meta charset="utf-8">
<style>${CHROME}
  .view { position: relative; width: ${W}px; height: ${H}px; overflow: clip; background: #000; }
  iframe { width: ${W}px; height: ${H}px; }
  body.zoomed #key { top: auto; right: auto; bottom: 14px; left: 14px; }
  #key { position: absolute; right: 14px; top: 12px; min-width: 32px; height: 32px; padding: 0 9px; border-radius: 8px;
         background: rgba(22, 27, 34, .9); color: #fff; font: 600 16px/30px Inter, system-ui, sans-serif; text-align: center;
         border: 1px solid rgba(255, 255, 255, .25); box-shadow: 0 3px 0 rgba(0, 0, 0, .55), 0 6px 16px rgba(0, 0, 0, .35); display: none; z-index: 4; }
  #ghost { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H + BAR}px; display: none; z-index: 10; }
</style>
<div class="bar">${DOTS}<div class="url" id="url"></div></div>
<div class="view"><iframe id="deck"></iframe><div id="key"></div></div>
${POINTER}
<img id="ghost">
<script>${SCRIPT}</script>
`
}

// a desktop, and a window on it whose size changes
function canvasPage() {
  return `<!doctype html>
<meta charset="utf-8">
<style>${CHROME}
  body { width: ${W}px; height: ${H + BAR}px; background: #d7dde5; }
  .win { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 8px; overflow: hidden;
         box-shadow: 0 0 0 1px rgba(20, 30, 50, .25), 0 8px 18px rgba(20, 30, 50, .25); }
  .win .url { left: 60px; right: 12px; }
  #size { position: absolute; left: 14px; bottom: 12px; padding: 5px 9px; border-radius: 6px; background: rgba(22, 27, 34, .85);
          color: #fff; font: 600 12px/1 Inter, system-ui, sans-serif; }
  #ghost { position: absolute; inset: 0; display: none; }
</style>
<div class="win" id="win"><div class="bar">${DOTS}<div class="url" id="url"></div></div><iframe id="deck"></iframe></div>
<div id="size"></div>
<img id="ghost">
<script>${SCRIPT}
  window.resize = (w, h, label) => {
    deck.style.width = w + 'px'
    deck.style.height = h + 'px'
    document.getElementById('size').textContent = label || document.getElementById('size').textContent
    document.querySelector('.win .url').style.display = w < 300 ? 'none' : ''
  }
</script>
`
}

// Written with an agent: AGENTS.md (what ships in the package), and a prompt to a coding agent.
async function agents() {
  const tab = await browser.newPage({ viewport: { width: W, height: H + BAR }, locale: LOCALE })
  await tab.setContent(agentsPage())
  await tab.evaluate(() => document.fonts.ready)
  await tab.screenshot({ path: join(OUT, "agents.png") })
  await tab.close()
  report("agents.png", "AGENTS.md and a prompt")
}

function agentsPage() {
  const md = [
    ["h", "# AGENTS.md — writing decks with Arao"],
    ["", ""],
    ["h", "## Rules"],
    ["", "- Start every slide with its heading (`h2`)."],
    ["", "- One idea per slide. Reveal with steps."],
    ["", "- Name files, never import them:"],
    ["c", "  Snippet(file=\"App.java\")"],
    ["", "- Style through tokens, not colours."],
  ]
  return `<!doctype html>
<meta charset="utf-8">
<style>${CHROME}
  body { width: ${W}px; height: ${H + BAR}px; background: #f6f3ec; display: flex; flex-direction: column; font-family: Inter, sans-serif; }
  .bar { flex: none; }
  .doc { flex: 1; padding: 18px 26px 0; font: 15px/1.55 "DejaVu Sans Mono", ui-monospace, monospace; color: #1b2a3a; white-space: pre; }
  .doc .h { color: #2a7de1; font-weight: 700; }
  .doc .c { color: #5b6877; }
  .chat { flex: none; margin: 0 22px 20px; padding: 14px 16px; background: #fff; border: 1px solid #1b2a3a22; border-radius: 12px; box-shadow: 0 6px 18px #1b2a3a1f; }
  .who { font: 600 12px/1 Inter, sans-serif; color: #5b6877; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 7px; }
  .msg { font: 500 17px/1.35 Inter, sans-serif; color: #1b2a3a; }
  .done { margin-top: 9px; font: 14px/1 "DejaVu Sans Mono", monospace; color: #2f7d4f; }
</style>
<div class="bar">${DOTS}<div class="url"><b>node_modules/araojs/</b>AGENTS.md</div></div>
<div class="doc">${md.map(([k, t]) => `<div class="${k}">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;") || " "}</div>`).join("")}</div>
<div class="chat"><div class="who">You → your coding agent</div><div class="msg">Make me a 10-minute deck about our new API, with the code shown step by step.</div><div class="done">✓ src/decks/new-api.vue</div></div>
`
}

function exportPage(command, summary, pages) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  return `<!doctype html>
<meta charset="utf-8">
<style>${CHROME}
  body { width: ${W}px; height: ${H + BAR}px; background: #3b4048; display: flex; flex-direction: column; }
  .bar, .term { flex: none; }
  .term { background: #0d1117; color: #c9d1d9; font: 10px/1.6 "DejaVu Sans Mono", ui-monospace, monospace; padding: 7px 12px 8px; white-space: nowrap; }
  .term .p { color: #7ee787; }
  .term .s { color: #8b949e; }
  .pages { flex: 1; display: grid; grid-template-columns: repeat(3, 160px); gap: 9px 16px; justify-content: center; align-content: center; }
  .page { position: relative; }
  .page img { display: block; width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, .45); }
  .page span { position: absolute; right: 4px; bottom: 3px; font: 600 9px/1 Inter, sans-serif; color: #fff; background: rgba(0, 0, 0, .55); padding: 2px 4px; border-radius: 3px; }
</style>
<div class="bar">${DOTS}<div class="url"><b>exports/</b>building-a-framework.pdf</div></div>
<div class="term"><div><span class="p">$</span> ${esc(command)}</div><div class="s">${esc(summary)}</div></div>
<div class="pages">${pages.map((p, i) => `<div class="page"><img src="data:image/png;base64,${p}"><span>${i + 1}</span></div>`).join('')}</div>
`
}
