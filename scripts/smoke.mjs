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
// decks, images and snippets as content, and a second, tiny deck of its own (so that the project
// has several and / lists them). Then, in order:
//   1. npm install
//   2. vite build                      must pass
//   3. every deck of src/decks, under the dev server (Vue's own warnings only exist in dev) and
//      under vite preview (the production build): opened at ?deck=<name>, walked with ArrowRight
//      until the hash stops changing; any console warning/error or page error fails, and so does
//      a deck with no slides
//   4. the deck selector, under both servers: / lists every deck, each link (the first followed
//      with the keyboard) opens its deck, the links keep the page's other query parameters, and an
//      unknown ?deck= shows the list with one warning
//   5. useDeck()'s face, under the dev server, on the second deck: frozen, its refs read-only all
//      the way down, setTheme refuses a name the deck has not (one [arao] warning), and in the
//      presenter view's preview no function acts
//   6. the talk's length, under the dev server, on the second deck (duration="15m"): set to 20m in
//      the presenter's bar, the countdown follows and an audience window gets it (useDeck());
//      an invalid one shows its error and changes nothing, the keyboard alone opens and cancels
//      the editor; a reload keeps it with no other window open, a new audience window takes it,
//      and its reset brings back the deck's 15:00 in every window
//   7. createDeckApp's other cases, under the dev server, on the same install (src/main.js, and
//      vite.config.js for the first, rewritten for each and then put back): a project with one deck
//      opens it at /; createDeckApp({ deck: 'second' }) opens that deck at / and ?deck=<other>
//      still wins; createDeckApp({ deck: 'missing' }) shows the list with one [arao] warning
//   8. <bin> export                    no --deck: every deck, one PDF each, at its default name
//                                      (exports/<deck>.pdf); each PDF must have (its pages counted
//                                      in the file itself) as many pages as its summary line says
//                                      and as the walk counted steps (per step is the default), and
//                                      a total line all the decks
//   9. <bin> export --deck <name> --per-slide   the one PDF (exports/<deck>-slides.pdf), with as
//                                      many pages as slides
//  10. the CLI's other cases, each on a decks folder of tiny decks of its own (vite.config.js
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

  log('vite build')
  await run(process.execPath, [viteBin, 'build'], project)

  browser = await chromium.launch({ executablePath: process.env.ARAO_CHROMIUM || undefined })

  // starts the dev server or vite preview; resolves to its URL once it answers
  async function serve(mode) {
    const port = await freePort()
    const args = mode === 'dev' ? [] : ['preview']
    server = spawn(process.execPath, [viteBin, ...args, '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: project, stdio: ['ignore', 'ignore', 'inherit'] })
    const url = `http://127.0.0.1:${port}/`
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
      await page.goto(new URL(`?deck=${encodeURIComponent(deck)}`, base).href)
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
      console.log(`  ${mode} ?deck=${deck}: ${slides} slides, ended at ${at}; steps per slide ${per}`)
      if (slides && Object.keys(steps).length !== slides)
        complaints.push(`the walk visited ${Object.keys(steps).length} slides of ${slides}`)
      walked[deck] = { slides, steps: Object.values(steps).reduce((a, b) => a + b, 0) }
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`${mode} ?deck=${deck}: ${c}`)
  }

  // the deck selector: / lists every deck and each link opens its deck; on /?<query> each link
  // keeps the query (not the hash); an unknown ?deck= shows the list too, with a warning naming it
  // (the only console message expected here)
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
    const links = page.locator('.ar-decks a[href^="?deck="]')
    const listed = async (where) => {
      await links.first().waitFor({ timeout: 30_000 }).catch(() => {})
      const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))
      const want = decks.map((d) => `?deck=${encodeURIComponent(d.toLowerCase())}`).sort()
      if (JSON.stringify([...hrefs].sort()) !== JSON.stringify(want))
        complaints.push(`${where}: the list links to ${hrefs.join(', ') || 'nothing'}, not to ${want.join(', ')}`)
      return hrefs
    }
    // follows a link of the list; the deck must open at its ?deck=
    const opens = async (href, how) => {
      await page.waitForURL((u) => u.search === href, { timeout: 30_000 }).catch(() => {})
      const slides = await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).then(() => true, () => false)
      const at = await page.evaluate(() => location.search)
      if (at !== href || !slides) complaints.push(`${how} ${href}: landed on ${at || '/'}${slides ? '' : ', with no slides'}`)
    }
    try {
      await page.goto(base)
      const hrefs = await listed('/')
      console.log(`  ${mode} /: ${hrefs.length} decks listed (${hrefs.join(' ')})`)
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
      const query = 'theme=vigojug&presenter'
      await page.goto(new URL(`?${query}#/2/1`, base).href)
      await links.first().waitFor({ timeout: 30_000 }).catch(() => {})
      const carried = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))
      const meant = hrefs.map((h) => `${h}&${query}`)
      if (JSON.stringify(carried) !== JSON.stringify(meant))
        complaints.push(`/?${query}#/2/1: the list links to ${carried.join(', ') || 'nothing'}, not to ${meant.join(', ')}`)
      expected = '"no-such-deck"'
      await page.goto(new URL('?deck=no-such-deck', base).href)
      await listed('?deck=no-such-deck')
      const notice = (await page.locator('.ar-decks [role="alert"]').textContent({ timeout: 5_000 }).catch(() => null)) ?? ''
      if (!notice.includes('no-such-deck')) complaints.push('?deck=no-such-deck: no notice naming it above the list')
      await pause(300)
      if (expected) complaints.push('?deck=no-such-deck: no console warning naming it')
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
      await page.goto(new URL(`?deck=${second}${query}`, base).href)
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
      await open('&presenter')
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

  // the talk's length, on the second deck (duration="15m"): edited in the presenter view's bar, in
  // a browser context of its own (its windows share a channel and sessionStorage like the tabs of
  // one browser); any console warning, error or page error fails
  async function duration(base) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const complaints = []
    const open = async (query, who) => {
      const page = await context.newPage()
      page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`${who}: console ${m.type()}: ${m.text()}`))
      page.on('pageerror', (e) => complaints.push(`${who}: page error: ${e.message}`))
      await page.goto(new URL(`?deck=${second}${query}`, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
      return page
    }
    const minutes = (ms) => `${ms / 60000}:00`
    // the presenter's bar shows the length on its button, the time left under the timer, and
    // marks a length that is not the deck's (.changed); waits for it, says what it saw otherwise
    const shows = async (page, ms, changed, when) => {
      const want = { button: minutes(ms), left: `quedan ${minutes(ms)}`, changed }
      const read = () => page.evaluate(() => ({
        button: document.querySelector('.ar-p-dur')?.textContent.trim(),
        left: document.querySelector('.ar-p-sub')?.textContent.match(/quedan [\d:]+/)?.[0],
        changed: !!document.querySelector('.ar-p-dur.changed'),
      }))
      const ok = await page.waitForFunction((w) => {
        const b = document.querySelector('.ar-p-dur')
        return b?.textContent.trim() === w.button && document.querySelector('.ar-p-sub')?.textContent.includes(w.left)
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
    try {
      const presenter = await open('&presenter', 'presenter')
      let audience = await open('', 'audience')
      await shows(presenter, DURATION, false, 'opened')
      await hears(audience, DURATION, 'opened')

      // with the mouse: 20m, Enter
      const set = 20 * 60000
      await presenter.click('.ar-p-dur')
      await presenter.locator('.ar-p-edit input').fill('20m')
      await presenter.keyboard.press('Enter')
      await shows(presenter, set, true, 'set to 20m')
      if (await editor(presenter).count()) complaints.push('set to 20m: the editor is still open')
      await hears(audience, set, 'set to 20m')

      // with the keyboard alone: focus the button, Enter opens with the input focused; an invalid
      // length shows its error and keeps the editor; Escape cancels, the focus back on the button
      await presenter.locator('.ar-p-dur').focus()
      await presenter.keyboard.press('Enter')
      const focused = await presenter.evaluate(() => document.activeElement?.matches('.ar-p-edit input'))
      if (!focused) complaints.push('Enter on the length button: the input does not have the focus')
      await presenter.keyboard.type('abc')
      await presenter.keyboard.press('Enter')
      const error = await presenter.locator('.ar-p-edit-msg.bad').textContent({ timeout: 2_000 }).catch(() => '')
      const invalid = await presenter.locator('.ar-p-edit input[aria-invalid="true"]').count()
      if (!error.includes('abc') || !invalid) complaints.push(`an invalid length: no inline error naming it (${JSON.stringify(error)})`)
      await presenter.keyboard.press('Escape')
      if (await editor(presenter).count()) complaints.push('Escape: the editor is still open')
      const back = await presenter.evaluate(() => document.activeElement?.matches('.ar-p-dur'))
      if (!back) complaints.push('Escape: the focus is not back on the length button')
      await shows(presenter, set, true, 'after an invalid length and Escape')

      // a reload with no other window open keeps it; a new audience window takes it
      await audience.close()
      await presenter.reload()
      await presenter.waitForSelector('.ar-p-dur', { timeout: 30_000 })
      await shows(presenter, set, true, 'reloaded alone')
      audience = await open('', 'audience')
      await hears(audience, set, 'a new audience window')

      // back to the deck's
      await presenter.click('.ar-p-dur')
      await presenter.click('.ar-p-reset')
      await shows(presenter, DURATION, false, 'reset')
      await hears(audience, DURATION, 'reset')
      console.log(`  dev duration: ${complaints.length ? 'problems below' : '15:00 → 20m in every window, kept on reload, reset to 15:00'}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev duration: ${c}`)
  }

  const second = basename(SECOND[0], '.vue').toLowerCase()
  for (const mode of ['dev', 'preview']) {
    log(`walking the decks under vite ${mode}`)
    const base = await serve(mode)
    try {
      // the dev server may optimise dependencies on the first visit and reload: let it settle
      if (mode === 'dev') {
        const warm = await browser.newPage()
        await warm.goto(new URL(`?deck=${encodeURIComponent(decks[0])}`, base).href)
        await warm.waitForLoadState('networkidle').catch(() => {})
        await pause(1000)
        await warm.close()
      }
      for (const deck of decks) await walk(base, deck, mode)
      await selector(base, mode)
      if (mode === 'dev') await face(base)
      if (mode === 'dev') await duration(base)
    } finally {
      await stop()
    }
  }

  // createDeckApp's other cases: the project's own files rewritten for each one, the dev server
  // started on them (Vue's warnings only exist in dev, and no build is needed), and put back.
  // Each visit opens a path and expects a deck (`deck`: the second one or another) or the list
  // (`missing`: the name its notice and its one [arao] warning must give).
  const other = decks.find((d) => d.toLowerCase() !== second)
  const solo = 'src/solo' // a decks folder holding the second deck alone
  const asIs = { 'src/main.js': files['src/main.js'], 'vite.config.js': files['vite.config.js'] }
  const withDeck = (name) => asIs['src/main.js'].replace('createDeckApp()', `createDeckApp({ deck: '${name}' })`)
  const variants = [
    { name: 'one deck', files: { 'vite.config.js': asIs['vite.config.js'].replace('arao()', `arao({ decks: '${solo}' })`) },
      visits: [{ path: '', deck: 'second' }] },
    { name: `createDeckApp({ deck: '${second}' })`, files: { 'src/main.js': withDeck(second) },
      visits: [{ path: '', deck: 'second' }, { path: `?deck=${encodeURIComponent(other)}`, deck: 'other' }] },
    { name: `createDeckApp({ deck: 'missing' })`, files: { 'src/main.js': withDeck('missing') },
      visits: [{ path: '', missing: 'missing' }] },
  ]

  async function visit(base, variant, { path, deck, missing }) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()
    const complaints = []
    let expected = missing && `"${missing}"` // the one warning the page may give
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
        if (!slides) complaints.push('no deck opened')
        else if (isSecond !== (deck === 'second')) complaints.push(`opened ${isSecond ? 'the second deck' : 'another deck'}, not ${deck === 'second' ? 'the second' : other}`)
      } else {
        const links = page.locator('.ar-decks a[href^="?deck="]')
        await links.first().waitFor({ timeout: 30_000 }).catch(() => {})
        const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))
        if (hrefs.length !== decks.length) complaints.push(`the list has ${hrefs.length} links, not ${decks.length}`)
        const notice = (await page.locator('.ar-decks [role="alert"]').textContent({ timeout: 5_000 }).catch(() => null)) ?? ''
        if (!notice.includes(missing)) complaints.push(`no notice naming "${missing}" above the list`)
      }
      await pause(300) // late warnings
      if (expected) complaints.push(`no [arao] console warning naming ${expected}`)
      console.log(`  dev ${variant.name}, /${path}: ${deck ? `the ${deck === 'second' ? 'second' : 'other'} deck` : 'the list'}${complaints.length ? ' (problems below)' : ''}`)
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
console.log(`\n[smoke] OK: ${PKG} installs, builds, runs its decks clean, lists them and exports them`)
