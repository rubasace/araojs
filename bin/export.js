// arao export: PDFs of a project's decks, run in a slides project (the current directory):
//   arao export [--deck framework] [--theme vigojug] [--per-slide] [--notes] [--out exports/]
//   (npm run export -- …, when the project's "export" script is "arao export")
// Run by bin/arao.js: its options are what follows the command.
// Without --deck it exports every deck of the project, one PDF each, one after the other; with
// --deck, that one. Builds the project once into a temporary folder (vite build, with the
// project's own Vite config), serves it on a free local port (vite preview, under the project's
// base), and opens each deck at its path in export mode (/<deck>?export, src/core/exporter.js) in
// one headless Chromium and prints it: one page
// per step of every slide (or, --per-slide, one page per slide, each slide as it stands at its
// last step), every page the canvas size (1920x1080 px, which a PDF measures as 1440x810 pt),
// text as text. Needs no dev server running.
// Each PDF is checked (one page per page of the deck, and of the deck asked for: the page says
// which deck it printed) and put in place only once complete: an export that fails or is stopped
// leaves no half file, and an earlier PDF at its place as it was. --url is the site's base: one
// that ends in a deck's name (a deck's own URL, /renovate, or a base named like a deck) gets a
// warning naming the base it may have meant, and the export goes on (the deck each page reports
// keeps a deck's URL from printing it under another deck's name).
// A build error stops the run. A deck that fails once the site is up (it does not render, throws
// before its pages are ready, crashes its page, cannot be printed or written) is reported and
// does not stop the others; the exit code is 1 if any failed. Two decks of one run never write the
// same file: the second one fails instead (deck names that differ only in case, or a deck named
// like another's themed file: Alpha in vigojug and alpha-vigojug in its first theme).
// --theme with several decks: the decks that list that theme are printed in it, the others in
// their first theme, after them (their summary line says so, and their file name has no theme);
// a theme no deck lists is an error, and nothing is written. With --deck, a theme the deck does
// not list is an error.
// Stopped (Ctrl-C, SIGTERM, SIGHUP), it closes the browser and the server and removes its
// temporary build.
//
// Chromium is the one Playwright downloads for its version of playwright-core:
//   npx playwright-core install chromium
// or any Chrome/Chromium already installed, named by ARAO_CHROMIUM=/path/to/chrome.
import { access, mkdir, mkdtemp, rename, stat, writeFile } from 'node:fs/promises'
import { constants, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const HELP = `Usage: arao export [options]     (in a project: npm run export -- [options])

  --deck <name>   just this deck of the project's decks folder (default: every deck, one PDF each)
  --theme <name>  one of the deck's themes (default: its first); with several decks, only the
                  decks that list it are printed in it, the others in their first theme (a
                  theme no deck lists is an error)
  --per-slide     one page per slide, each at its last step, instead of one per step
  --per-step      one page per step: the default (accepted for older scripts)
  --notes         after each slide with speaker notes, a page with its notes
  --out <path>    where to write it (default: exports/<deck>[-<theme>][-slides][-notes].pdf);
                  a folder (one that exists, or a path ending in /) gets that default name in it.
                  With several decks it is always a folder: a path ending in .pdf is an error
  --url <url>     print from a server already running instead of building the site: the
                  site's URL, its base (npm run dev: http://127.0.0.1:5173/; under a base,
                  http://127.0.0.1:5173/talks/), not a deck's; each deck opens at <url><deck>
  -h, --help      this help

Run it in the slides project: its folder is the current directory, its decks folder the one its
Vite config gives the arao() plugin (src/decks by default).
Every step is a page by default. With --per-slide a slide's page shows it at its last step:
everything revealed, the last highlight of its snippets; what only shows at an earlier step
(v-step.only) is not on it.
Prints one line per PDF and, with several decks, a total. A build error stops the run; a deck
that fails after it is reported and the others go on; exits with 1 if any deck failed.
Chromium: npx playwright-core install chromium, or ARAO_CHROMIUM=/path/to/chrome.`

const root = process.cwd()
// an error of the export itself (its message is all there is to say), not a bug of this script
class ExportError extends Error {}
const fail = (msg) => {
  throw new ExportError(msg)
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms))
const usage = (msg) => {
  console.error(`export: ${msg}\n\n${HELP}`)
  process.exit(1)
}

let args
try {
  args = parseArgs({
    args: process.argv.slice(3),
    options: {
      deck: { type: 'string' },
      theme: { type: 'string' },
      'per-slide': { type: 'boolean', default: false },
      'per-step': { type: 'boolean', default: false },
      notes: { type: 'boolean', default: false },
      out: { type: 'string' },
      url: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  }).values
} catch (e) {
  usage(e.message)
}
if (args.help) {
  console.log(HELP)
  process.exit(0)
}
if (args['per-slide'] && args['per-step']) usage('--per-slide and --per-step are each other\'s opposite: give one')
if (args.url != null && !URL.canParse(args.url)) usage(`--url ${args.url} is not a URL (http://127.0.0.1:5173/)`)
const perSlide = args['per-slide']

// The project's Vite, the one its config is written for (a peer dependency of this package).
// Its config says where the decks are: the arao() plugin's decks folder.
const { build, preview, resolveConfig } = await import('vite')
let plugin
try {
  const config = await resolveConfig({ root, logLevel: 'error' }, 'build')
  plugin = config.plugins.find((p) => p.name === 'arao')?.api
} catch (e) {
  console.error(`export: cannot load the Vite config of ${root}: ${e.message}`)
  process.exit(1)
}
if (!plugin) {
  console.error(`export: the Vite config of ${root} has no arao() plugin: is this a slides project?`)
  process.exit(1)
}
const decksDir = plugin.folders().decks
const decksWhere = relative(root, decksDir) || decksDir
// the decks as the app has them (the plugin's); the app lists the decks on a name it does not
// know: check the name here, before the build
const all = plugin.decks()
if (!all.length) {
  console.error(`export: no decks in ${decksWhere} (each .vue file directly in it is a deck)`)
  process.exit(1)
}
let decks = all
if (args.deck != null) {
  decks = all.filter((d) => d.toLowerCase() === args.deck.toLowerCase()).slice(0, 1)
  if (!decks.length) {
    console.error(`export: no deck "${args.deck}" in ${decksWhere} (there are: ${all.join(', ')})`)
    process.exit(1)
  }
}
const several = decks.length > 1
// --url is where / lists the decks: a path that ends in a deck's name is most likely that deck's
// URL, or else a base named like the deck (/talks/ and a deck talks). A warning, with the base it
// would mean, and on: a deck's URL opens that deck under every other deck's name, which the page's
// report of the deck it printed then refuses, writing nothing (render, below).
if (args.url != null) {
  const u = new URL(args.url)
  const segments = u.pathname.split('/').filter(Boolean)
  let last = segments.at(-1) ?? ''
  try {
    last = decodeURIComponent(last)
  } catch {}
  const named = all.find((d) => d.toLowerCase() === last.trim().toLowerCase())
  if (named) {
    const meant = new URL(`/${segments.slice(0, -1).map((s) => `${s}/`).join('')}`, u.origin).href
    console.warn(`export: --url ${args.url} ends in the name of the deck "${named}". If it is that deck's own URL, give the site's base instead, --url ${meant} (each deck opens at <url><deck>); if the site's base is named like the deck, nothing to do. Going on: a page that prints another deck than the one asked for writes nothing.`)
  }
}
// a deck's path is case-insensitive, and so are the file names: such decks open as one, and only
// the first gets its file
const byName = new Map()
for (const d of decks) byName.set(d.toLowerCase(), [...(byName.get(d.toLowerCase()) ?? []), d])
const sameName = [...byName.values()].filter((g) => g.length > 1)
if (sameName.length)
  console.warn(`export: deck names that differ only in case open as the same deck and go to the same file: only the first of each is exported, the others fail: ${sameName.map((g) => g.join(' and ')).join('; ')}`)

// where each PDF goes: --out a file (one deck only) or a folder, or exports/ by default
const isDir = async (p) => (await stat(p).catch(() => null))?.isDirectory() ?? false
const fileName = (deck, theme) => `${[deck.toLowerCase(), theme, perSlide && 'slides', args.notes && 'notes'].filter(Boolean).join('-')}.pdf`
let outDir = join(root, 'exports') // a folder the PDFs go in by their default name
let outFile = null // or the one file --out names
if (args.out) {
  const out = resolve(args.out)
  if (/[\\/]$/.test(args.out) || (await isDir(out))) outDir = out
  else if (several && /\.pdf$/i.test(args.out))
    usage(`--out ${args.out} is one file, and there are ${decks.length} decks to export: give a folder (--out ${args.out.replace(/\.pdf$/i, '')}/), or one deck with --deck`)
  else if (several) outDir = out
  else outFile = out
}
const show = (p) => relative(process.cwd(), p) || p
// a place it cannot be written to fails now, not after the whole render
try {
  if (outFile && (await isDir(outFile))) throw new Error('there is a folder of that name')
  const dir = outFile ? dirname(outFile) : outDir
  await mkdir(dir, { recursive: true })
  await access(dir, constants.W_OK)
} catch (e) {
  console.error(`export: cannot write ${show(outFile ?? outDir)}: ${e.message}`)
  process.exit(1)
}

// the deck's URL on the site at site (its base, ending in /): its path, export mode, per step
// unless --per-slide
const urlOf = (site, deck, theme) => {
  const flags = [theme && `theme=${encodeURIComponent(theme)}`, 'export', perSlide && 'per-slide', args.notes && 'notes'].filter(Boolean)
  return new URL(`${encodeURIComponent(deck.toLowerCase())}?${flags.join('&')}`, site).href
}
// a site's URL as its base: no query or hash, a path ending in /
const siteOf = (url) => {
  const u = new URL(url)
  u.search = ''
  u.hash = ''
  if (!u.pathname.endsWith('/')) u.pathname += '/'
  return u.href
}

// ---- what has to go, however the export ends ------------------------------------------
let tmp = null // the site's build
let partial = null // the PDF being written, until it is complete and in place
let server = null
let browser = null
// synchronous, so that it also runs on process.exit
function removeTemp() {
  for (const p of [tmp, partial]) {
    try {
      if (p) rmSync(p, { recursive: true, force: true })
    } catch {}
  }
}
// each part on its own: one that fails does not keep the others from going
async function cleanup() {
  try {
    await browser?.close()
  } catch {}
  try {
    await server?.close()
  } catch {}
  removeTemp()
}
process.on('exit', removeTemp)
let stopping = false
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  process.on(signal, () => {
    if (stopping) process.exit(code) // a second one: now (the exit handler still cleans up)
    stopping = true
    console.error(`\nexport: ${signal}, stopping`)
    Promise.race([cleanup(), pause(3000)]).finally(() => process.exit(code))
  })
}

// what a failed wait of Playwright means: the page crashed, the time ran out, or what it says
const CRASHED = 'the page crashed (its renderer died: out of memory?)'
const why = (e, timedOut) => (/crash/i.test(e?.message ?? '') ? CRASHED : e?.name === 'TimeoutError' ? timedOut : String(e?.message ?? e).split('\n')[0])

let unnamed = false // said once: a page that does not name the deck it printed
// renders one deck of the site at base in a page of its own; resolves to what the deck reported,
// and the PDF (none when the deck reported an error). Until the deck is ready, an error the page
// throws fails it at once, and so does a crash, at any point.
async function render(base, deck, theme) {
  const url = urlOf(base, deck, theme)
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  let ready = null
  let stop
  const trouble = new Promise((_, ko) => (stop = ko))
  trouble.catch(() => {})
  const guard = (p) => Promise.race([p, trouble])
  try {
    page.on('crash', () => stop(new ExportError(CRASHED)))
    // the page's own complaints, as they come (pictures that did not load, a slide still busy…)
    page.on('pageerror', (e) => {
      console.warn(`  page error: ${e.message}`)
      if (!ready) stop(new ExportError(`the deck threw before its pages were ready: ${e.message.split('\n')[0]}`))
    })
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && console.warn(`  page ${m.type()}: ${m.text()}`))
    // not until "load": a picture that never answers would hold it; the deck says when it is ready
    await guard(page.goto(url, { waitUntil: 'domcontentloaded' }).catch((e) => fail(`cannot open ${url}: ${why(e, 'no answer in time')}`)))
    // a deck that does not even mount fails here, not after the long wait; so does a page that
    // shows the list of decks (the URL names no deck), whose covers are slides too
    const drawn = await guard(page.waitForSelector('.ar-export .ar-slide, .ar-decks', { state: 'attached', timeout: 60_000 })
      .catch((e) => fail(`the deck did not render at ${url}: ${why(e, 'no slide in 60 s')}`)))
    if (await drawn.evaluate((el) => !!el.closest('.ar-decks')))
      fail(`${url} shows the list of decks, not ${deck}: the site does not open its decks at <base><deck>${args.url ? ' (is --url the site\'s base?)' : ''}`)
    ready = await guard(page.waitForFunction(() => window.__araoReady, null, { timeout: 10 * 60_000, polling: 200 })
      .then((h) => h.jsonValue(), (e) => fail(why(e, 'the deck did not finish its pages in 10 minutes'))))
    // the deck printed is the one asked for, or nothing is written
    if (typeof ready.deck === 'string' && ready.deck.toLowerCase() !== deck.toLowerCase())
      fail(`${url} printed the deck "${ready.deck}", not ${deck}: nothing written${args.url ? ` (is --url ${args.url} the site's base?)` : ''}`)
    if (typeof ready.deck !== 'string' && !unnamed) {
      unnamed = true
      console.warn('  the page does not say which deck it printed (an app of its own, not createDeckApp?): not checked against the deck asked for')
    }
    if (ready.error) return { ready }
    // whatever else is still on its way, for a moment (not when something is known not to come)
    if (!ready.stalled?.length) await guard(page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {}))
    const pdf = await guard(page.pdf({
      width: `${ready.width}px`,
      height: `${ready.height}px`,
      printBackground: true,
      preferCSSPageSize: true,
    }).catch((e) => fail(`cannot print the PDF: ${why(e, 'no PDF in time')}`)))
    return { ready, pdf }
  } finally {
    await page.close().catch(() => {})
  }
}

// the files written in this run, by path: the deck each one is of
const written = new Map()
const claim = (out, deck) => {
  const other = written.get(out)
  if (other != null && other !== deck)
    fail(`${show(out)} is ${other}'s, written in this run: not overwritten (${other} and ${deck} resolve to the same file)`)
}

// exports one deck, in theme (or, fallback, in its first theme); resolves to its page count, or,
// when the deck does not list the theme and there are several decks, to { notListed: its themes }
async function exportDeck(base, deck, { theme, fallback = false } = {}) {
  console.log(`Rendering ${deck}${theme ? ` (${theme})` : ''}, one page per ${perSlide ? 'slide' : 'step'}${args.notes ? ', with notes' : ''}…`)
  const out = outFile ?? join(outDir, fileName(deck, theme))
  const where = show(out)
  claim(out, deck) // before the render, not after it
  const { ready, pdf } = await render(base, deck, theme)
  if (ready.code === 'theme-not-listed' && several && !fallback) return { notListed: ready.themes ?? [] }
  if (ready.error) fail(ready.error)
  const stalled = ready.stalled ?? []

  // the PDF has as many pages as the book, or a page did not fit the paper
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length
  if (!pages) console.warn(`  the PDF's pages are not readable as plain text: not checked against the deck's ${ready.pages}`)
  else if (pages !== ready.pages) fail(`the PDF came out with ${pages} pages, the deck made ${ready.pages}: ${where} not written`)
  if (await isDir(out)) fail(`cannot write ${where}: there is a folder of that name`)
  claim(out, deck)
  // next to its place first, then moved in whole
  partial = `${out}.tmp`
  try {
    await writeFile(partial, pdf)
    await rename(partial, out)
  } catch (e) {
    try {
      rmSync(partial, { force: true })
    } catch {}
    fail(`cannot write ${where}: ${e.message}`)
  } finally {
    partial = null
  }
  written.set(out, deck)

  if (ready.missing.length) console.warn(`  ${ready.missing.length} pictures missing, printed as placeholders: ${ready.missing.join(', ')}`)
  if (stalled.length) console.warn(`  ${stalled.length} still loading when printed (no answer in time), printed as they stood: ${stalled.join(', ')}`)
  const said = fallback ? ` (it does not list ${args.theme}: its first theme)` : ''
  console.log(`${where}: ${pages || ready.pages} pages (${ready.slides} slides, ${ready.steps} steps), ${ready.width}x${ready.height} px, theme ${ready.theme}${said}`)
  return { pages: pages || ready.pages }
}

const failed = [] // [deck, message]
let total = 0
try {
  // first the browser: without one, there is no point in building
  const { chromium } = await import('playwright-core')
  try {
    browser = await chromium.launch({
      executablePath: process.env.ARAO_CHROMIUM || undefined,
      // the signals are this script's: it closes the browser itself, along with the rest
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
    })
  } catch (e) {
    // the browser's own stderr says why it did not start; Playwright's first line rarely does
    const lines = e.message.split('\n')
    const cause = lines.find((l) => l.includes('[err]'))?.replace(/^.*?\[err\]\s*/, '') ?? lines[0]
    const hint = /doesn't exist/.test(e.message) ? 'install it with "npx playwright-core install chromium", or set ARAO_CHROMIUM to a Chrome/Chromium'
      : /shared librar/.test(e.message) ? 'system libraries are missing ("npx playwright-core install-deps chromium" installs them)'
      : 'see below'
    fail(`cannot start Chromium: ${hint}.\n${cause}`)
  }

  // a build error stops the run: no deck could be printed
  let base
  if (args.url) base = siteOf(args.url)
  else {
    tmp = await mkdtemp(join(tmpdir(), 'arao-export-'))
    console.log('Building…')
    await build({ root, logLevel: 'error', build: { outDir: tmp, emptyOutDir: true } })
    server = await preview({ root, logLevel: 'error', build: { outDir: tmp }, preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } })
    // where vite preview serves the site: under the project's base (/, or /talks/)
    const at = server.resolvedUrls?.local?.[0]
    base = siteOf(at ?? `http://127.0.0.1:${server.httpServer.address().port}/`)
  }

  // one deck, reported and not thrown if it fails: the next one goes on
  const attempt = async (deck, options) => {
    try {
      return await exportDeck(base, deck, options)
    } catch (e) {
      if (stopping) return null
      const msg = e instanceof ExportError ? e.message : `unexpected error: ${e?.stack ?? e}`
      failed.push([deck, msg])
      console.error(`export: ${deck}: ${msg}`)
      return null
    }
  }
  // one deck after the other; with --theme, those that do not list it wait until the end
  const notListed = [] // [deck, its themes]
  for (const deck of decks) {
    if (stopping) break
    const done = await attempt(deck, { theme: args.theme })
    if (done?.notListed) notListed.push([deck, done.notListed])
    else if (done) total += done.pages
  }
  if (notListed.length && notListed.length === decks.length) {
    // no deck lists it: a typo, not a fallback for every deck
    const themes = [...new Set(notListed.flatMap(([, t]) => t))]
    fail(`no deck lists the theme "${args.theme}" (their themes: ${themes.join(', ')}): nothing exported`)
  }
  for (const [deck] of notListed) {
    if (stopping) break
    const done = await attempt(deck, { fallback: true })
    if (done) total += done.pages
  }
  if (several && !stopping) {
    const done = decks.length - failed.length
    console.log(`${done} of ${decks.length} decks exported, ${total} pages${failed.length ? `; failed: ${failed.map(([d]) => d).join(', ')}` : ''}`)
  }
  if (failed.length) process.exitCode = 1
} catch (e) {
  // stopping: what broke is what the signal handler is closing, nothing to report
  if (!stopping) console.error(`export: ${e instanceof ExportError ? e.message : e.stack}`)
  process.exitCode = 1
} finally {
  await cleanup()
}
