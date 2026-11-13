#!/usr/bin/env node
// docs/assets/hero.gif, the README's animation: a slide written in seconds. On the left the deck's
// source is typed, highlighted; on the right the deck, live on the dev server, follows each saved
// line (Vite's hot reload, the real thing); then it is presented: two steps.
//
//   npm run hero-gif
//
// The deck is written line by line into a temporary decks folder, served
// on the library's source (scripts/docs-server.mjs) and drawn in an iframe of a page of its own.
// Each frame is a screenshot; ffmpeg (on the PATH, or FFMPEG=/path/to/ffmpeg) makes the GIF with a
// palette of its own (palettegen/paletteuse). Run on demand, not in CI, and commit the GIF.
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHighlighter } from 'shiki'
import { launchChromium, REPO, settle, startDecksServer } from './docs-server.mjs'

const OUT = join(REPO, 'docs/assets/hero.gif')
const FPS = 12
const CHARS_PER_FRAME = 4
const HEAD = '<template lang="pug">\nDeck\n  Slide\n'
const TAIL = '</template>\n'
const LINES = [
  '    h2 Ship a talk',
  '    Cols',
  '      Center',
  '        Icon(name="lucide:file-code" size="160")',
  '        h3 One Vue file',
  '      Center(v-step="2")',
  '        Icon(name="lucide:monitor" size="160")',
  '        h3 Any screen',
  '      Center(v-step="3")',
  '        Icon(name="lucide:printer" size="160")',
  '        h3 And a PDF',
]
const W = 878
const H = 352

const work = mkdtempSync(join(tmpdir(), 'arao-hero-'))
const decks = join(work, 'decks')
const frames = join(work, 'frames')
mkdirSync(decks)
mkdirSync(frames)
const deckFile = join(decks, 'talk.vue')
writeFileSync(deckFile, HEAD + TAIL)

const highlighter = await createHighlighter({ themes: ['github-dark'], langs: ['vue', 'pug'] })
const server = await startDecksServer({ decks })
const browser = await launchChromium()
let n = 0
try {
  writeFileSync(join(server.root, 'hero.html'), page())
  const tab = await browser.newPage({ viewport: { width: W, height: H } })
  tab.on('pageerror', (e) => console.error(e.message))
  await tab.goto(`${server.url}hero.html`)
  const deck = await (await tab.waitForSelector('iframe')).contentFrame()
  await settle(deck)

  const code = async (typed, caret = true) => {
    const text = HEAD + typed
    const html = highlighter.codeToHtml(text + '\n' + TAIL.trimEnd(), { lang: 'vue', theme: 'github-dark' })
    await tab.evaluate(([html, line, caret]) => window.setCode(html, line, caret), [html, text.split('\n').length - 1, caret])
  }
  const shot = async (times = 1) => {
    const file = join(frames, `f${String(n++).padStart(4, '0')}.png`)
    await tab.screenshot({ path: file })
    for (let i = 1; i < times; i++) copyFileSync(file, join(frames, `f${String(n++).padStart(4, '0')}.png`))
  }
  const slideHtml = () => deck.evaluate(() => document.querySelector('.ar-slide')?.innerHTML ?? '')
  const save = async (text) => {
    const before = await slideHtml()
    writeFileSync(deckFile, HEAD + text + '\n' + TAIL)
    for (let t = 0; t < 40 && (await slideHtml()) === before; t++) await tab.waitForTimeout(100)
    await deck.evaluate(() => (location.hash = '#/1/99')) // the author looks at the last step
    await settle(deck, 450)
  }
  const key = async (k, label, hold) => {
    await tab.evaluate((label) => window.setHint(label), label)
    await deck.evaluate((k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), k)
    await tab.waitForTimeout(500)
    await shot(hold)
  }

  await code('')
  await shot(8)
  let typed = ''
  for (const [i, line] of LINES.entries()) {
    const start = typed
    for (let c = CHARS_PER_FRAME; c < line.length + CHARS_PER_FRAME; c += CHARS_PER_FRAME) {
      await code(start + line.slice(0, c))
      await shot()
    }
    typed = start + line
    await save(typed)
    if (i < LINES.length - 1) typed += '\n'
    await code(typed)
    await shot(3)
  }
  await code(typed, false)
  await shot(14)

  // present it: back to step 1, then two steps
  await tab.evaluate(() => window.setHint('Home &nbsp;step 1'))
  await deck.evaluate(() => (location.hash = '#/1/1'))
  await settle(deck, 450)
  await shot(8)
  await key('ArrowRight', '→ &nbsp;next step', 9)
  await key('ArrowRight', '→ &nbsp;next step', 24)
} finally {
  await browser.close()
  await server.close()
}

const ffmpeg = process.env.FFMPEG || 'ffmpeg'
execFileSync(ffmpeg, [
  '-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png'),
  '-vf', 'split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
  '-loop', '0', OUT,
], { stdio: 'inherit' })
rmSync(work, { recursive: true, force: true })
console.log(`docs/assets/hero.gif: ${n} frames, ${(statSync(OUT).size / 1024).toFixed(0)} KB`)

function page() {
  return `<!doctype html>
<meta charset="utf-8">
<style>
  body { margin: 0; height: ${H}px; background: #0f1115; font: 12px/1.4 Inter, system-ui, sans-serif; color: #949bab;
         display: flex; gap: 14px; padding: 16px; box-sizing: border-box; }
  .pane { display: flex; flex-direction: column; gap: 6px; }
  .label { height: 16px; white-space: nowrap; }
  .editor { width: 352px; height: 270px; flex: none; background: #24292e; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px #0008; }
  .editor pre { margin: 0; padding: 12px; font: 11px/1.5 "DejaVu Sans Mono", ui-monospace, monospace; background: none !important; }
  .caret { display: inline-block; width: 1px; height: 1.2em; margin-left: 1px; vertical-align: text-bottom; background: #e1e4e8; }
  iframe { width: 480px; height: 270px; border: 0; border-radius: 6px; box-shadow: 0 10px 30px #0008; background: #000; }
  .hint { height: 18px; }
  .hint span { display: inline-block; padding: 1px 8px; border: 1px solid #3c4252; border-radius: 6px; color: #eceef2; background: #1c1f26; }
  .hint:empty { visibility: hidden; }
</style>
<div class="pane">
  <div class="label">src/decks/Talk.vue</div>
  <div class="editor" id="code"></div>
</div>
<div class="pane">
  <div class="label">localhost:5173/talk</div>
  <iframe src="/talk"></iframe>
  <div class="hint" id="hint"></div>
</div>
<script>
  window.setCode = (html, line, caret) => {
    const el = document.getElementById('code')
    el.innerHTML = html
    if (caret) el.querySelectorAll('.line')[line]?.append(Object.assign(document.createElement('span'), { className: 'caret' }))
  }
  window.setHint = (text) => { document.getElementById('hint').innerHTML = text ? '<span>' + text + '</span>' : '' }
</script>
`
}
