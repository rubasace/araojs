// arao export: PDFs of a project's decks, run in a slides project (the current directory):
//   arao export [--deck framework] [--theme vigojug] [--per-slide] [--notes] [--out exports/]
//   (npm run export -- …, when the project's "export" script is "arao export")
// Run by bin/arao.js: its options are what follows the command.
// Without --deck it exports every deck of the project, one PDF each, one after the other; with
// --deck, that one. Builds the project once into a temporary folder (vite build, with the
// project's own Vite config), serves it on a free local port (vite preview), and opens each deck
// in export mode (?export, src/core/exporter.js) in one headless Chromium and prints it: one page
// per step of every slide (or, --per-slide, one page per slide, each slide as it stands at its
// last step), every page the canvas size (1920x1080 px, which a PDF measures as 1440x810 pt),
// text as text. Needs no dev server running.
// Each PDF is checked (one page per page of the deck) and put in place only once complete: an
// export that fails or is stopped leaves no half file, and an earlier PDF at its place as it was.
// A deck that fails does not stop the others; the exit code is 1 if any failed.
// --theme with several decks: the decks that list that theme are printed in it, the others in
// their first theme (their summary line says so, and their file name has no theme). With --deck,
// a theme the deck does not list is an error.
// Stopped (Ctrl-C, SIGTERM, SIGHUP), it closes the browser and the server and removes its
// temporary build.
//
// Chromium is the one Playwright downloads for its version of playwright-core:
//   npx playwright-core install chromium
// or any Chrome/Chromium already installed, named by ARAO_CHROMIUM=/path/to/chrome.
import { access, mkdir, mkdtemp, readdir, rename, stat, writeFile } from 'node:fs/promises'
import { constants, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const HELP = `Usage: arao export [options]     (in a project: npm run export -- [options])

  --deck <name>   just this deck of the project's decks folder (default: every deck, one PDF each)
  --theme <name>  one of the deck's themes (default: its first); with several decks, only the
                  decks that list it are printed in it, the others in their first theme
  --per-slide     one page per slide, each at its last step, instead of one per step
  --per-step      one page per step: the default (accepted for older scripts)
  --notes         after each slide with speaker notes, a page with its notes
  --out <path>    where to write it (default: exports/<deck>[-<theme>][-slides][-notes].pdf);
                  a folder (one that exists, or a path ending in /) gets that default name in it.
                  With several decks it is always a folder: a path ending in .pdf is an error
  --url <url>     print from a server already running (npm run dev: http://127.0.0.1:5173/)
                  instead of building the site
  -h, --help      this help

Run it in the slides project: its folder is the current directory, its decks folder the one its
Vite config gives the arao() plugin (src/decks by default).
Every step is a page by default. With --per-slide a slide's page shows it at its last step:
everything revealed, the last highlight of its snippets; what only shows at an earlier step
(v-step.only) is not on it.
Prints one line per PDF and, with several decks, a total; exits with 1 if any deck failed.
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
const perSlide = args['per-slide']

// The project's Vite, the one its config is written for (a peer dependency of this package).
// Its config says where the decks are: the arao() plugin's decks folder.
const { build, preview, resolveConfig } = await import('vite')
let decksDir
try {
  const config = await resolveConfig({ root, logLevel: 'error' }, 'build')
  decksDir = config.plugins.find((p) => p.name === 'arao')?.api?.folders().decks
} catch (e) {
  console.error(`export: cannot load the Vite config of ${root}: ${e.message}`)
  process.exit(1)
}
if (!decksDir) {
  console.error(`export: the Vite config of ${root} has no arao() plugin: is this a slides project?`)
  process.exit(1)
}
const decksWhere = relative(root, decksDir) || decksDir
// the app lists the decks on a name it does not know: check the name here, before the build
const all = (await readdir(decksDir, { withFileTypes: true }).catch(() => []))
  .filter((f) => f.isFile() && f.name.endsWith('.vue')).map((f) => f.name.slice(0, -4)).sort()
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

// the deck's query: export mode, per step unless --per-slide
const searchOf = (deck, theme) => {
  const query = new URLSearchParams({ deck: deck.toLowerCase() })
  if (theme) query.set('theme', theme)
  const flags = ['export', perSlide && 'per-slide', args.notes && 'notes'].filter(Boolean)
  return `${query}&${flags.join('&')}`
}
// the error export mode reports for a theme the deck does not list (src/composables/useExport.js)
const NOT_ITS_THEME = /^theme ".*" is not one of the deck's themes/

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

// renders one deck at base in a page of its own; resolves to what the deck reported, and the PDF
async function render(base, deck, theme) {
  const url = new URL(`?${searchOf(deck, theme)}`, base).href
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  try {
    // the page's own complaints, as they come (pictures that did not load, a slide still busy…)
    const errors = []
    page.on('pageerror', (e) => {
      errors.push(e.message)
      console.warn(`  page error: ${e.message}`)
    })
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && console.warn(`  page ${m.type()}: ${m.text()}`))
    // not until "load": a picture that never answers would hold it; the deck says when it is ready
    await page.goto(url, { waitUntil: 'domcontentloaded' }).catch((e) => fail(`cannot open ${url}: ${e.message.split('\n')[0]}`))
    // a deck that does not even mount fails here, not after the long wait
    await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 60_000 })
      .catch(() => fail(`the deck did not render at ${url}${errors.length ? `: ${errors[0]}` : ''}`))
    const ready = await page.waitForFunction(() => window.__araoReady, null, { timeout: 10 * 60_000, polling: 200 })
      .then((h) => h.jsonValue(), () => fail('the deck did not finish its pages in 10 minutes'))
    if (ready.error) return { ready }
    // whatever else is still on its way, for a moment (not when something is known not to come)
    if (!ready.stalled?.length) await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    const pdf = await page.pdf({
      width: `${ready.width}px`,
      height: `${ready.height}px`,
      printBackground: true,
      preferCSSPageSize: true,
    })
    return { ready, pdf }
  } finally {
    await page.close().catch(() => {})
  }
}

// exports one deck; resolves to its page count
async function exportDeck(base, deck) {
  console.log(`Rendering ${deck}${args.theme ? ` (${args.theme})` : ''}, one page per ${perSlide ? 'slide' : 'step'}${args.notes ? ', with notes' : ''}…`)
  let theme = args.theme
  let { ready, pdf } = await render(base, deck, theme)
  // several decks: one that does not list the theme is printed in its first
  let fallback = false
  if (ready.error && theme && several && NOT_ITS_THEME.test(ready.error)) {
    fallback = true
    theme = undefined
    ;({ ready, pdf } = await render(base, deck))
  }
  if (ready.error) fail(ready.error)
  const out = outFile ?? join(outDir, fileName(deck, theme))
  const where = show(out)
  const stalled = ready.stalled ?? []

  // the PDF has as many pages as the book, or a page did not fit the paper
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length
  if (!pages) console.warn(`  the PDF's pages are not readable as plain text: not checked against the deck's ${ready.pages}`)
  else if (pages !== ready.pages) fail(`the PDF came out with ${pages} pages, the deck made ${ready.pages}: ${where} not written`)
  if (await isDir(out)) fail(`cannot write ${where}: there is a folder of that name`)
  // next to its place first, then moved in whole
  partial = `${out}.tmp`
  try {
    await writeFile(partial, pdf)
    await rename(partial, out)
  } catch (e) {
    fail(`cannot write ${where}: ${e.message}`)
  }
  partial = null

  if (ready.missing.length) console.warn(`  ${ready.missing.length} pictures missing, printed as placeholders: ${ready.missing.join(', ')}`)
  if (stalled.length) console.warn(`  ${stalled.length} still loading when printed (no answer in time), printed as they stood: ${stalled.join(', ')}`)
  const why = fallback ? ` (it does not list ${args.theme}: its first theme)` : ''
  console.log(`${where}: ${pages || ready.pages} pages (${ready.slides} slides, ${ready.steps} steps), ${ready.width}x${ready.height} px, theme ${ready.theme}${why}`)
  return pages || ready.pages
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

  let base = args.url
  if (!base) {
    tmp = await mkdtemp(join(tmpdir(), 'arao-export-'))
    console.log('Building…')
    await build({ root, logLevel: 'error', build: { outDir: tmp, emptyOutDir: true } })
    server = await preview({ root, logLevel: 'error', build: { outDir: tmp }, preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } })
    base = `http://127.0.0.1:${server.httpServer.address().port}/`
  }

  // one deck after the other: one that fails is reported, and the next one goes on
  for (const deck of decks) {
    if (stopping) break
    try {
      total += await exportDeck(base, deck)
    } catch (e) {
      if (stopping) break
      if (!(e instanceof ExportError)) throw e
      failed.push([deck, e.message])
      console.error(`export: ${deck}: ${e.message}`)
    }
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
