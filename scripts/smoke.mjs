#!/usr/bin/env node
// Packaged-consumer smoke test: installs the packed library into a brand-new slides project, the
// way a user would, and checks that it builds, that every deck runs without a warning, and that
// the export CLI prints a PDF of each deck, per step and per slide.
//
//   node scripts/smoke.mjs [path/to/package.tgz]
//
// Without a tarball it packs one itself (npm pack, which builds the library first).
// The project is made in a temporary folder outside the repository: package.json depending on the
// tarball (vite and vue at the versions of the library's devDependencies), vite.config.js with the
// arao() plugin, index.html, src/main.js with the default and vigojug themes, the playground's
// decks, images and snippets as content, and two tiny decks of its own (so that the project has
// several and / lists them; the second has a duration, the third none). Then, in order:
//   1. npm install
//   2. vite build                      must pass, and write dist/404.html, a copy of index.html
//   3. every deck of src/decks, under the dev server (Vue's own warnings only exist in dev) and
//      under vite preview (the production build): opened at /<name>, walked with ArrowRight
//      until the hash stops changing; any console warning/error or page error fails, and so does
//      a deck with no slides
//   4. the deck selector, under both servers: / lists every deck, each card with its cover drawn
//      in it (a .ar-slide, the second deck's titled by its cover's heading) and the page's URL left
//      as it was; each link (the first followed with the keyboard) opens its deck; the links keep
//      the page's query, and the covers stay covers on /?presenter; ?deck=<name> is moved to
//      /<name>, keeping the rest of the query and the hash; an unknown path, and an unknown
//      ?deck=, show the list with a notice and one warning
//   5. useDeck()'s face, under the dev server, on the second deck: frozen, its refs read-only all
//      the way down, setTheme refuses a name the deck has not (one [arao] warning), and in the
//      presenter view's preview no function acts
//   6. the talk's length, under the dev server, on the second deck (duration="15m"), in the
//      presenter's bar: 1h30 typed with real keys moves no slide and opens no jump menu, and the
//      countdown follows in an audience window too (useDeck()); after an apply from the keyboard,
//      Space moves the slides; an invalid length and one outside 1 min – 24 h show their error and
//      change nothing; after Escape, ArrowRight moves the slides; with the focus on the editor's
//      button no key moves them, and Tab out of the editor closes it; an open editor follows a
//      change made in another presenter window while nothing was typed in it, keeps typed text
//      otherwise, and says so; a reload keeps the length with no other window open, a new audience
//      window takes it, and its reset brings back the deck's 15:00 in every window. On the third
//      deck (no duration): none shown, one set adds the countdown, the reset removes it
//   7. the presenter window, under the dev server: "p" on /<second> opens /<second>?presenter,
//      and the two windows move together, either way; a window of the other deck does not
//   8. createDeckApp's other cases, under the dev server, on a decks folder holding the second deck
//      alone (vite.config.js and src/main.js rewritten for each, and then put back): it opens at /
//      and at its path; createDeckApp({ deckList: 'always' }) lists it at /, with its cover;
//      createDeckApp({ deckList: 'sometimes' }) opens it, with one [arao] warning
//   8. <bin> export                    no --deck: every deck, one PDF each, at its default name
//                                      (exports/<deck>.pdf); each PDF must have (its pages counted
//                                      in the file itself) as many pages as its summary line says
//                                      and as the walk counted steps (per step is the default), and
//                                      a total line all the decks
//   9. <bin> export --deck <name> --per-slide   the one PDF (exports/<deck>-slides.pdf), with as
//                                      many pages as slides
//  10. a site under a sub-path (vite.config.js with base: '/sub/', then put back): vite build writes
//      404.html; under vite preview /sub/ lists every deck at /sub/<name>, /sub/?deck=<name> is
//      moved to /sub/<name>, and the deck opens there; <bin> export --deck <name> prints it
//  11. the CLI's other cases, each on a decks folder of tiny decks of its own (vite.config.js
//      rewritten for each, and put back), with --out <folder> and several decks:
//        --theme vigojug over a deck that lists it and one that does not (a symlink, next to a
//        dotfile deck that must not count): <deck>-vigojug.pdf and <other>.pdf, whose line says it
//        fell back; --theme no deck lists: exit 1 and no PDF; a deck that throws at runtime: the
//        others exported, exit 1; decks that resolve to one file (Alpha in vigojug and
//        alpha-vigojug, Beta and beta): the first kept, the second failed, a warning on the case
// The package name and the CLI's name are read from package.json: nothing here names them.
//
// Environment:
//   ARAO_CHROMIUM=/path/to/chrome   a Chrome/Chromium to use, here and in the export, instead of
//                                   the one Playwright downloads for its version of
//                                   playwright-core (npx playwright-core install chromium)
//   SMOKE_KEEP=1                    keep the temporary project (its path is printed)
// Chromium's own needs (shared libraries, fonts: LD_LIBRARY_PATH, FONTCONFIG_FILE…) pass through
// to the browser and to the export as they are.
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lib = JSON.parse(await readFile(join(repo, 'package.json'), 'utf8'))
const PKG = lib.name
const BIN = typeof lib.bin === 'string' ? PKG.replace(/^@[^/]+\//, '') : Object.keys(lib.bin ?? {})[0]
if (!BIN) throw new Error('package.json has no "bin"')
const CONTENT = ['decks', 'images', 'snippets'] // from the playground's src/
// a deck of the smoke project only: with the playground's, the project has several. MARK, its
// heading, tells it from the others once open. Faces keeps every useDeck() it is handed (one per
// drawing of the deck) in window.__faces, for the face check and the duration check (15 min:
// DURATION, in ms).
const MARK = 'A second deck'
const DURATION = 15 * 60000
const SECOND = ['Second.vue', `<template lang="pug">
Deck(:themes="['default', 'vigojug']" duration="15m")
  Faces
  Slide(layout="cover" title="Second")
    h1 ${MARK}
  Slide
    h2 Picked from the list
    p(v-step="2") Every deck of the project is a link on /.
</template>

<script setup>
import { useDeck } from '${PKG}'
const Faces = { setup: () => ((window.__faces ??= []).push(useDeck()), () => null) }
</script>
`]

// a third deck of the smoke project only, with no duration (the countdown the presenter adds)
const UNTIMED = ['Untimed.vue', `<template lang="pug">
Deck(:themes="['default']")
  Slide(layout="cover" title="Untimed")
    h1 A deck without duration
  Slide
    h2 No countdown
    p(v-step="2") Until the presenter sets one.
</template>
`]

const log = (msg) => console.log(`\n[smoke] ${msg}`)
const pause = (ms) => new Promise((r) => setTimeout(r, ms))
const problems = []
const fail = (msg) => {
  problems.push(msg)
  console.error(`[smoke] FAIL ${msg}`)
}

// runs a command, its output shown as it comes; resolves to { code, out, err } (stdout, stderr)
function exec(cmd, args, cwd) {
  return new Promise((ok, ko) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => {
      out += d
      process.stdout.write(d)
    })
    child.stderr.on('data', (d) => {
      err += d
      process.stderr.write(d)
    })
    child.on('error', ko)
    child.on('close', (code) => ok({ code, out, err }))
  })
}
// the same, failing unless it exits with 0; resolves to its stdout
async function run(cmd, args, cwd) {
  const { code, out } = await exec(cmd, args, cwd)
  if (code !== 0) throw new Error(`${cmd} ${args.join(' ')} exited with ${code}`)
  return out
}

const freePort = () => new Promise((ok, ko) => {
  const s = createServer().once('error', ko).listen(0, '127.0.0.1', () => {
    const { port } = s.address()
    s.close(() => ok(port))
  })
})

let project
let server
let browser
async function cleanup() {
  await browser?.close().catch(() => {})
  if (server && server.exitCode == null) server.kill()
  if (project && !process.env.SMOKE_KEEP) await rm(project, { recursive: true, force: true })
}

try {
  project = await mkdtemp(join(tmpdir(), `${BIN}-smoke-`))
  log(`project: ${project}`)

  // the tarball: the one given, or a fresh one
  let tarball = process.argv[2] && resolve(process.argv[2])
  if (!tarball) {
    log('packing the library')
    await run('npm', ['pack', '--pack-destination', project], repo)
    const packed = (await readdir(project)).find((f) => f.endsWith('.tgz'))
    if (!packed) throw new Error('npm pack made no tarball')
    tarball = join(project, packed)
  }
  await stat(tarball)

  // the slides project, as a user would write it
  const dev = lib.devDependencies ?? {}
  if (!dev.vite || !dev.vue) throw new Error('vite and vue must be devDependencies of the library')
  const files = {
    'package.json': JSON.stringify({
      name: 'smoke-slides',
      private: true,
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build', export: `${BIN} export` },
      dependencies: { [PKG]: `file:${tarball}`, vite: dev.vite, vue: dev.vue },
    }, null, 2),
    'vite.config.js': `import { defineConfig } from 'vite'\nimport arao from '${PKG}/vite'\n\nexport default defineConfig({ plugins: [arao()] })\n`,
    'index.html': `<!doctype html>\n<html lang="en">\n  <head><meta charset="UTF-8" /><title>smoke</title></head>\n  <body>\n    <div id="app"></div>\n    <script type="module" src="/src/main.js"></script>\n  </body>\n</html>\n`,
    'src/main.js': `import { createDeckApp } from '${PKG}'\nimport '${PKG}/themes/default.css'\nimport '${PKG}/themes/vigojug.css'\n\ncreateDeckApp().mount('#app')\n`,
  }
  for (const [name, text] of Object.entries(files)) {
    await mkdir(dirname(join(project, name)), { recursive: true })
    await writeFile(join(project, name), text)
  }
  for (const dir of CONTENT) {
    const from = join(repo, 'playground', 'src', dir)
    if (await stat(from).catch(() => null)) await cp(from, join(project, 'src', dir), { recursive: true })
  }
  await mkdir(join(project, 'src', 'decks'), { recursive: true })
  await writeFile(join(project, 'src', 'decks', SECOND[0]), SECOND[1])
  await writeFile(join(project, 'src', 'decks', UNTIMED[0]), UNTIMED[1])
  const decks = (await readdir(join(project, 'src', 'decks'))).filter((f) => f.endsWith('.vue')).map((f) => basename(f, '.vue'))
  if (decks.length < 2) throw new Error('the project needs two decks or more to test the selector')
  log(`decks: ${decks.join(', ')}`)

  log('npm install')
  await run('npm', ['install', '--no-audit', '--no-fund'], project)

  // the project's own Vite and Playwright, as installed with the package
  const need = createRequire(join(project, 'package.json'))
  const viteJson = need.resolve('vite/package.json')
  const viteBin = join(dirname(viteJson), JSON.parse(await readFile(viteJson, 'utf8')).bin.vite)
  const { chromium } = need('playwright-core')

  // the build's 404.html: a copy of its index.html (static hosts answer a deck's path with it)
  async function notFoundPage(what) {
    const [index, page] = await Promise.all(['index.html', '404.html'].map((f) => readFile(join(project, 'dist', f), 'utf8').catch(() => null)))
    if (page == null) fail(`${what}: no dist/404.html`)
    else if (page !== index) fail(`${what}: dist/404.html is not a copy of dist/index.html`)
  }

  log('vite build')
  await run(process.execPath, [viteBin, 'build'], project)
  await notFoundPage('vite build')

  browser = await chromium.launch({ executablePath: process.env.ARAO_CHROMIUM || undefined })

  // starts the dev server or vite preview; resolves to the site's URL (at the base, if the config
  // has one: sub, 'sub/') once it answers
  async function serve(mode, sub = '') {
    const port = await freePort()
    const args = mode === 'dev' ? [] : ['preview']
    server = spawn(process.execPath, [viteBin, ...args, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: project, stdio: ['ignore', 'ignore', 'inherit'] })
    const url = `http://127.0.0.1:${port}/${sub}`
    for (let i = 0; i < 300; i++) {
      if (server.exitCode != null) throw new Error(`vite ${mode} exited with ${server.exitCode}`)
      if (await fetch(url).then((r) => r.ok, () => false)) return url
      await pause(100)
    }
    throw new Error(`vite ${mode} did not answer at ${url}`)
  }

  async function stop() {
    if (!server || server.exitCode != null) return
    const gone = new Promise((r) => server.once('exit', r))
    server.kill()
    await gone
  }

  // opens a deck and walks it to its end; reports what it saw, and keeps its counts in walked
  const walked = {} // deck → { slides, steps }, the last walk's
  async function walk(base, deck, mode) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    try {
      await page.goto(new URL(encodeURIComponent(deck), base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).catch(() => {})
      const slides = await page.locator('.ar-slide').count()
      if (!slides) complaints.push('no .ar-slide in the page')
      // the hash is #/<slide>/<step>; the walk ends when ArrowRight no longer changes it
      const steps = {}
      const hash = () => page.evaluate(() => location.hash)
      const note = (h) => {
        const [, i, s] = h.match(/^#\/(\d+)\/(\d+)/) || []
        if (i) steps[i] = Math.max(steps[i] ?? 0, Number(s))
      }
      // a deck opened without a hash is at its first slide, first step, and writes no hash until it moves
      await pause(300)
      let at = await hash()
      note(/^#\/\d+\/\d+/.test(at) ? at : '#/1/1')
      for (let presses = 0; presses < 2000; presses++) {
        await page.keyboard.press('ArrowRight')
        const next = await page.waitForFunction((was) => location.hash !== was, at, { timeout: 1500, polling: 25 })
          .then(hash, () => null)
        if (!next) break
        note((at = next))
      }
      const per = Object.entries(steps).map(([i, s]) => `${i}:${s}`).join(' ')
      console.log(`  ${mode} /${deck}: ${slides} slides, ended at ${at}; steps per slide ${per}`)
      if (slides && Object.keys(steps).length !== slides)
        complaints.push(`the walk visited ${Object.keys(steps).length} slides of ${slides}`)
      walked[deck] = { slides, steps: Object.values(steps).reduce((a, b) => a + b, 0) }
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`${mode} /${deck}: ${c}`)
  }

  // the deck selector: / lists every deck, a card each with its cover drawn in it (the page's URL
  // left as it was), and each link opens its deck; on /?<query> each link keeps the query (not the
  // hash) and the covers are still covers; ?deck=<name> is moved to /<name>; an unknown path or
  // ?deck= shows the list too, with a warning naming it (the only console message expected here).
  // base is the site's URL: / or a sub-path, which every path here is under.
  async function selector(base, mode) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const complaints = []
    let expected = null // the one warning the page may give
    page.on('console', (m) => {
      if (!['warning', 'error'].includes(m.type())) return
      if (expected && m.type() === 'warning' && m.text().includes(expected)) return void (expected = null)
      complaints.push(`console ${m.type()}: ${m.text()}`)
    })
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const site = new URL(base).pathname
    const links = page.locator('.ar-decks a.ar-decks-link')
    const listed = async (where, query = '') => {
      await links.first().waitFor({ timeout: 30_000 }).catch(() => {})
      const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))
      const want = decks.map((d) => `${site}${encodeURIComponent(d.toLowerCase())}${query}`).sort()
      if (JSON.stringify([...hrefs].sort()) !== JSON.stringify(want))
        complaints.push(`${where}: the list links to ${hrefs.join(', ') || 'nothing'}, not to ${want.join(', ')}`)
      return hrefs
    }
    // every card has its deck's cover drawn in it, the second deck's card is titled by its cover's
    // heading, and the page is where it was
    const covers = async (where) => {
      const was = await page.evaluate(() => location.href)
      const drawn = await page.waitForFunction((n) => {
        const cards = [...document.querySelectorAll('.ar-decks-card')]
        return cards.length === n && cards.every((c) => c.querySelector('.ar-thumb .ar-slide'))
      }, decks.length, { timeout: 30_000 }).then(() => true, () => false)
      if (!drawn) complaints.push(`${where}: not every card has its cover drawn in it (.ar-thumb .ar-slide)`)
      const titled = await page.waitForFunction((mark) => [...document.querySelectorAll('.ar-decks-title')].some((t) => t.textContent.trim() === mark), MARK, { timeout: 10_000 })
        .then(() => true, () => false)
      if (!titled) complaints.push(`${where}: no card titled "${MARK}", the second deck's cover heading (${(await page.locator('.ar-decks-title').allTextContents()).join(', ')})`)
      if (await page.locator('.ar-decks :is(.ar-presenter, .ar-controls, .ar-export)').count()) complaints.push(`${where}: a cover is drawn as something else than a thumbnail`)
      await pause(300)
      const is = await page.evaluate(() => location.href)
      if (is !== was) complaints.push(`${where}: the covers moved the page from ${was} to ${is}`)
      return drawn
    }
    // follows a link of the list; the deck must open at its path and query
    const opens = async (href, how) => {
      await page.waitForURL((u) => u.pathname + u.search === href, { timeout: 30_000 }).catch(() => {})
      const slides = await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).then(() => true, () => false)
      const at = await page.evaluate(() => location.pathname + location.search)
      if (at !== href || !slides) complaints.push(`${how} ${href}: landed on ${at}${slides ? '' : ', with no slides'}`)
    }
    try {
      await page.goto(base)
      const hrefs = await listed(site)
      const drawn = await covers(site)
      console.log(`  ${mode} ${site}: ${hrefs.length} decks listed (${hrefs.join(' ')})${drawn ? ', every cover drawn' : ''}`)
      for (const [i, href] of hrefs.entries()) {
        if (i) await page.goto(base)
        await links.first().waitFor({ timeout: 30_000 }).catch(() => {})
        if (i === 0) {
          // the keyboard alone: Tab reaches the first link, Enter follows it
          await page.keyboard.press('Tab')
          const focused = await page.evaluate(() => document.activeElement?.getAttribute('href'))
          if (focused !== href) complaints.push(`Tab focuses ${focused ?? 'nothing'}, not the first link (${href})`)
          await page.keyboard.press('Enter')
          await opens(href, 'Enter on')
        } else {
          await page.locator(`.ar-decks a[href="${href}"]`).click()
          await opens(href, 'a click on')
        }
      }
      // the links keep the query, not the hash; the covers stay covers
      const query = 'theme=vigojug&presenter'
      await page.goto(new URL(`?${query}#/2/1`, base).href)
      await listed(`${site}?${query}#/2/1`, `?${query}`)
      await covers(`${site}?${query}#/2/1`)
      // the old form: moved to the path, with the rest of the query and the hash (and the name as
      // the list writes it)
      const old = `?deck=${second.toUpperCase()}&theme=vigojug#/2/1`
      await page.goto(new URL(old, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).catch(() => {})
      await pause(300)
      const moved = await page.evaluate(() => location.pathname + location.search + location.hash)
      const meant = `${site}${second}?theme=vigojug#/2/1`
      if (moved !== meant) complaints.push(`${site}${old}: at ${moved}, not ${meant}`)
      const heading = await page.locator('.ar-slide:visible h2').first().textContent({ timeout: 5_000 }).catch(() => '')
      if (!heading.includes('Picked from the list')) complaints.push(`${site}${old}: not on the second deck's slide 2 (${heading || 'no heading'})`)
      // a name that is no deck, as a path and in the old form: the list, with a notice and a warning
      for (const [path, name] of [['no-such-deck', 'no-such-deck'], ['?deck=nor-this-one', 'nor-this-one']]) {
        expected = `"${name}"`
        await page.goto(new URL(path, base).href)
        await listed(`${site}${path}`)
        const notice = (await page.locator('.ar-decks [role="alert"]').textContent({ timeout: 5_000 }).catch(() => null)) ?? ''
        if (!notice.includes(name)) complaints.push(`${site}${path}: no notice naming it above the list`)
        const at = await page.evaluate(() => location.pathname)
        if (at !== site + name) complaints.push(`${site}${path}: at ${at}, not ${site + name}`)
        await pause(300)
        if (expected) complaints.push(`${site}${path}: no console warning naming it`)
        expected = null
      }
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`${mode} selector: ${c}`)
  }

  // useDeck()'s face, on the second deck (window.__faces): every write through it is refused
  // (Vue's own warnings about them are expected; any other warning, error or page error fails),
  // setTheme of a name the deck has not gives one [arao] warning and changes nothing, and the
  // preview's functions do nothing (no move, no theme, no fullscreen, no window)
  async function face(base) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const complaints = []
    const arao = []
    page.on('console', (m) => {
      if (!['warning', 'error'].includes(m.type())) return
      if (m.type() === 'warning' && m.text().startsWith('[arao]')) arao.push(m.text())
      else if (!/failed: (target|computed value) is readonly/.test(m.text())) complaints.push(`console ${m.type()}: ${m.text()}`)
    })
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    context.on('page', () => complaints.push('the preview opened a window'))
    const open = async (query) => {
      await page.goto(new URL(`${second}${query}`, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
    }
    try {
      await open('')
      const audience = await page.evaluate(() => {
        const d = window.__faces[0]
        const read = () => JSON.stringify([d.theme.value, d.themes.value, d.timer.value, d.duration.value])
        const was = read()
        const writes = [() => (d.go = null), () => d.themes.value.push('x'), () => (d.timer.value.state = 'x'), () => (d.theme.value = 'x'), () => (d.duration.value = 1)]
        for (const write of writes) try { write() } catch {}
        d.setTheme('no-such-theme')
        return { frozen: Object.isFrozen(d), go: typeof d.go, same: was === read() }
      })
      if (!audience.frozen || audience.go !== 'function') complaints.push('the face is not frozen')
      if (!audience.same) complaints.push('a write through the face changed the deck')
      if (arao.length !== 1 || !arao[0].includes('no-such-theme')) complaints.push(`setTheme of an unknown name: ${arao.length} [arao] warnings, not 1`)
      await open('?presenter')
      const preview = await page.evaluate(() => {
        const d = window.__faces.find((f) => f.role === 'preview')
        const was = location.href + d.theme.value
        d.go(1), d.next(), d.setTheme(d.themes.value[1]), d.toggleFullscreen(), d.openPresenter()
        return { frozen: Object.isFrozen(d), same: was === location.href + d.theme.value && !document.fullscreenElement }
      })
      await pause(300)
      if (!preview.frozen) complaints.push(`the preview's face is not frozen`)
      if (!preview.same) complaints.push(`a function of the preview's face acted`)
      console.log(`  dev useDeck() face: ${complaints.length ? 'problems below' : 'frozen, read-only, inert in the preview'}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev useDeck() face: ${c}`)
  }

  // the talk's length, on the second deck (duration="15m") and the third (none): edited in the
  // presenter view's bar, in a browser context of its own (its windows share a channel and
  // sessionStorage like the tabs of one browser); any console warning, error or page error fails
  async function duration(base) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const complaints = []
    const open = async (query, who, deck = second) => {
      const page = await context.newPage()
      page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`${who}: console ${m.type()}: ${m.text()}`))
      page.on('pageerror', (e) => complaints.push(`${who}: page error: ${e.message}`))
      await page.goto(new URL(`${deck}${query.replace(/^&/, '?')}`, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
      return page
    }
    // ms as the bar writes it (core/timer.js clock): 1:30:00, 20:00
    const clock = (ms) => {
      const t = Math.floor(ms / 1000)
      const [h, m, sec] = [Math.floor(t / 3600), Math.floor(t / 60) % 60, String(t % 60).padStart(2, '0')]
      return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
    }
    // the presenter's bar shows the length on its button, the time left under the timer, and
    // marks a length that is not the deck's (.changed); no length (ms null): "duración" and no
    // time left. Waits for it, says what it saw otherwise
    const shows = async (page, ms, changed, when) => {
      const want = { button: ms ? clock(ms) : 'duración', left: ms ? `quedan ${clock(ms)}` : null, changed }
      const read = () => page.evaluate(() => ({
        button: document.querySelector('.ar-p-dur')?.textContent.trim(),
        left: document.querySelector('.ar-p-sub')?.textContent.match(/quedan [\d:]+/)?.[0] ?? null,
        changed: !!document.querySelector('.ar-p-dur.changed'),
      }))
      const ok = await page.waitForFunction((w) => {
        const b = document.querySelector('.ar-p-dur')
        const sub = document.querySelector('.ar-p-sub')?.textContent ?? ''
        return b?.textContent.trim() === w.button && (w.left ? sub.includes(w.left) : !sub.includes('quedan'))
          && b.classList.contains('changed') === w.changed
      }, want, { timeout: 5_000 }).then(() => true, () => false)
      if (!ok) complaints.push(`${when}: the bar shows ${JSON.stringify(await read())}, not ${JSON.stringify(want)}`)
    }
    // every face of the audience window reads the length (useDeck().duration)
    const hears = async (page, ms, when) => {
      const ok = await page.waitForFunction((w) => window.__faces?.length && window.__faces.every((f) => f.duration.value === w), ms, { timeout: 5_000 }).then(() => true, () => false)
      if (!ok) complaints.push(`${when}: the audience reads ${await page.evaluate(() => JSON.stringify(window.__faces?.map((f) => f.duration.value)))}, not ${ms}`)
    }
    const editor = (page) => page.locator('.ar-p-edit')
    const input = (page) => page.locator('.ar-p-edit input')
    const isOpen = async (page) => (await editor(page).count()) > 0
    const focusOn = (page, selector) => page.evaluate((s) => !!document.activeElement?.matches(s), selector)
    const hash = (page) => page.evaluate(() => location.hash)
    // a key that must move the slides (the hash changes); the timer is then put back to idle, so
    // the time left reads the whole length again
    const moves = async (page, key, when) => {
      const was = await hash(page)
      await page.keyboard.press(key)
      const ok = await page.waitForFunction((h) => location.hash !== h, was, { timeout: 2_000 }).then(() => true, () => false)
      if (!ok) complaints.push(`${when}: ${key} did not move the slides (still at ${was || '#/1/1'})`)
      const rewind = page.locator('.ar-p-timer > button').nth(1)
      if (await rewind.isEnabled()) await rewind.click()
    }
    // keys that must move nothing: the hash stays, and no jump menu opens
    const still = async (page, keys, when) => {
      const was = await hash(page)
      await keys()
      await pause(200)
      const at = await hash(page)
      if (at !== was) complaints.push(`${when}: the slides moved (${was || '#/1/1'} → ${at})`)
      if (await page.locator('.ar-slides').count()) complaints.push(`${when}: the jump menu opened`)
    }
    const error = async (page, has, when) => {
      const msg = await page.locator('.ar-p-edit-msg.bad').textContent({ timeout: 2_000 }).catch(() => '')
      const invalid = await page.locator('.ar-p-edit input[aria-invalid="true"]').count()
      if (!has.every((h) => msg.includes(h)) || !invalid) complaints.push(`${when}: no inline error with ${has.join(', ')} (${JSON.stringify(msg)})`)
    }
    try {
      const presenter = await open('&presenter', 'presenter')
      let audience = await open('', 'audience')
      await shows(presenter, DURATION, false, 'opened')
      await hears(audience, DURATION, 'opened')

      // with the mouse, then real keys: 1h30 types into the field (its digits open no jump menu,
      // nothing moves), Enter applies
      await presenter.click('.ar-p-dur')
      await still(presenter, () => presenter.keyboard.type('1h30'), 'typing 1h30')
      const typed = await input(presenter).inputValue().catch(() => null)
      if (typed !== '1h30') complaints.push(`typing 1h30: the field holds ${JSON.stringify(typed)}`)
      await still(presenter, () => presenter.keyboard.press('Enter'), 'Enter on 1h30')
      await shows(presenter, 90 * 60000, true, 'set to 1h30')
      if (await isOpen(presenter)) complaints.push('set to 1h30: the editor is still open')
      await hears(audience, 90 * 60000, 'set to 1h30')

      // with the keyboard alone: focus the button, Enter opens with the input focused; 20m, Enter
      // applies, and the focus rests next to the button (not on it): Space moves the slides
      const set = 20 * 60000
      await presenter.locator('.ar-p-dur').focus()
      await presenter.keyboard.press('Enter')
      if (!(await focusOn(presenter, '.ar-p-edit input'))) complaints.push('Enter on the length button: the input does not have the focus')
      await presenter.keyboard.type('20m')
      await presenter.keyboard.press('Enter')
      await shows(presenter, set, true, 'set to 20m from the keyboard')
      if (!(await focusOn(presenter, '.ar-p-length'))) complaints.push('an apply from the keyboard: the focus is not on the length group')
      await moves(presenter, ' ', 'Space after an apply from the keyboard')
      if (await isOpen(presenter)) complaints.push('Space after an apply from the keyboard: the editor opened again')

      // an invalid length shows its error and keeps the editor; Escape cancels, the focus on the
      // length group again, and ArrowRight moves the slides
      await presenter.locator('.ar-p-dur').focus()
      await presenter.keyboard.press('Enter')
      await presenter.keyboard.type('abc')
      await presenter.keyboard.press('Enter')
      await error(presenter, ['abc'], 'an invalid length')
      await presenter.keyboard.press('Escape')
      if (await isOpen(presenter)) complaints.push('Escape: the editor is still open')
      if (!(await focusOn(presenter, '.ar-p-length'))) complaints.push('Escape: the focus is not on the length group')
      await shows(presenter, set, true, 'after an invalid length and Escape')
      await moves(presenter, 'ArrowRight', 'ArrowRight after Escape')
      await moves(presenter, 'Home', 'Home') // back to the start: the keys below would move it

      // out of bounds (1 min – 24 h): an error each, nothing changes
      await presenter.click('.ar-p-dur')
      await input(presenter).fill('30s')
      await presenter.keyboard.press('Enter')
      await error(presenter, ['30s', '1 minuto'], 'a length under a minute')
      await input(presenter).fill('25h')
      await presenter.keyboard.press('Enter')
      await error(presenter, ['25h', '24 horas'], 'a length over 24 hours')
      if (!(await isOpen(presenter))) complaints.push('a length out of bounds: the editor closed')

      // the focus on the editor's button (Tab from the field): no key moves the slides; Tab past
      // its last button closes it, applying nothing
      await input(presenter).focus()
      await presenter.keyboard.press('Tab')
      if (!(await focusOn(presenter, '.ar-p-edit button'))) complaints.push('Tab from the field: the focus is not on a button of the editor')
      await still(presenter, () => presenter.keyboard.press('ArrowRight'), 'ArrowRight on the editor\'s button')
      if (!(await isOpen(presenter))) complaints.push('ArrowRight on the editor\'s button: the editor closed')
      for (let i = 0; i < 4 && (await presenter.evaluate(() => !!document.activeElement?.closest('.ar-p-edit'))); i++) await presenter.keyboard.press('Tab')
      await pause(100)
      if (await isOpen(presenter)) complaints.push('Tab out of the editor: it is still open')
      await shows(presenter, set, true, 'after Tab out of the editor')

      // a change from another presenter window while the editor is open: the field follows it
      // while nothing was typed, typed text stays; a notice says so either way
      const other = await open('&presenter', 'presenter 2')
      const elsewhere = async (text) => {
        await other.click('.ar-p-dur')
        await input(other).fill(text)
        await other.keyboard.press('Enter')
      }
      await presenter.click('.ar-p-dur')
      await elsewhere('25m')
      const follows = await presenter.waitForFunction(() => document.querySelector('.ar-p-edit input')?.value === '25:00'
        && document.querySelector('.ar-p-edit-note')?.textContent.includes('25:00'), null, { timeout: 5_000 }).then(() => true, () => false)
      if (!follows) complaints.push('a change elsewhere, nothing typed: the open field does not follow it with a notice')
      await input(presenter).fill('40m')
      await elsewhere('30m')
      const keeps = await presenter.waitForFunction(() => document.querySelector('.ar-p-edit input')?.value === '40m'
        && document.querySelector('.ar-p-edit-note')?.textContent.includes('30:00'), null, { timeout: 5_000 }).then(() => true, () => false)
      if (!keeps) complaints.push('a change elsewhere over typed text: the field does not keep it with a notice')
      await presenter.keyboard.press('Escape')
      await other.close()
      const later = 30 * 60000
      await shows(presenter, later, true, 'set to 30m in another window')

      // a reload with no other window open keeps it; a new audience window takes it
      await audience.close()
      await presenter.reload()
      await presenter.waitForSelector('.ar-p-dur', { timeout: 30_000 })
      await shows(presenter, later, true, 'reloaded alone')
      audience = await open('', 'audience')
      await hears(audience, later, 'a new audience window')

      // back to the deck's
      await presenter.click('.ar-p-dur')
      await presenter.click('.ar-p-reset')
      await shows(presenter, DURATION, false, 'reset')
      await hears(audience, DURATION, 'reset')
      await presenter.close()
      await audience.close()

      // a deck with no duration: none shown; one set adds the countdown, the reset removes it
      const plain = await open('&presenter', 'presenter (no duration)', untimed)
      await shows(plain, null, false, 'no duration: opened')
      await plain.click('.ar-p-dur')
      await input(plain).fill('10m')
      await plain.keyboard.press('Enter')
      await shows(plain, 10 * 60000, true, 'no duration: set to 10m')
      await plain.click('.ar-p-dur')
      const offer = (await plain.locator('.ar-p-reset').textContent({ timeout: 2_000 }).catch(() => '')).trim()
      if (!offer.includes('Quitar')) complaints.push(`no duration: the reset offers ${JSON.stringify(offer)}`)
      await plain.click('.ar-p-reset')
      await shows(plain, null, false, 'no duration: reset')
      console.log(`  dev duration: ${complaints.length ? 'problems below' : '15:00 → 1h30, 20m (keys), 30m (another window) in every window, kept on reload, reset to 15:00; none → 10m → none'}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev duration: ${c}`)
  }


  // the presenter window: "p" in the audience's window opens the deck's path with ?presenter, and
  // the two move together, either way; a window of another deck stays where it is
  async function presenter(base) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const complaints = []
    context.on('page', (p) => {
      p.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
      p.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    })
    // where a window stands (no hash: the first step), and waiting for it to stand somewhere
    const at = (p) => p.evaluate(() => location.hash || '#/1/1')
    const reaches = (p, hash) => p.waitForFunction((h) => (location.hash || '#/1/1') === h, hash, { timeout: 5_000 }).then(() => true, () => false)
    const opened = async (p, path) => {
      await p.goto(new URL(path, base).href)
      await p.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
    }
    try {
      const audience = await context.newPage()
      await opened(audience, second)
      const [win] = await Promise.all([context.waitForEvent('page', { timeout: 10_000 }), audience.keyboard.press('p')])
      await win.waitForSelector('.ar-presenter', { timeout: 30_000 })
      await pause(500)
      const url = new URL(win.url())
      if (url.pathname !== new URL(second, base).pathname || !url.searchParams.has('presenter'))
        complaints.push(`"p" opened ${url.pathname}${url.search}, not /${second}?presenter`)
      await audience.keyboard.press('ArrowRight')
      const one = await at(audience)
      if (one === '#/1/1') complaints.push('ArrowRight did not move the audience')
      else if (!(await reaches(win, one))) complaints.push(`the presenter window did not follow the audience to ${one} (at ${await at(win)})`)
      await win.keyboard.press('ArrowRight')
      const two = await at(win)
      if (two === one) complaints.push('ArrowRight did not move the presenter window')
      else if (!(await reaches(audience, two))) complaints.push(`the audience did not follow the presenter window to ${two} (at ${await at(audience)})`)
      const stranger = await context.newPage()
      await opened(stranger, encodeURIComponent(other))
      await audience.keyboard.press('ArrowLeft')
      await reaches(win, await at(audience))
      await pause(300)
      if ((await at(stranger)) !== '#/1/1') complaints.push(`/${other} moved along with /${second}: at ${await at(stranger)}`)
      console.log(`  dev presenter window: ${complaints.length ? 'problems below' : `${url.pathname}${url.search}, in step both ways; /${other} apart`}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev presenter window: ${c}`)
  }

  const second = basename(SECOND[0], '.vue').toLowerCase()
  const untimed = basename(UNTIMED[0], '.vue').toLowerCase()
  const other = decks.find((d) => d.toLowerCase() !== second && d.toLowerCase() !== untimed)
  for (const mode of ['dev', 'preview']) {
    log(`walking the decks under vite ${mode}`)
    const base = await serve(mode)
    try {
      // the dev server may optimise dependencies on the first visit and reload: let it settle
      if (mode === 'dev') {
        const warm = await browser.newPage()
        await warm.goto(base)
        await warm.waitForLoadState('networkidle').catch(() => {})
        await pause(1000)
        await warm.close()
      }
      for (const deck of decks) await walk(base, deck, mode)
      await selector(base, mode)
      if (mode === 'dev') {
        await face(base)
        await duration(base)
        await presenter(base)
      }
    } finally {
      await stop()
    }
  }

  // createDeckApp's other cases: the project's own files rewritten for each one, the dev server
  // started on them (Vue's warnings only exist in dev, and no build is needed), and put back.
  // Each visit opens a path and expects the second deck (`deck`) or the list (`list`: so many
  // decks, each with its cover); `warns`: the one [arao] warning the page must give.
  const solo = 'src/solo' // a decks folder holding the second deck alone
  const asIs = { 'src/main.js': files['src/main.js'], 'vite.config.js': files['vite.config.js'] }
  const alone = asIs['vite.config.js'].replace('arao()', `arao({ decks: '${solo}' })`)
  const withOptions = (o) => asIs['src/main.js'].replace('createDeckApp()', `createDeckApp(${o})`)
  const variants = [
    { name: 'one deck', files: { 'vite.config.js': alone },
      visits: [{ path: '', deck: true }, { path: second, deck: true }] },
    { name: `one deck, createDeckApp({ deckList: 'always' })`, files: { 'vite.config.js': alone, 'src/main.js': withOptions(`{ deckList: 'always' }`) },
      visits: [{ path: '', list: 1 }, { path: second, deck: true }] },
    { name: `one deck, createDeckApp({ deckList: 'sometimes' })`, files: { 'vite.config.js': alone, 'src/main.js': withOptions(`{ deckList: 'sometimes' }`) },
      visits: [{ path: '', deck: true, warns: 'deckList' }] },
  ]

  async function visit(base, variant, { path, deck, list, warns }) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const complaints = []
    let expected = warns // the one warning the page may give
    page.on('console', (m) => {
      if (!['warning', 'error'].includes(m.type())) return
      if (expected && m.type() === 'warning' && m.text().startsWith('[arao]') && m.text().includes(expected)) return void (expected = null)
      complaints.push(`console ${m.type()}: ${m.text()}`)
    })
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    try {
      await page.goto(new URL(path, base).href)
      if (deck) {
        const slides = await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).then(() => true, () => false)
        const isSecond = (await page.locator('.ar-slide h1', { hasText: MARK }).count()) > 0
        if (!slides || (await page.locator('.ar-decks').count())) complaints.push('no deck opened')
        else if (!isSecond) complaints.push('opened another deck, not the second')
      } else {
        await page.locator('.ar-decks-card').first().waitFor({ timeout: 30_000 }).catch(() => {})
        const cards = await page.locator('.ar-decks-card').count()
        if (cards !== list) complaints.push(`the list has ${cards} decks, not ${list}`)
        const drawn = await page.waitForFunction((n) => document.querySelectorAll('.ar-decks-card .ar-thumb .ar-slide').length >= n, list, { timeout: 30_000 })
          .then(() => true, () => false)
        if (!drawn) complaints.push('a card has no cover drawn in it')
      }
      await pause(300) // late warnings
      if (expected) complaints.push(`no [arao] console warning naming ${expected}`)
      console.log(`  dev ${variant.name}, /${path}: ${deck ? 'the deck' : 'the list'}${complaints.length ? ' (problems below)' : ''}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev ${variant.name}, /${path}: ${c}`)
  }

  log(`createDeckApp's other cases under vite dev`)
  await mkdir(join(project, solo), { recursive: true })
  await writeFile(join(project, solo, SECOND[0]), SECOND[1])
  try {
    for (const variant of variants) {
      for (const [name, text] of Object.entries({ ...asIs, ...variant.files })) await writeFile(join(project, name), text)
      const base = await serve('dev')
      try {
        for (const v of variant.visits) await visit(base, variant, v)
      } finally {
        await stop()
      }
    }
  } finally {
    for (const [name, text] of Object.entries(asIs)) await writeFile(join(project, name), text)
    await rm(join(project, solo), { recursive: true, force: true })
  }

  // the summary line of a PDF: "<path>: <pages> pages (<slides> slides, <steps> steps), …"
  const summary = (said, file) => {
    const line = said.split('\n').find((l) => l.startsWith(`${file}: `))
    const [, pages, slides, steps] = line?.match(/: (\d+) pages \((\d+) slides, (\d+) steps\)/) ?? []
    return line && { pages: Number(pages), slides: Number(slides), steps: Number(steps) }
  }
  const pdfAt = async (file) => ((await stat(join(project, file)).catch(() => null))?.size ?? 0) > 0
  // the pages of a PDF, counted in the file (its /Type /Page objects), not taken from the CLI;
  // 0 if there is no file
  const pagesIn = async (file) => {
    const bytes = await readFile(join(project, file)).catch(() => null)
    return bytes ? (bytes.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length : 0
  }

  log(`${BIN} export (every deck, per step)`)
  let said = null
  try {
    said = await run('npx', ['--no-install', BIN, 'export'], project)
  } catch (e) {
    fail(`export of every deck: ${e.message}`)
  }
  if (said != null) {
    for (const deck of decks) {
      const file = `exports/${deck.toLowerCase()}.pdf`
      const got = summary(said, file)
      const pages = await pagesIn(file)
      if (!(await pdfAt(file))) fail(`export of every deck: no PDF at ${file}`)
      else if (!got) fail(`export of every deck: no summary line for ${file}`)
      else if (!(pages > 0) || pages !== got.pages || pages !== got.steps) fail(`export of every deck: ${file} has ${pages} pages (its line says ${got.pages}) for ${got.steps} steps`)
      else if (walked[deck] && pages !== walked[deck].steps) fail(`export of every deck: ${file} has ${pages} pages, the walk counted ${walked[deck].steps} steps`)
    }
    if (!new RegExp(`^${decks.length} of ${decks.length} decks exported, \\d+ pages`, 'm').test(said))
      fail(`export of every deck: no total line for ${decks.length} decks`)
  }

  const one = decks[0]
  log(`${BIN} export --deck ${one} --per-slide`)
  try {
    said = await run('npx', ['--no-install', BIN, 'export', '--deck', one, '--per-slide'], project)
    const file = `exports/${one.toLowerCase()}-slides.pdf`
    const got = summary(said, file)
    const pages = await pagesIn(file)
    if (!(await pdfAt(file))) fail(`export --per-slide: no PDF at ${file}`)
    else if (!got) fail(`export --per-slide: no summary line for ${file}`)
    else if (!(pages > 0) || pages !== got.pages || pages !== got.slides) fail(`export --per-slide: ${file} has ${pages} pages (its line says ${got.pages}) for ${got.slides} slides`)
    else if (walked[one] && pages !== walked[one].slides) fail(`export --per-slide: ${file} has ${pages} pages, the walk counted ${walked[one].slides} slides`)
  } catch (e) {
    fail(`export --per-slide of ${one}: ${e.message}`)
  }

  // a site under a sub-path: the same project with base '/sub/', built and served by vite
  // preview there, its list, a deck and its export
  log(`a site under /sub/: vite build, vite preview, ${BIN} export`)
  const deckName = basename(SECOND[0], '.vue')
  await writeFile(join(project, 'vite.config.js'), asIs['vite.config.js'].replace('defineConfig({', "defineConfig({ base: '/sub/',"))
  try {
    await run(process.execPath, [viteBin, 'build'], project)
    await notFoundPage('vite build under /sub/')
    const base = await serve('preview', 'sub/')
    try {
      await selector(base, 'preview (base /sub/)')
      await walk(base, deckName, 'preview (base /sub/)')
    } finally {
      await stop()
    }
    const file = `sub/${second}.pdf`
    const out = await run('npx', ['--no-install', BIN, 'export', '--deck', second, '--out', 'sub/'], project)
    const got = summary(out, file)
    const pages = await pagesIn(file)
    if (!got || !(pages > 0) || pages !== got.pages || (walked[deckName] && pages !== walked[deckName].steps))
      fail(`export under /sub/: ${file} has ${pages} pages (${got ? `its line says ${got.pages}` : 'no summary line'}; the walk counted ${walked[deckName]?.steps} steps)`)
  } catch (e) {
    fail(`a site under /sub/: ${e.message}`)
  } finally {
    await writeFile(join(project, 'vite.config.js'), asIs['vite.config.js'])
  }

  // the CLI's other cases: each a decks folder of tiny decks (src/cases/<case>), vite.config.js
  // pointed at it, one export into a folder of its own (--out <case>/)
  const tiny = (title, themes, script = '') => `<template lang="pug">
Deck(:themes="${JSON.stringify(themes).replace(/"/g, "'")}")
  Slide(layout="cover" title="${title}")
    h1 ${title}
  Slide
    h2 Two steps
    p(v-step="2") The second.
</template>
${script}`
  const THROWS = `<script setup>
setTimeout(() => { throw new Error('smoke: this deck throws at runtime') })
</script>
`
  const cases = [
    { name: 'theme', args: ['--theme', 'vigojug'],
      files: { 'Second.vue': tiny('Second', ['default']), '.Hidden.vue': tiny('Hidden', ['default', 'vigojug']) },
      link: { 'Third.vue': tiny('Third', ['default', 'vigojug']) },
      code: 0, pdfs: { 'third-vigojug.pdf': 3, 'second.pdf': 3 },
      lines: [/^theme\/second\.pdf: .*theme default \(it does not list vigojug/m, /^theme\/third-vigojug\.pdf: .*theme vigojug$/m, /^2 of 2 decks exported, 6 pages$/m] },
    { name: 'typo', args: ['--theme', 'nosuch'],
      files: { 'Second.vue': tiny('Second', ['default']), 'Third.vue': tiny('Third', ['default', 'vigojug']) },
      code: 1, pdfs: {}, errs: [/no deck lists the theme "nosuch"/] },
    { name: 'partial', args: [],
      files: { 'Broken.vue': tiny('Broken', ['default'], THROWS), 'Second.vue': tiny('Second', ['default']), 'Third.vue': tiny('Third', ['default']) },
      code: 1, pdfs: { 'second.pdf': 3, 'third.pdf': 3 },
      lines: [/^2 of 3 decks exported, 6 pages; failed: Broken$/m], errs: [/Broken: the deck threw before its pages were ready: .*smoke: this deck throws/] },
    { name: 'clash', args: ['--theme', 'vigojug'],
      files: { 'Alpha.vue': tiny('Alpha', ['default', 'vigojug']), 'alpha-vigojug.vue': tiny('Not Alpha', ['default']),
        'Beta.vue': tiny('Beta', ['default']), 'beta.vue': tiny('Beta again', ['default']) },
      code: 1, pdfs: { 'alpha-vigojug.pdf': 3, 'beta.pdf': 3 },
      lines: [/^clash\/alpha-vigojug\.pdf: .*theme vigojug$/m, /^2 of 4 decks exported, 6 pages; failed: alpha-vigojug, beta$/m],
      errs: [/differ only in case.*Beta and beta/, /alpha-vigojug: clash\/alpha-vigojug\.pdf is Alpha's, written in this run: not overwritten/, /beta: clash\/beta\.pdf is Beta's/] },
  ]
  try {
    for (const c of cases) {
      log(`${BIN} export ${[...c.args, '--out', `${c.name}/`].join(' ')} (${c.name})`)
      const folder = `src/cases/${c.name}`
      await mkdir(join(project, folder), { recursive: true })
      for (const [name, text] of Object.entries(c.files)) await writeFile(join(project, folder, name), text)
      // a deck that is a symlink to a file elsewhere: the app's glob takes it, so must the CLI
      for (const [name, text] of Object.entries(c.link ?? {})) {
        await writeFile(join(project, 'src/cases', name), text)
        await symlink(join(project, 'src/cases', name), join(project, folder, name))
      }
      await writeFile(join(project, 'vite.config.js'), asIs['vite.config.js'].replace('arao()', `arao({ decks: '${folder}' })`))
      const { code, out, err } = await exec('npx', ['--no-install', BIN, 'export', ...c.args, '--out', `${c.name}/`], project)
      const what = `export (${c.name})`
      if (code !== c.code) fail(`${what}: exited with ${code}, not ${c.code}`)
      for (const [file, want] of Object.entries(c.pdfs)) {
        const pages = await pagesIn(`${c.name}/${file}`)
        if (pages !== want) fail(`${what}: ${c.name}/${file} has ${pages} pages, not ${want}`)
      }
      const made = (await readdir(join(project, c.name)).catch(() => [])).filter((f) => !(f in c.pdfs))
      if (made.length) fail(`${what}: unexpected files in ${c.name}/: ${made.join(', ')}`)
      for (const re of c.lines ?? []) if (!re.test(out)) fail(`${what}: no line matching ${re} in its output`)
      for (const re of c.errs ?? []) if (!re.test(err)) fail(`${what}: no message matching ${re} on its stderr`)
    }
  } finally {
    await writeFile(join(project, 'vite.config.js'), asIs['vite.config.js'])
  }
} catch (e) {
  fail(e.stack ?? String(e))
} finally {
  await cleanup()
}

if (problems.length) {
  console.error(`\n[smoke] ${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join('\n')}`)
  process.exit(1)
}
console.log(`\n[smoke] OK: ${PKG} installs, builds, runs its decks clean at their paths (also under a sub-path), lists them with their covers and exports them`)
