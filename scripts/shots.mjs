#!/usr/bin/env node
// The docs' pictures, from the decks in docs/examples/, so that code and picture never drift.
//
//   npm run shots                 every example
//   npm run shots -- grid steps   only these (the source blocks are filled for all of them)
//
// For each docs/examples/<name>.vue (a small deck, one slide), it serves the examples on the
// library's source (scripts/docs-server.mjs), opens /<name>#/1/<step> at 1920x1080 and writes
// docs/assets/shots/<name>.png at half size (960x540). A comment <!-- shots: 2 3 --> at the top
// of the example names the steps to capture: the last one is <name>.png, the others
// <name>-<step>.png. Without it: one picture, at the slide's last step. Any console warning or
// error of a deck fails the run. The README's features (GIFs, views other than a slide) are
// scripts/feature-gifs.mjs's.
//
// Then it fills every <!-- example:<name> -->…<!-- /example --> block of README.md and docs/**/*.md
// with that example's source (without its shots comment). <name> is an example's name, or a
// file of docs/examples/ with its extension (themes/ocean.css).
//
// Run on demand, not in CI, and commit the result. Chromium as in the smoke test: playwright-core's
// (npx playwright-core install chromium), or ARAO_CHROMIUM=/path/to/chrome.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { launchChromium, REPO, settle, startDecksServer } from './docs-server.mjs'

const EXAMPLES = join(REPO, 'docs/examples')
const SHOTS = join(REPO, 'docs/assets/shots')
const SHOTS_RE = /^<!--\s*shots:([\d\s]+)-->\s*\n/

const only = process.argv.slice(2)
const examples = readdirSync(EXAMPLES).filter((f) => f.endsWith('.vue')).map((f) => f.slice(0, -4)).sort()
for (const name of only) if (!examples.includes(name)) throw new Error(`no example ${name} in docs/examples`)

await takeShots(only.length ? only : examples)
fillBlocks()

async function takeShots(names) {
  mkdirSync(SHOTS, { recursive: true })
  const server = await startDecksServer({ decks: EXAMPLES })
  const browser = await launchChromium()
  const problems = []
  try {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 0.5 })
    for (const name of names) {
      const source = readFileSync(join(EXAMPLES, `${name}.vue`), 'utf8')
      const steps = source.match(SHOTS_RE)?.[1].trim().split(/\s+/).map(Number) ?? [Infinity]
      for (const [i, step] of steps.entries()) {
        const page = await context.newPage()
        page.on('console', (m) => ['warning', 'error'].includes(m.type()) && problems.push(`${name}: ${m.text()}`))
        page.on('pageerror', (e) => problems.push(`${name}: ${e.message}`))
        await page.goto(`${server.url}${name}#/1/${step === Infinity ? 99 : step}`)
        await settle(page)
        const file = i === steps.length - 1 ? `${name}.png` : `${name}-${step}.png`
        await page.screenshot({ path: join(SHOTS, file) })
        console.log(`${relative(REPO, join(SHOTS, file))}  (${new URL(page.url()).hash})`)
        await page.close()
      }
    }
  } finally {
    await browser.close()
    await server.close()
  }
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
}

function source(name) {
  const file = join(EXAMPLES, extname(name) ? name : `${name}.vue`)
  if (!existsSync(file)) throw new Error(`no example ${name} (${relative(REPO, file)})`)
  const lang = { '.vue': 'vue', '.css': 'css', '.java': 'java' }[extname(file)] ?? ''
  return { lang, code: readFileSync(file, 'utf8').replace(SHOTS_RE, '').trimEnd() }
}

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    if (d.name.startsWith('.') || d.name === 'node_modules') return []
    const path = join(dir, d.name)
    return d.isDirectory() ? markdownFiles(path) : d.name.endsWith('.md') ? [path] : []
  })
}

function fillBlocks() {
  for (const file of [join(REPO, 'README.md'), ...markdownFiles(join(REPO, 'docs'))]) {
    const text = readFileSync(file, 'utf8')
    const filled = text.replace(/<!-- example:(\S+) -->[\s\S]*?<!-- \/example -->/g, (_, name) => {
      const { lang, code } = source(name)
      return `<!-- example:${name} -->\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n<!-- /example -->`
    })
    if (filled !== text) {
      writeFileSync(file, filled)
      console.log(`${relative(REPO, file)}: example blocks filled`)
    }
  }
}
