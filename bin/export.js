// phoenyx export: PDF of a whole deck, run in a slides project (the current directory):
//   phoenyx export --deck framework [--theme vigojug] [--per-step] [--notes] [--out talk.pdf]
//   (npm run export -- --deck framework, when the project's "export" script is "phoenyx export")
// Run by bin/phoenyx.js: its options are what follows the command.
// Builds the project into a temporary folder (vite build, with the project's own Vite config),
// serves it on a free local port (vite preview), opens the deck in export mode (?export, the
// engine's exporter.js) in headless Chromium and prints it: one page per slide, each slide as it
// stands at its last step (or one page per step), every page the canvas size (1920x1080 px,
// which a PDF measures as 1440x810 pt), text as text. Needs no dev server running.
// The PDF is checked (one page per page of the deck) and put in place only once complete: an
// export that fails or is stopped leaves no half file, and an earlier PDF at --out as it was.
// Stopped (Ctrl-C, SIGTERM, SIGHUP), it closes the browser and the server and removes its
// temporary build.
//
// Chromium is the one Playwright downloads for its version of playwright-core:
//   npx playwright-core install chromium
// or any Chrome/Chromium already installed, named by PHOENYX_CHROMIUM=/path/to/chrome.
import { access, mkdir, mkdtemp, readdir, rename, stat, writeFile } from 'node:fs/promises'
import { constants, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const HELP = `Usage: phoenyx export [options]     (in a project: npm run export -- [options])

  --deck <name>   a deck of the project's decks folder (default: the first by name)
  --theme <name>  one of the deck's themes (default: its first)
  --per-step      one page per step, instead of one per slide
  --notes         after each slide with speaker notes, a page with its notes
  --out <path>    where to write it (default: exports/<deck>[-<theme>][-steps][-notes].pdf);
                  a folder (one that exists, or a path ending in /) gets that default name in it
  --url <url>     print from a server already running (npm run dev: http://127.0.0.1:5173/)
                  instead of building the site
  -h, --help      this help

Run it in the slides project: its folder is the current directory, its decks folder the one its
Vite config gives the phoenyx() plugin (src/decks by default).
A slide's page shows it at its last step: everything revealed, the last highlight of its
snippets. What only shows at an earlier step (v-step.only) is in --per-step.
Chromium: npx playwright-core install chromium, or PHOENYX_CHROMIUM=/path/to/chrome.`

const root = process.cwd()
// an error of the export itself (its message is all there is to say), not a bug of this script
class ExportError extends Error {}
const fail = (msg) => {
  throw new ExportError(msg)
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms))

let args
try {
  args = parseArgs({
    args: process.argv.slice(3),
    options: {
      deck: { type: 'string' },
      theme: { type: 'string' },
      'per-step': { type: 'boolean', default: false },
      notes: { type: 'boolean', default: false },
      out: { type: 'string' },
      url: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  }).values
} catch (e) {
  console.error(`export: ${e.message}\n\n${HELP}`)
  process.exit(1)
}
if (args.help) {
  console.log(HELP)
  process.exit(0)
}

// The project's Vite, the one its config is written for (a peer dependency of this package).
// Its config says where the decks are: the phoenyx() plugin's decks folder.
const { build, preview, resolveConfig } = await import('vite')
let decksDir
try {
  const config = await resolveConfig({ root, logLevel: 'error' }, 'build')
  decksDir = config.plugins.find((p) => p.name === 'phoenyx')?.api?.folders().decks
} catch (e) {
  console.error(`export: cannot load the Vite config of ${root}: ${e.message}`)
  process.exit(1)
}
if (!decksDir) {
  console.error(`export: the Vite config of ${root} has no phoenyx() plugin: is this a slides project?`)
  process.exit(1)
}
const decksWhere = relative(root, decksDir) || decksDir
// the app falls back to its first deck on a name it does not know: check the name here; with no
// name, the first deck by name, as the app picks it
const decks = (await readdir(decksDir, { withFileTypes: true }).catch(() => []))
  .filter((f) => f.isFile() && f.name.endsWith('.vue')).map((f) => f.name.slice(0, -4)).sort()
const deck = args.deck == null ? decks[0] : decks.find((d) => d.toLowerCase() === args.deck.toLowerCase())
if (!deck) {
  console.error(args.deck == null || !decks.length
    ? `export: no decks in ${decksWhere} (each .vue file directly in it is a deck)`
    : `export: no deck "${args.deck}" in ${decksWhere} (there are: ${decks.join(', ')})`)
  process.exit(1)
}
const name = [deck.toLowerCase(), args.theme, args['per-step'] && 'steps', args.notes && 'notes'].filter(Boolean).join('-')
const file = `${name}.pdf`
const isDir = async (p) => (await stat(p).catch(() => null))?.isDirectory() ?? false
let out = resolve(args.out ?? join(root, 'exports', file))
if (args.out && (/[\\/]$/.test(args.out) || (await isDir(out)))) out = join(out, file)
const where = relative(process.cwd(), out) || out
// a place it cannot be written to fails now, not after the whole render
try {
  if (await isDir(out)) throw new Error('there is a folder of that name')
  await mkdir(dirname(out), { recursive: true })
  await access(dirname(out), constants.W_OK)
} catch (e) {
  console.error(`export: cannot write ${where}: ${e.message}`)
  process.exit(1)
}

const query = new URLSearchParams({ deck: deck.toLowerCase() })
if (args.theme) query.set('theme', args.theme)
const flags = ['export', args['per-step'] && 'per-step', args.notes && 'notes'].filter(Boolean)
const search = `${query}&${flags.join('&')}`

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

try {
  // first the browser: without one, there is no point in building
  const { chromium } = await import('playwright-core')
  try {
    browser = await chromium.launch({
      executablePath: process.env.PHOENYX_CHROMIUM || undefined,
      // the signals are this script's: it closes the browser itself, along with the rest
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
    })
  } catch (e) {
    // the browser's own stderr says why it did not start; Playwright's first line rarely does
    const lines = e.message.split('\n')
    const cause = lines.find((l) => l.includes('[err]'))?.replace(/^.*?\[err\]\s*/, '') ?? lines[0]
    const hint = /doesn't exist/.test(e.message) ? 'install it with "npx playwright-core install chromium", or set PHOENYX_CHROMIUM to a Chrome/Chromium'
      : /shared librar/.test(e.message) ? 'system libraries are missing ("npx playwright-core install-deps chromium" installs them)'
      : 'see below'
    fail(`cannot start Chromium: ${hint}.\n${cause}`)
  }

  let base = args.url
  if (!base) {
    tmp = await mkdtemp(join(tmpdir(), 'phoenyx-export-'))
    console.log('Building…')
    await build({ root, logLevel: 'error', build: { outDir: tmp, emptyOutDir: true } })
    server = await preview({ root, logLevel: 'error', build: { outDir: tmp }, preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } })
    base = `http://127.0.0.1:${server.httpServer.address().port}/`
  }
  const url = new URL(`?${search}`, base).href

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  // the page's own complaints, as they come (pictures that did not load, a slide still busy…)
  const errors = []
  page.on('pageerror', (e) => {
    errors.push(e.message)
    console.warn(`  page error: ${e.message}`)
  })
  page.on('console', (m) => ['warning', 'error'].includes(m.type()) && console.warn(`  page ${m.type()}: ${m.text()}`))

  console.log(`Rendering ${deck}${args.theme ? ` (${args.theme})` : ''}, one page per ${args['per-step'] ? 'step' : 'slide'}${args.notes ? ', with notes' : ''}…`)
  // not until "load": a picture that never answers would hold it; the deck says when it is ready
  await page.goto(url, { waitUntil: 'domcontentloaded' }).catch((e) => fail(`cannot open ${url}: ${e.message.split('\n')[0]}`))
  // a deck that does not even mount fails here, not after the long wait
  await page.waitForSelector('.ph-slide', { state: 'attached', timeout: 60_000 })
    .catch(() => fail(`the deck did not render at ${url}${errors.length ? `: ${errors[0]}` : ''}`))
  const ready = await page.waitForFunction(() => window.__phoenyxReady, null, { timeout: 10 * 60_000, polling: 200 })
    .then((h) => h.jsonValue(), () => fail('the deck did not finish its pages in 10 minutes'))
  if (ready.error) fail(ready.error)
  const stalled = ready.stalled ?? []

  // whatever else is still on its way, for a moment (not when something is known not to come)
  if (!stalled.length) await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
  const pdf = await page.pdf({
    width: `${ready.width}px`,
    height: `${ready.height}px`,
    printBackground: true,
    preferCSSPageSize: true,
  })

  // the PDF has as many pages as the book, or a page did not fit the paper
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length
  if (!pages) console.warn(`  the PDF's pages are not readable as plain text: not checked against the deck's ${ready.pages}`)
  else if (pages !== ready.pages) fail(`the PDF came out with ${pages} pages, the deck made ${ready.pages}: ${where} not written`)
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
  console.log(`${where}: ${pages || ready.pages} pages (${ready.slides} slides, ${ready.steps} steps), ${ready.width}x${ready.height} px, theme ${ready.theme}`)
} catch (e) {
  // stopping: what broke is what the signal handler is closing, nothing to report
  if (!stopping) console.error(`export: ${e instanceof ExportError ? e.message : e.stack}`)
  process.exitCode = 1
} finally {
  await cleanup()
}
