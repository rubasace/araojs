#!/usr/bin/env node
// PDF of a whole deck:
//   npm run export -- --deck framework [--theme vigojug] [--per-step] [--notes] [--out talk.pdf]
// Builds the site into a temporary folder (vite build), serves it on a free local port (vite
// preview), opens the deck in export mode (?export, src/engine/exporter.js) in headless Chromium
// and prints it: one page per slide, each slide as it stands at its last step (or one page per
// step), every page the canvas size (1920x1080 px, which a PDF measures as 1440x810 pt), text
// as text. Needs no dev server running.
//
// Chromium is the one Playwright downloads for its version of playwright-core:
//   npx playwright install chromium
// or any Chrome/Chromium already installed, named by PHOENYX_CHROMIUM=/path/to/chrome.
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const HELP = `Usage: npm run export -- [options]

  --deck <name>   a deck of src/decks (default: demo)
  --theme <name>  one of the deck's themes (default: its first)
  --per-step      one page per step, instead of one per slide
  --notes         after each slide with speaker notes, a page with its notes
  --out <file>    where to write it (default: exports/<deck>[-<theme>][-steps][-notes].pdf)
  --url <url>     print from a server already running (npm run dev: http://127.0.0.1:5173/)
                  instead of building the site
  -h, --help      this help

A slide's page shows it at its last step: everything revealed, the last highlight of its
snippets. What only shows at an earlier step (v-step.only) is in --per-step.
Chromium: npx playwright install chromium, or PHOENYX_CHROMIUM=/path/to/chrome.`

const root = fileURLToPath(new URL('..', import.meta.url))
// an error of the export itself (its message is all there is to say), not a bug of this script
class ExportError extends Error {}
const fail = (msg) => {
  throw new ExportError(msg)
}

let args
try {
  args = parseArgs({
    options: {
      deck: { type: 'string', default: 'demo' },
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

// the app falls back to its first deck on a name it does not know: check the name here
const decks = (await readdir(join(root, 'src/decks'))).filter((f) => f.endsWith('.vue')).map((f) => f.slice(0, -4))
const deck = decks.find((d) => d.toLowerCase() === args.deck.toLowerCase())
if (!deck) {
  console.error(`export: no deck "${args.deck}" in src/decks (there are: ${decks.join(', ')})`)
  process.exit(1)
}
const name = [deck.toLowerCase(), args.theme, args['per-step'] && 'steps', args.notes && 'notes'].filter(Boolean).join('-')
const out = resolve(args.out ?? join(root, 'exports', `${name}.pdf`))

const query = new URLSearchParams({ deck: deck.toLowerCase() })
if (args.theme) query.set('theme', args.theme)
const flags = ['export', args['per-step'] && 'per-step', args.notes && 'notes'].filter(Boolean)
const search = `${query}&${flags.join('&')}`

let tmp = null
let server = null
let browser = null
const removeTmp = () => tmp && rmSync(tmp, { recursive: true, force: true })
process.once('SIGINT', () => {
  removeTmp()
  process.exit(130)
})

try {
  // first the browser: without one, there is no point in building
  const { chromium } = await import('playwright-core')
  try {
    browser = await chromium.launch({ executablePath: process.env.PHOENYX_CHROMIUM || undefined })
  } catch (e) {
    // the browser's own stderr says why it did not start; Playwright's first line rarely does
    const lines = e.message.split('\n')
    const cause = lines.find((l) => l.includes('[err]'))?.replace(/^.*?\[err\]\s*/, '') ?? lines[0]
    const hint = /doesn't exist/.test(e.message) ? 'install it with "npx playwright install chromium", or set PHOENYX_CHROMIUM to a Chrome/Chromium'
      : /shared librar/.test(e.message) ? 'system libraries are missing ("npx playwright install-deps chromium" installs them)'
      : 'see below'
    fail(`cannot start Chromium: ${hint}.\n${cause}`)
  }

  let base = args.url
  if (!base) {
    const { build, preview } = await import('vite')
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
  await page.goto(url).catch((e) => fail(`cannot open ${url}: ${e.message.split('\n')[0]}`))
  // a deck that does not even mount fails here, not after the long wait
  await page.waitForSelector('.ph-slide', { state: 'attached', timeout: 60_000 })
    .catch(() => fail(`the deck did not render at ${url}${errors.length ? `: ${errors[0]}` : ''}`))
  const ready = await page.waitForFunction(() => window.__phoenyxReady, null, { timeout: 10 * 60_000, polling: 200 })
    .then((h) => h.jsonValue(), () => fail('the deck did not finish its pages in 10 minutes'))
  if (ready.error) fail(ready.error)

  await page.waitForLoadState('networkidle')
  await mkdir(dirname(out), { recursive: true })
  await page.pdf({
    path: out,
    width: `${ready.width}px`,
    height: `${ready.height}px`,
    printBackground: true,
    preferCSSPageSize: true,
  })

  // the PDF has as many pages as the book, or a page did not fit the paper (0: page objects
  // not readable as plain text, nothing to compare)
  const pdf = (await readFile(out)).toString('latin1')
  const pages = (pdf.match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length || ready.pages
  const where = relative(process.cwd(), out) || out
  if (pages !== ready.pages) fail(`${where} has ${pages} pages, the deck made ${ready.pages}`)
  if (ready.missing.length) console.warn(`  ${ready.missing.length} pictures missing, printed as placeholders: ${ready.missing.join(', ')}`)
  console.log(`${where}: ${pages} pages (${ready.slides} slides, ${ready.steps} steps), ${ready.width}x${ready.height} px, theme ${ready.theme}`)
} catch (e) {
  console.error(`export: ${e instanceof ExportError ? e.message : e.stack}`)
  process.exitCode = 1
} finally {
  await browser?.close()
  await server?.close()
  removeTmp()
}
