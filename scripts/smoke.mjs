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
// arao() plugin and three theme sources (src/themes, src/venues and a theme package, THEME_SOURCES),
// index.html, src/main.js (createDeckApp, nothing else: no theme is imported by hand), a
// shortcuts file (src/shortcuts.ts: SHORTCUTS), a theme of
// its own in src/themes (THEME, in a file of another name: the plugin names it by its selector;
// and THEME-extra, in a partial that file @import-s), ROOM in src/venues, IMPORTED in a theme
// package it depends on (vendor/, its CSS in the folder its package.json names), the playground's decks, images
// and snippets as content, and four tiny decks of its own (so that the project has several and /
// lists them; the second has a duration and lists its themes, the third neither: it gets every
// theme there is; the fourth a file name and a cover heading far too long for its card, and THEME
// first; the fifth lists first IMPORTED, the theme package's).
// Then, in order:
//   1. npm install
//   2. vite build                      must pass, and write dist/404.html, a copy of index.html;
//      with a theme source that is a package not installed, one that gives no theme, one whose
//      themes folder is outside it, or a bare name that is a root folder, it must stop with an
//      [arao] error (the last one with the "./" hint); a name two sources give warns once, and a
//      source named twice does not warn about itself; and it writes the files and @font-face (400
//      and 700) of the web font THEME names (WEB_FONT; SKIPPED where the font provider is
//      unreachable); with arao({ fonts: false }), and with system fonts only, no font files (and,
//      the latter, no fontless output)
//   3. every deck of src/decks, under the dev server (Vue's own warnings only exist in dev) and
//      under vite preview (the production build): opened at /<name>, walked with ArrowRight
//      until the hash stops changing; any console warning/error or page error fails, and so does
//      a deck with no slides
//   4. the deck selector, under both servers: / lists every deck, each card with its cover drawn
//      in it (a .ar-slide), its title the file name in words (TITLES) from the list's first
//      render (recorded before any cover is drawn) and the same once the covers are in, the
//      second and the fourth deck's cover heading under its title, its path as its link's
//      (decoded), every card as tall as the others, its title, cover heading and path on one line
//      each (the fourth deck's cut), each cover in its deck's first theme (the fourth's THEME, the
//      fifth's IMPORTED, the others' default), and the page's URL left as it was; each link (the first
//      followed with the keyboard) opens its deck; the links keep the page's query, and the
//      covers stay covers on /?presenter; ?deck=<name> is moved to /<name>, keeping the rest of
//      the query and the hash; an unknown path, and an unknown ?deck=, show the list with a
//      notice and one warning
//   5. useDeck()'s face, under the dev server, on the second deck: frozen, its refs read-only all
//      the way down, setTheme refuses a name the deck has not (one [arao] warning), and in the
//      presenter view's preview no function acts
//   5b. themes, under the dev server, on the third deck (no themes listed): it wears 'default' and
//      lists 'default', THEME, THEME-extra, ROOM, IMPORTED and LINKED (source after source); a theme
//      added to the linked package (outside the root) while it runs is offered by the next page; t cycles to THEME, and ?theme=THEME wears it; the
//      defaults reach what is drawn outside every theme (the presenter view); a :root rule of the
//      project's own wins over a default (and a default that is another token follows it), a
//      theme wins over that rule, and the picker's swatch of 'default' shows it; :root
//      { --ar-controls-accent } reaches the presenter view's docked controls, and its length
//      editor's shadow follows :root { --ar-presenter-bg }. On the fifth deck, IMPORTED (the theme
//      package's) is worn with no warning
//   5c. speaker notes, under the dev server, on the third deck: the v-steps inside Notes add no step
//      (the slide has two in the audience and in the presenter view), the presenter's panel shows
//      the notes of the slide on screen only (none from the preview), each step's own, and marks
//      what the step brings; a slide without notes says so; the export's notes pages print every
//      step of them, labelled
//   5d. the UI's language, under the dev server, on the third deck and the list: every other page
//      is opened in English (locale en-US); in a browser set to German, Japanese or Simplified
//      Chinese (zh-CN) the controls, the presenter view (its window title too), the notes pages
//      (the step labels, before and after the number) and the list of decks speak it and say so
//      (lang); in one set to a language with no catalogue (pt-BR), English
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
//   8. a deck's window beside the list, under the dev server: /<second>#/2/1 keeps its hash and
//      its timer while / is opened, and reloaded, in another window of the same browser
//   9. createDeckApp's other cases, under the dev server (vite.config.js and src/main.js rewritten
//      for each, and then put back). On a decks folder holding the second deck alone: it opens at
//      / and at its path, and windows at / and /<second> move together, either way, / staying /
//      ("p" at / opens /<second>?presenter); createDeckApp({ deckList: 'always' }) lists it at /,
//      with its cover; createDeckApp({ deckList: 'sometimes' }) opens it, with one [arao]
//      warning. On a decks folder holding a deck that lists a theme there is not before THEME, and
//      one that lists no theme there is: / lists them with no warning, their covers in THEME and
//      in default; each opens in that theme, with one [arao] warning. On a decks folder of 14
//      decks, at 390x844: the
//      covers far below the screen are not drawn until scrolled to; a deck that throws as it is
//      drawn says "No preview" (one [arao] warning); /café is shown as such, not
//      percent-encoded
//  10. <bin> export                    no --deck: every deck, one PDF each, at its default name
//                                      (exports/<deck>.pdf); each PDF must have (its pages counted
//                                      in the file itself) as many pages as its summary line says
//                                      and as the walk counted steps (per step is the default), and
//                                      a total line all the decks; the fifth deck's says IMPORTED
//  11. <bin> export --deck <name> --per-slide   the one PDF (exports/<deck>-slides.pdf), with as
//                                      many pages as slides
//  12. <bin> export --url <a deck's URL>, against vite preview: a warning naming the base meant,
//      then it fails on the deck printed (the page says which); --url <a URL under which the
//      second deck opens>: fails on the deck printed, with no warning; both exit 1 and write
//      nothing
//  13. a site under a sub-path (vite.config.js with base: '/sub/', then put back): vite build writes
//      404.html; under vite preview /sub/ lists every deck at /sub/<name>, /sub/?deck=<name> is
//      moved to /sub/<name>, and the deck opens there; <bin> export --deck <name> prints it
//  14. the CLI's other cases, each on a decks folder of tiny decks of its own (vite.config.js
//      rewritten for each, and put back), with --out <folder> and several decks:
//        --url <vite preview of a site built under /talks/, with a deck Talks>: a warning (the
//        base is named like a deck), and every deck exported;
//        --theme THEME over a deck that lists it and one that does not (a symlink, next to a
//        dotfile deck that must not count): <deck>-THEME.pdf and <other>.pdf, whose line says it
//        fell back; --theme no deck lists: exit 1 and no PDF; a deck that throws at runtime: the
//        others exported, exit 1; decks that resolve to one file (Alpha in THEME and
//        alpha-THEME, Beta and beta): the first kept, the second failed, a warning on the case;
//        --theme IMPORTED (the theme package's) over a deck that lists it
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
// the smoke project's own theme, in src/themes/brand.css: the file's name is not the theme's (the
// plugin takes the names of its [data-theme="…"] selectors); its colours, as computed styles give
// them back, for the theme check
const THEME = 'sample'
const SAMPLE = { bg: 'rgb(16, 32, 48)', accent: 'rgb(233, 30, 99)' }
// the smoke project's shortcuts file (src/shortcuts.ts, loaded by the plugin): an added key in two
// cases (x, X), a code against a key for the same press (KeyQ → prev wins over q → next), a default
// remapped (End → first) and one turned off (PageUp)
const SHORTCUTS = `import { defineShortcuts } from '${PKG}'

export default defineShortcuts({ x: 'next', KeyQ: 'prev', q: 'next', End: 'first', PageUp: null })
`
// a web font THEME names in its font token: the build fetches it (vite/fonts.js, fontless) and
// writes its files under dist/assets/_fonts, unless the machine cannot reach the font provider
const WEB_FONT = 'Inter'
const BRAND = ['brand.css', `/* the smoke project's own theme: a [data-theme] rule in src/themes, nothing to import */
@import './parts/extra.css';
[data-theme="${THEME}"] {
  --ar-bg: ${SAMPLE.bg};
  --ar-fg: rgb(240, 240, 240);
  --ar-accent: ${SAMPLE.accent};
  --ar-font-sans: "${WEB_FONT}", sans-serif;
}
`]
// a partial brand.css @import-s, with a theme of its own: the plugin follows the @import
const EXTRA = [`parts/extra.css`, `[data-theme="${THEME}-extra"] { --ar-accent: rgb(0, 150, 136); }
`]
// a theme from a package the project installs (a local one, vendor/<HALL_PKG>, depended on with
// file:), named in arao({ themes }): its CSS in css/, the folder its package.json names
const IMPORTED = 'hall'
const HALL = { bg: 'rgb(40, 20, 10)' }
const HALL_PKG = 'arao-hall-themes'
const HALL_FILES = {
  [`vendor/${HALL_PKG}/package.json`]: JSON.stringify({ name: HALL_PKG, version: '1.0.0', arao: { themes: 'css' } }, null, 2),
  [`vendor/${HALL_PKG}/css/hall.css`]: `[data-theme="${IMPORTED}"]{--ar-bg:${HALL.bg};--ar-fg:rgb(250, 240, 230)}\n`,
}
// a theme in a second folder of the project's, src/venues
const ROOM = 'room'
const ROOM_FILE = ['src/venues/room.css', `[data-theme="${ROOM}"] { --ar-accent: rgb(63, 81, 181); }
`]
// a scoped theme package linked from outside the project (as npm link or a workspace does): a
// symlink in node_modules to a folder next to the project, its CSS in themes/ (the default)
const LINKED = 'linked'
const LINKED_PKG = '@smoke/linked-themes'
// the plugin's theme sources, in order
const THEME_SOURCES = `themes: ['src/themes', 'src/venues', '${HALL_PKG}', '${LINKED_PKG}']`
const DURATION = 15 * 60000
const SECOND = ['Second.vue', `<template lang="pug">
Deck(:themes="['default', '${THEME}']" duration="15m")
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

// a third deck of the smoke project only, with no duration (the countdown the presenter adds) and
// no themes listed (every theme there is); its second slide has notes with steps, one of them at a
// step the slide does not reach
const UNTIMED = ['Untimed.vue', `<template lang="pug">
Deck
  Slide(layout="cover" title="Untimed")
    h1 A deck without duration
  Slide
    h2 No countdown
    p(v-step="2") Until the presenter sets one.
    Notes
      p.n1 Say there is no countdown.
      p.n2(v-step="2") Then set one.
      p.n3(v-step.collapse="3") Never shown: the slide has two steps.
</template>
`]

// a fourth deck of the smoke project only: a file name and a cover heading far too long for the
// one line each has in its card, which must cut them and stay as tall as the others; its first
// theme is THEME, which its cover wears
const LONG_HEADING = 'A cover heading just as long, far longer than the one line its card keeps for it under the title'
const LONG = ['TheDeckWhoseFileName-is_so-long-that-no-card-of-the-list-could-ever-hold-it-on-one-line.vue', `<template lang="pug">
Deck(:themes="['${THEME}', 'default']")
  Slide(layout="cover" title="Long")
    h1 ${LONG_HEADING}
  Slide
    h2 A long name
    p(v-step="2") Cut in the list, whole here.
</template>
`]

// a fifth deck of the smoke project only: it lists IMPORTED, the theme package's, first
const VENUE = ['Venue.vue', `<template lang="pug">
Deck(:themes="['${IMPORTED}', 'default']")
  Slide(layout="cover" title="Venue")
    h1 A deck in a theme of its own
  Slide
    h2 From a theme package
    p(v-step="2") Listed, so worn.
</template>
`]

// the first theme each deck's cover wears in the list, by deck name, and its canvas's background
// (SAMPLE's, HALL's; null: default's, whatever it is)
const COVER_THEMES = { [basename(LONG[0], '.vue')]: [THEME, SAMPLE.bg], Venue: [IMPORTED, HALL.bg] }

// the title each deck's card must show, its file name in words, written out (not worked out the
// way the engine does): words split at a lower-to-upper case change and at - and _, the first
// letter upper case
const TITLES = {
  Playground: 'Playground',
  Second: 'Second',
  Untimed: 'Untimed',
  Venue: 'Venue',
  [basename(LONG[0], '.vue')]: 'The Deck Whose File Name is so long that no card of the list could ever hold it on one line',
}

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
  if (project && !process.env.SMOKE_KEEP) await rm(`${project}-linked`, { recursive: true, force: true })
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
      dependencies: { [PKG]: `file:${tarball}`, [HALL_PKG]: `file:./vendor/${HALL_PKG}`, vite: dev.vite, vue: dev.vue },
    }, null, 2),
    'vite.config.js': `import { defineConfig } from 'vite'\nimport arao from '${PKG}/vite'\n\nexport default defineConfig({ plugins: [arao({ ${THEME_SOURCES} })] })\n`,
    'index.html': `<!doctype html>\n<html lang="en">\n  <head><meta charset="UTF-8" /><title>smoke</title></head>\n  <body>\n    <div id="app"></div>\n    <script type="module" src="/src/main.js"></script>\n  </body>\n</html>\n`,
    'src/main.js': `import { createDeckApp } from '${PKG}'\n\ncreateDeckApp().mount('#app')\n`,
    'src/shortcuts.ts': SHORTCUTS,
    [`src/themes/${BRAND[0]}`]: BRAND[1],
    [`src/themes/${EXTRA[0]}`]: EXTRA[1],
    [ROOM_FILE[0]]: ROOM_FILE[1],
    ...HALL_FILES,
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
  await writeFile(join(project, 'src', 'decks', LONG[0]), LONG[1])
  await writeFile(join(project, 'src', 'decks', VENUE[0]), VENUE[1])
  const decks = (await readdir(join(project, 'src', 'decks'))).filter((f) => f.endsWith('.vue')).map((f) => basename(f, '.vue'))
  if (decks.length < 2) throw new Error('the project needs two decks or more to test the selector')
  log(`decks: ${decks.join(', ')}`)

  log('npm install')
  await run('npm', ['install', '--no-audit', '--no-fund'], project)
  // the linked package: outside the project, symlinked into its node_modules
  const linked = `${project}-linked`
  await mkdir(join(linked, 'themes'), { recursive: true })
  await writeFile(join(linked, 'package.json'), JSON.stringify({ name: LINKED_PKG, version: '1.0.0' }))
  await writeFile(join(linked, 'themes', 'linked.css'), `[data-theme="${LINKED}"] { --ar-accent: rgb(121, 85, 72); }\n`)
  await mkdir(join(project, 'node_modules', '@smoke'), { recursive: true })
  await symlink(linked, join(project, 'node_modules', LINKED_PKG), 'dir')

  // the project's own Vite and Playwright, as installed with the package
  const need = createRequire(join(project, 'package.json'))
  const viteJson = need.resolve('vite/package.json')
  const viteBin = join(dirname(viteJson), JSON.parse(await readFile(viteJson, 'utf8')).bin.vite)
  const { chromium } = need('playwright-core')

  // the web font THEME names: its files in the build (assets/_fonts), its @font-face in the CSS.
  // Only where the font provider can be reached (an offline machine builds without them: the
  // check says SKIPPED). Then two builds of their own (into dist-fonts, removed after): with
  // arao({ fonts: false }), and with a themes folder whose fonts are all system fonts: neither
  // writes font files, and the second says nothing about fonts
  async function webFonts() {
    const reachable = async () => {
      for (let i = 0; i < 3; i++) {
        const ok = await fetch('https://fonts.google.com/metadata/fonts', { method: 'HEAD', signal: AbortSignal.timeout(10000) }).then((r) => r.ok, () => false)
        if (ok) return true
        await new Promise((r) => setTimeout(r, 2000))
      }
      return false
    }
    const fontFiles = async (dist) => (await readdir(join(project, dist, 'assets', '_fonts')).catch(() => [])).filter((f) => f.endsWith('.woff2'))
    const assets = join(project, 'dist', 'assets')
    if (!(await fontFiles('dist')).length) {
      if (await reachable()) fail(`vite build: no web font files for "${WEB_FONT}" in dist/assets/_fonts`)
      else log('web fonts: SKIPPED: no network (the font provider cannot be reached from here)')
    } else {
      const css = (await Promise.all((await readdir(assets)).filter((f) => f.endsWith('.css')).map((f) => readFile(join(assets, f), 'utf8')))).join('\n')
      if (!new RegExp(`@font-face\\s*{[^}]*font-family:\\s*["']?${WEB_FONT}["']?\\s*;`).test(css)) fail(`vite build: no @font-face for "${WEB_FONT}" in the built CSS`)
      for (const weight of [400, 700]) {
        if (!new RegExp(`@font-face\\s*{[^}]*font-family:\\s*["']?${WEB_FONT}["']?\\s*;[^}]*font-weight:\\s*${weight}\\b`).test(css)) fail(`vite build: no ${weight} weight of "${WEB_FONT}" (bold would be faked)`)
      }
    }
    const config = (options) => `import { defineConfig } from 'vite'\nimport arao from '${PKG}/vite'\n\nexport default defineConfig({ plugins: [arao(${options})], build: { outDir: 'dist-fonts' } })\n`
    await writeFile(join(project, 'vite.fonts.config.js'), config('{ fonts: false }'))
    await run(process.execPath, [viteBin, 'build', '--config', 'vite.fonts.config.js'], project)
    if ((await fontFiles('dist-fonts')).length) fail('vite build with arao({ fonts: false }): font files in dist-fonts/assets/_fonts')
    await mkdir(join(project, 'src', 'themes-system'), { recursive: true })
    await writeFile(join(project, 'src', 'themes-system', 'plain.css'), '[data-theme="plain"] { --ar-font-sans: Arial, Helvetica, "Segoe UI", sans-serif; --ar-font-mono: Menlo, Consolas, monospace; }\n')
    await writeFile(join(project, 'vite.fonts.config.js'), config(`{ themes: 'src/themes-system' }`))
    const { code, out, err } = await exec(process.execPath, [viteBin, 'build', '--config', 'vite.fonts.config.js'], project)
    if (code !== 0) fail(`vite build with system fonts only exited with ${code}`)
    if ((await fontFiles('dist-fonts')).length) fail('vite build with system fonts only: font files in dist-fonts/assets/_fonts')
    if (/\[fontless\]/.test(out + err)) fail(`vite build with system fonts only: fontless said something:\n${(out + err).split('\n').filter((l) => l.includes('[fontless]')).join('\n')}`)
    await Promise.all(['vite.fonts.config.js', 'dist-fonts', 'src/themes-system'].map((p) => rm(join(project, p), { recursive: true, force: true })))
  }

  // the build's 404.html: a copy of its index.html (static hosts answer a deck's path with it)
  async function notFoundPage(what) {
    const [index, page] = await Promise.all(['index.html', '404.html'].map((f) => readFile(join(project, 'dist', f), 'utf8').catch(() => null)))
    if (page == null) fail(`${what}: no dist/404.html`)
    else if (page !== index) fail(`${what}: dist/404.html is not a copy of dist/index.html`)
  }

  log('vite build')
  await run(process.execPath, [viteBin, 'build'], project)
  await notFoundPage('vite build')
  await webFonts()

  // theme sources the build turns down, or warns about: a package not installed, one that gives no
  // theme, one whose package.json names a folder outside it, a bare name that is a folder at the
  // root (the "./" hint); a name two sources give (one warning, the build passes), and a source
  // named twice ('src/themes' and './src/themes': no warning about its own names)
  {
    const config = files['vite.config.js']
    const fake = async (name, meta, css) => {
      const dir = join(project, 'node_modules', name)
      await mkdir(join(dir, 'themes'), { recursive: true })
      await writeFile(join(dir, 'package.json'), JSON.stringify({ name, version: '1.0.0', ...meta }))
      await writeFile(join(dir, 'themes', 'shared.css'), css)
    }
    await fake('arao-empty-themes', {}, ':root { --x: 1; }\n')
    await fake('arao-escape-themes', { arao: { themes: '../../src/themes' } }, '[data-theme="x"] {}\n')
    await mkdir(join(project, 'src', 'dupes'), { recursive: true })
    await writeFile(join(project, 'src', 'dupes', 'room.css'), `[data-theme="${ROOM}"] { --ar-accent: rgb(1, 1, 1); }\n`)
    const cases = [
      { add: ['arao-no-such-themes'], says: /\[arao\] themes: no package "arao-no-such-themes" installed/ },
      { add: ['arao-empty-themes'], says: /\[arao\] themes: package "arao-empty-themes" gives no theme/ },
      { add: ['arao-escape-themes'], says: /\[arao\] themes: package "arao-escape-themes" names "\.\.\/\.\.\/src\/themes" .*must be a folder inside the package/ },
      { add: ['vendor'], says: /\[arao\] themes: "vendor" is read as a package's name.*There is a folder "vendor" at the root: write "\.\/vendor"/ },
      { add: ['./src/dupes', './src/themes'], passes: true, says: new RegExp(`\\[arao\\] theme "${ROOM}" is in src/venues and in \\./src/dupes: it is offered once; both apply`), not: /\[arao\] theme "sample/ },
    ]
    try {
      for (const c of cases) {
        const what = `vite build with the theme sources + ${c.add.join(', ')}`
        await writeFile(join(project, 'vite.config.js'), config.replace(`'${HALL_PKG}'`, `'${HALL_PKG}', ${c.add.map((a) => `'${a}'`).join(', ')}`))
        const { code, out, err } = await exec(process.execPath, [viteBin, 'build'], project)
        const said = out + err
        if (c.passes ? code !== 0 : code === 0) fail(`${what}: exited with ${code}`)
        else if (!c.says.test(said)) fail(`${what}: nothing matching ${c.says}`)
        else if (c.not?.test(said)) fail(`${what}: says ${c.not}`)
        else console.log(`  theme sources + ${c.add.join(', ')}: ${c.passes ? 'builds, warning once' : 'the build stops, saying why'}`)
      }
    } finally {
      await writeFile(join(project, 'vite.config.js'), config)
      for (const p of ['arao-empty-themes', 'arao-escape-themes']) await rm(join(project, 'node_modules', p), { recursive: true, force: true })
      await rm(join(project, 'src', 'dupes'), { recursive: true, force: true })
    }
    await run(process.execPath, [viteBin, 'build'], project) // the project's own build back in dist/
  }

  // a shortcuts file the build turns down (vite/shortcuts.js, checked when Vite starts): a reserved
  // key, a value that is no command, two spellings of one key; each stops vite build naming the file
  {
    const file = join(project, 'src', 'shortcuts.ts')
    const cases = [
      { map: "{ Escape: 'next' }", says: /\[arao\] src\/shortcuts\.ts: "Escape" is reserved/ },
      { map: "{ z: 'nope' }", says: /\[arao\] src\/shortcuts\.ts: "z" → "nope" is no command/ },
      { map: "{ Space: 'next', ' ': 'prev' }", says: /\[arao\] src\/shortcuts\.ts: "Space" and " " are the same key/ },
    ]
    try {
      for (const c of cases) {
        await writeFile(file, `export default ${c.map}\n`)
        const { code, out, err } = await exec(process.execPath, [viteBin, 'build'], project)
        if (code === 0) fail(`vite build with shortcuts ${c.map}: passed`)
        else if (!c.says.test(out + err)) fail(`vite build with shortcuts ${c.map}: nothing matching ${c.says}`)
        else console.log(`  shortcuts ${c.map}: the build stops, naming the file`)
      }
    } finally {
      await writeFile(file, SHORTCUTS)
    }
    await run(process.execPath, [viteBin, 'build'], project)
  }

  browser = await chromium.launch({ executablePath: process.env.ARAO_CHROMIUM || undefined })
  // every page in English (the engine's UI text follows the browser's language, i18n/i18n.ts),
  // whatever the machine's, unless a context asks for another locale (5d)
  const newContext = browser.newContext.bind(browser)
  browser.newContext = (options = {}) => newContext({ locale: 'en-US', ...options })
  browser.newPage = async (options = {}) => {
    const context = await browser.newContext(options)
    const page = await context.newPage()
    page.on('close', () => context.close().catch(() => {}))
    return page
  }

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
    // each card's link and title as the list first renders them, before the first paint: a cover
    // is drawn later, once its card is seen and its deck loaded (covers counts any that were)
    await context.addInitScript(() => {
      new MutationObserver((_, watch) => {
        const cards = [...document.querySelectorAll('.ar-decks-card')]
        if (!cards.length) return
        watch.disconnect()
        window.__firstRender = {
          covers: document.querySelectorAll('.ar-thumb').length,
          cards: cards.map((c) => [c.querySelector('a')?.getAttribute('href'), c.querySelector('.ar-decks-title')?.textContent.trim() ?? null]),
        }
      }).observe(document, { childList: true, subtree: true })
    })
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
    // every card has its deck's cover drawn in it; its title, the file name in words (TITLES), is
    // there from the list's first render and stays (no title changes under the reader); the second
    // and the long deck's cards show their cover's heading under it; each path shown is its
    // link's, decoded; every card is as tall as the others, its title, cover heading and path on
    // one line each, the long deck's cut; and the page is where it was
    const card = (href) => decks.find((d) => href?.split('?')[0] === `${site}${encodeURIComponent(d.toLowerCase())}`)
    const named = (cards) => cards.map(([, title]) => JSON.stringify(title)).join(', ')
    const covers = async (where) => {
      const was = await page.evaluate(() => location.href)
      const first = await page.evaluate(() => window.__firstRender ?? null)
      if (!first) complaints.push(`${where}: no card in the list's first render`)
      else {
        if (first.covers) complaints.push(`${where}: ${first.covers} covers drawn in the list's first render: its titles were not read before the covers`)
        if (first.cards.length !== decks.length) complaints.push(`${where}: ${first.cards.length} cards in the list's first render, not ${decks.length}`)
        for (const [href, title] of first.cards) {
          const want = TITLES[card(href)]
          if (want == null) complaints.push(`${where}: no title written down for the card of ${href} (TITLES)`)
          else if (title !== want) complaints.push(`${where}: the card of ${href} is titled ${JSON.stringify(title)} in the list's first render, not ${JSON.stringify(want)} (its file name in words)`)
        }
      }
      const drawn = await page.waitForFunction((n) => {
        const cards = [...document.querySelectorAll('.ar-decks-card')]
        return cards.length === n && cards.every((c) => c.querySelector('.ar-thumb .ar-slide'))
      }, decks.length, { timeout: 30_000 }).then(() => true, () => false)
      if (!drawn) complaints.push(`${where}: not every card has its cover drawn in it (.ar-thumb .ar-slide)`)
      const headings = [MARK, LONG_HEADING]
      const titled = await page.waitForFunction((want) => {
        const shown = [...document.querySelectorAll('.ar-decks-sub')].map((t) => t.textContent.trim())
        return want.every((w) => shown.includes(w))
      }, headings, { timeout: 10_000 }).then(() => true, () => false)
      if (!titled) complaints.push(`${where}: not every cover heading of ${headings.map((h) => `"${h}"`).join(', ')} shows under its card's title (${(await page.locator('.ar-decks-sub').allTextContents()).join(', ')})`)
      const now = await page.locator('.ar-decks-card').evaluateAll((cs) => cs.map((c) => [c.querySelector('a')?.getAttribute('href'), c.querySelector('.ar-decks-title')?.textContent.trim() ?? null]))
      if (first && JSON.stringify(now) !== JSON.stringify(first.cards)) complaints.push(`${where}: the titles changed once the covers were drawn, from ${named(first.cards)} to ${named(now)}`)
      const long = `${site}${encodeURIComponent(basename(LONG[0], '.vue').toLowerCase())}`
      const shape = await page.evaluate((long) => {
        const cards = [...document.querySelectorAll('.ar-decks-card')]
        const tenth = (n) => Math.round(n * 10) / 10
        const heights = cards.map((c) => tenth(c.getBoundingClientRect().height))
        // what each card's content takes, its top to its path's line: the grid stretches the cards
        // of a row to its tallest, so a taller one shows here even with no other row to differ from
        const inner = cards.map((c) => tenth(c.querySelector('.ar-decks-foot').getBoundingClientRect().bottom - c.getBoundingClientRect().top))
        const paths = cards.map((c) => [c.querySelector('.ar-decks-path').textContent.trim(), decodeURIComponent(c.querySelector('a').getAttribute('href').split('?')[0])])
        // the lines a text is laid out on: the distinct tops of its boxes (cut or not, there they all are)
        const lines = (el) => {
          const r = document.createRange()
          r.selectNodeContents(el)
          return new Set([...r.getClientRects()].filter((b) => b.width && b.height).map((b) => Math.round(b.top))).size
        }
        const parts = ['.ar-decks-title', '.ar-decks-sub', '.ar-decks-path']
        const wrapped = cards.flatMap((c) => parts.map((p) => [c.querySelector('a').getAttribute('href'), p, c.querySelector(p)])
          .filter(([, , el]) => el && lines(el) > 1).map(([href, p, el]) => `${p} of ${href} (${lines(el)} lines)`))
        const longCard = cards.find((c) => c.querySelector('a').getAttribute('href').split('?')[0] === long)
        const whole = longCard && parts.filter((p) => {
          const el = longCard.querySelector(p)
          return !el || el.scrollWidth <= el.clientWidth
        })
        return { heights, inner, wrong: paths.filter(([shown, link]) => shown !== link), wrapped, whole }
      }, long)
      // (a pixel apart at most: the grid's columns round their widths, and so their covers' heights)
      if (Math.max(...shape.heights) - Math.min(...shape.heights) > 1) complaints.push(`${where}: the cards are not as tall as each other (${shape.heights.join(', ')} px)`)
      if (Math.max(...shape.inner) - Math.min(...shape.inner) > 1) complaints.push(`${where}: the cards' contents are not as tall as each other (${shape.inner.join(', ')} px): a gap inside the shorter ones of a row`)
      if (shape.wrapped.length) complaints.push(`${where}: text on more than its one line: ${shape.wrapped.join(', ')}`)
      if (!shape.whole) complaints.push(`${where}: no card links to ${long}, the long deck`)
      else if (shape.whole.length) complaints.push(`${where}: the long deck's card shows ${shape.whole.join(', ')} whole, not cut on its one line`)
      for (const [shown, link] of shape.wrong) complaints.push(`${where}: a card shows the path ${shown}, its link goes to ${link}`)
      if (await page.locator('.ar-decks :is(.ar-presenter, .ar-controls, .ar-export)').count()) complaints.push(`${where}: a cover is drawn as something else than a thumbnail`)
      // each cover wears its deck's first theme (COVER_THEMES, else default), on its canvas too
      const worn = await page.locator('.ar-decks-card').evaluateAll((cs) => cs.map((c) => [c.querySelector('a')?.getAttribute('href'),
        c.querySelector('.ar-thumb')?.dataset.theme ?? null, c.querySelector('.ar-thumb .ar-canvas') && getComputedStyle(c.querySelector('.ar-thumb .ar-canvas')).backgroundColor]))
      for (const [href, theme, bg] of worn) {
        const [want, wantBg] = COVER_THEMES[card(href)] ?? ['default', null]
        if (theme !== want || (wantBg && bg !== wantBg)) complaints.push(`${where}: the cover of ${href} wears "${theme}" (background ${bg}), not ${want}${wantBg ? ` (${wantBg})` : ''}`)
      }
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
      const query = `theme=${THEME}&presenter`
      await page.goto(new URL(`?${query}#/2/1`, base).href)
      await listed(`${site}?${query}#/2/1`, `?${query}`)
      await covers(`${site}?${query}#/2/1`)
      // the old form: moved to the path, with the rest of the query and the hash (and the name as
      // the list writes it)
      const old = `?deck=${second.toUpperCase()}&theme=${THEME}#/2/1`
      await page.goto(new URL(old, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 }).catch(() => {})
      await pause(300)
      const moved = await page.evaluate(() => location.pathname + location.search + location.hash)
      const meant = `${site}${second}?theme=${THEME}#/2/1`
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

  // the controls (components/internal/Controls.vue), in the audience view of the playground's deck:
  // their keys open and close the jump list (g, Escape) and move the deck; a typed slide number
  // jumps with no list; the project's src/shortcuts.ts remaps, adds and turns off keys; auto-hide: hidden
  // until the mouse moves, shown on a move, hidden again 2.5 s later; a tap in the middle (touch)
  // shows them, another hides them; a tap on a side quarter moves the deck without showing them;
  // the cursor hides after hideCursorAfter. Any console warning, error or page error fails.
  async function controls(base) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, hasTouch: true })
    const page = await context.newPage()
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const state = () => page.evaluate(() => ({
      hash: location.hash,
      visible: !!document.querySelector('.ar-controls.visible'),
      list: !!document.querySelector('.ar-slides'),
      query: document.querySelector('.ar-slides .ar-search')?.value ?? null,
    }))
    try {
      await page.goto(new URL('playground', base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(500)
      let s = await state()
      if (s.visible) complaints.push('the controls show before the mouse moves')
      await page.keyboard.press('g')
      await pause(300)
      s = await state()
      if (!s.list) complaints.push('g opens no jump list')
      await page.keyboard.press('Escape')
      await pause(300)
      if ((await state()).list) complaints.push('Escape leaves the jump list open')
      // typing a slide number jumps with nothing on screen (composables/useSlideNumber.ts)
      await page.keyboard.press('3')
      await pause(300)
      s = await state()
      if (s.list) complaints.push('a digit opens the jump list (the jump by number is invisible)')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => location.hash.startsWith('#/3/'), null, { timeout: 5_000 }).catch(() => {})
      await pause(200)
      s = await state()
      if (s.hash !== '#/3/1' || s.list) complaints.push(`3 then Enter: ${s.hash}, list ${s.list ? 'open' : 'closed'}, not #/3/1 and closed (Enter must not also move on)`)
      // a number that is no slide does nothing
      await page.keyboard.press('9'); await page.keyboard.press('9'); await page.keyboard.press('Enter')
      await pause(300)
      if ((await state()).hash !== '#/3/1') complaints.push(`99 then Enter moved the deck to ${(await state()).hash}`)
      // Backspace deletes a digit: 4, Backspace, 2, Enter → slide 2
      for (const k of ['4', 'Backspace', '2', 'Enter']) await page.keyboard.press(k)
      await page.waitForFunction(() => location.hash === '#/2/1', null, { timeout: 5_000 }).catch(() => {})
      if ((await state()).hash !== '#/2/1') complaints.push(`4, Backspace, 2, Enter: ${(await state()).hash}, not #/2/1`)
      // Escape clears a typed number: 5, Escape, Enter is a plain next (one step on, not slide 5)
      await page.keyboard.press('5'); await page.keyboard.press('Escape'); await page.keyboard.press('Enter')
      await pause(300)
      s = await state()
      if (s.hash === '#/2/1' || s.hash.startsWith('#/5/')) complaints.push(`5, Escape, Enter: ${s.hash}, not one step past #/2/1`)
      // the project's src/shortcuts.ts (SHORTCUTS): x and X add next, the code KeyQ (q) prev,
      // End remapped to first, PageUp turned off (the browser's: not prevented, no move)
      await page.keyboard.press('Home')
      await page.waitForFunction(() => location.hash === '#/1/1', null, { timeout: 5_000 }).catch(() => {})
      const at = async () => (await state()).hash
      await page.keyboard.press('x')
      await pause(250)
      const afterX = await at()
      if (afterX === '#/1/1') complaints.push('shortcuts file: x (added → next) does not move the deck')
      await page.keyboard.press('Shift+X')
      await pause(250)
      if ((await at()) === afterX) complaints.push('shortcuts file: X (Shift+x, letters match either case) does not move the deck')
      await page.keyboard.press('q')
      await pause(250)
      if ((await at()) !== afterX) complaints.push(`shortcuts file: q (code KeyQ → prev, over q → next) leaves ${await at()}, not ${afterX}`)
      await page.keyboard.press('End')
      await page.waitForFunction(() => location.hash === '#/1/1', null, { timeout: 5_000 }).catch(() => {})
      if ((await at()) !== '#/1/1') complaints.push(`shortcuts file: End (remapped → first) leaves ${await at()}, not #/1/1`)
      await page.evaluate(() => {
        window.__arPrevented = null
        window.addEventListener('keydown', (e) => { if (e.key === 'PageUp') setTimeout(() => (window.__arPrevented = e.defaultPrevented)) })
      })
      await page.keyboard.press('ArrowRight')
      await pause(250)
      const beforeUp = await at()
      await page.keyboard.press('PageUp')
      await pause(250)
      if ((await at()) !== beforeUp) complaints.push('shortcuts file: PageUp (turned off) still moves the deck')
      if (await page.evaluate(() => window.__arPrevented) !== false) complaints.push('shortcuts file: PageUp (turned off) is not left to the browser')
      await page.keyboard.press('Home')
      await page.keyboard.press('ArrowRight')
      await pause(200)
      await page.keyboard.press('Home')
      await page.waitForFunction(() => location.hash === '#/1/1', null, { timeout: 5_000 }).catch(() => {})
      if ((await state()).hash !== '#/1/1') complaints.push('Home does not go back to #/1/1')
      if ((await state()).visible) complaints.push('keys showed the controls')
      // auto-hide
      await page.mouse.move(400, 400)
      await page.mouse.move(420, 410)
      await pause(300)
      if (!(await state()).visible) complaints.push('a mouse move does not show the controls')
      await pause(2800)
      if ((await state()).visible) complaints.push('the controls stay shown 2.5 s after the mouse stopped')
      // a tap in the middle shows them, another hides them (the tap's echo mousemove is not the mouse)
      await page.touchscreen.tap(960, 400)
      await pause(400)
      if (!(await state()).visible) complaints.push('a tap in the middle does not show the controls')
      await page.touchscreen.tap(960, 400)
      await pause(400)
      if ((await state()).visible) complaints.push('a second tap in the middle does not hide the controls')
      if ((await state()).hash !== '#/1/1') complaints.push('a tap in the middle moved the deck')
      // a tap on the right quarter moves on, one on the left goes back; neither shows the controls
      await page.touchscreen.tap(1800, 400)
      await page.waitForFunction(() => location.hash !== '#/1/1', null, { timeout: 5_000 }).catch(() => {})
      s = await state()
      if (s.hash === '#/1/1') complaints.push('a tap on the right quarter does not move the deck')
      if (s.visible) complaints.push('a tap on the right quarter showed the controls')
      await page.touchscreen.tap(120, 400)
      await page.waitForFunction(() => location.hash === '#/1/1', null, { timeout: 5_000 }).catch(() => {})
      s = await state()
      if (s.hash !== '#/1/1') complaints.push(`a tap on the left quarter leaves ${s.hash}, not #/1/1`)
      if (s.visible) complaints.push('a tap on the left quarter showed the controls')
      // the cursor: shown on a move, hidden after hideCursorAfter (5 s by default) without one
      const cursorHidden = () => page.evaluate(() => !!document.querySelector('.ar-viewport.ar-nocursor'))
      await page.mouse.move(600, 600)
      await pause(300)
      if (await cursorHidden()) complaints.push('the cursor is hidden right after a mouse move')
      await pause(5400)
      if (!(await cursorHidden())) complaints.push('the cursor is still shown 5 s after the mouse stopped')
      console.log(`  dev controls: ${complaints.length ? 'problems below' : 'keys, jump list, auto-hide, taps and cursor as expected'}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev controls: ${c}`)
  }

  // speaker notes, on the third deck (5c above); any console warning, error or page error fails
  async function notes(base) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
    const page = await context.newPage()
    const complaints = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const open = async (query) => {
      await page.goto(new URL(`${untimed}${query}`, base).href)
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(400)
    }
    const panel = () => page.evaluate(() => {
      const out = document.querySelector('.ar-notes-target')
      const shown = (c) => { const el = out?.querySelector(c); return !!el && !el.closest('.ar-step-hidden, .ar-step-collapsed') }
      return {
        notes: out?.querySelectorAll('.ar-note').length ?? -1,
        n1: shown('.n1'), n2: shown('.n2'), n3: shown('.n3'),
        fresh: [...(out?.querySelectorAll('.ar-note-fresh') ?? [])].map((e) => e.className.split(' ')[0]),
        empty: getComputedStyle(document.querySelector('.ar-p-empty')).display !== 'none',
        steps: document.querySelector('.ar-p-notes .ar-p-detail')?.textContent.trim() ?? '',
      }
    })
    try {
      // the audience: two steps on the second slide
      await open('#/2/1')
      await page.keyboard.press('ArrowRight'); await pause(200)
      await page.keyboard.press('ArrowRight'); await pause(200)
      const after = await page.evaluate(() => location.hash)
      if (after !== '#/2/2') complaints.push(`audience: two presses from #/2/1 lead to ${after}, not #/2/2 (a v-step in Notes added a step?)`)
      await open('?presenter#/2/1')
      const one = await panel()
      if (one.notes !== 1) complaints.push(`presenter #/2/1: ${one.notes} notes in the panel, not 1 (the preview's?)`)
      if (!one.n1 || one.n2 || one.n3) complaints.push(`presenter #/2/1: shown n1 ${one.n1}, n2 ${one.n2}, n3 ${one.n3}; want only n1`)
      if (one.steps !== 'Step 1 of 2') complaints.push(`presenter #/2/1: the panel says "${one.steps}", not "Step 1 of 2"`)
      await page.keyboard.press('ArrowRight'); await pause(400)
      const two = await panel()
      if (!two.n1 || !two.n2 || two.n3) complaints.push(`presenter #/2/2: shown n1 ${two.n1}, n2 ${two.n2}, n3 ${two.n3}; want n1 and n2`)
      if (two.fresh.join() !== 'n2') complaints.push(`presenter #/2/2: marked as new: [${two.fresh}], not [n2]`)
      await open('?presenter#/1/1')
      const cover = await panel()
      if (cover.notes !== 0 || !cover.empty) complaints.push(`presenter on the cover (no notes): ${cover.notes} notes, empty notice ${cover.empty}`)
      // the export's notes pages: one, for the second slide, every step of its notes, labelled
      await open('?export&notes')
      await page.waitForSelector('.ar-export-done', { timeout: 60_000 })
      const pages = await page.evaluate(() => [...document.querySelectorAll('.ar-notes-page')].map((pg) => ({
        head: pg.querySelector('.ar-notes-head')?.textContent ?? '',
        shown: ['.n1', '.n2', '.n3'].map((c) => { const el = pg.querySelector(c); return !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).opacity === '1' }),
        label: getComputedStyle(pg.querySelector('.n2'), '::before').content,
      })))
      if (pages.length !== 1 || !pages[0].head.startsWith('Slide 2')) complaints.push(`export: notes pages [${pages.map((p) => p.head)}], want one for slide 2`)
      else {
        if (pages[0].shown.some((v) => !v)) complaints.push(`export: notes shown [${pages[0].shown}], want every step`)
        if (!pages[0].label.includes('From step')) complaints.push(`export: the step-2 note is labelled ${pages[0].label}`)
      }
      console.log(`  dev speaker notes: ${complaints.length ? 'problems below' : 'their steps follow the slide, drawn in the presenter and the notes pages'}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev speaker notes: ${c}`)
  }

  // the engine's UI text in the browser's language (5d above), each language in a context of its
  // own: the controls, the presenter view, the list of decks and the notes pages; any console
  // warning, error or page error fails
  async function languages(base) {
    const complaints = []
    const LANGS = [
      // locale, the lang the UI says, the first button's title, the "next" panel, the presenter's
      // window title, the list's heading, a step's label on the notes pages (its two halves)
      { locale: 'de-DE', lang: 'de', first: 'Erste (Pos1)', next: 'Als Nächstes', window: 'Referent · ', heading: 'Präsentationen', head: 'Folie 2', label: ['Ab Schritt ', ''] },
      { locale: 'ja-JP', lang: 'ja', first: '最初へ (Home)', next: '次', window: '発表者 · ', heading: 'プレゼンテーション', head: 'スライド 2', label: ['ステップ ', ' から'] },
      { locale: 'zh-CN', lang: 'zh-Hans', first: '第一页 (Home)', next: '下一步', window: '演讲者 · ', heading: '演示文稿', head: '第 2 张幻灯片', label: ['从第 ', ' 步起'] },
      // no catalogue: English
      { locale: 'pt-BR', lang: 'en', first: 'First (Home)', next: 'Next', window: 'Presenter · ', heading: 'Decks', head: 'Slide 2', label: ['From step ', ''] },
    ]
    for (const want of LANGS) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: want.locale })
      const page = await context.newPage()
      const said = (what) => `${want.locale}: ${what}`
      page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(said(`console ${m.type()}: ${m.text()}`)))
      page.on('pageerror', (e) => complaints.push(said(`page error: ${e.message}`)))
      const open = async (path) => {
        await page.goto(new URL(path, base).href)
        await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
        await pause(400)
      }
      try {
        await open(untimed)
        const audience = await page.evaluate(() => ({
          lang: document.querySelector('.ar-controls')?.lang,
          first: document.querySelector('.ar-controls .ar-btn')?.title,
        }))
        if (audience.lang !== want.lang || audience.first !== want.first)
          complaints.push(said(`the controls say lang "${audience.lang}", first button "${audience.first}"; want "${want.lang}", "${want.first}"`))
        await open(`${untimed}?presenter`)
        const presenter = await page.evaluate(() => ({
          lang: document.querySelector('.ar-presenter')?.lang,
          next: document.querySelector('.ar-p-next .ar-p-label span')?.textContent.trim(),
          title: document.title,
        }))
        if (presenter.lang !== want.lang || presenter.next !== want.next || !presenter.title.startsWith(want.window))
          complaints.push(said(`the presenter view says lang "${presenter.lang}", "${presenter.next}", window "${presenter.title}"; want "${want.lang}", "${want.next}", "${want.window}…"`))
        await open(`${untimed}?export&notes`)
        await page.waitForSelector('.ar-export-done', { timeout: 60_000 })
        const notes = await page.evaluate(() => {
          const pg = document.querySelector('.ar-notes-page')
          return { head: pg?.querySelector('.ar-notes-head')?.textContent ?? '', label: pg ? getComputedStyle(pg.querySelector('.n2'), '::before').content : '' }
        })
        // the label of the note at step 2, as drawn (its computed content: one string)
        const label = JSON.stringify(want.label.join('2'))
        if (!notes.head.startsWith(want.head) || notes.label !== label)
          complaints.push(said(`the notes page heads "${notes.head}", labels a step ${notes.label}; want "${want.head}…", ${label}`))
        await page.goto(base)
        const list = await page.locator('.ar-decks-heading').textContent({ timeout: 30_000 }).catch(() => null)
        const listLang = await page.evaluate(() => document.querySelector('.ar-decks')?.lang)
        if (list?.trim() !== want.heading || listLang !== want.lang)
          complaints.push(said(`the list of decks is headed "${list}", lang "${listLang}"; want "${want.heading}", "${want.lang}"`))
      } finally {
        await context.close()
      }
    }
    console.log(`  dev UI language: ${complaints.length ? 'problems below' : `${LANGS.map((l) => `${l.locale} → ${l.lang}`).join(', ')}`}`)
    for (const c of complaints) fail(`dev UI language: ${c}`)
  }

  // themes, on the third deck (no themes listed) and the fifth (IMPORTED first), each check in a
  // page of its own; any console warning, error or page error fails
  async function themes(base) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const complaints = []
    const open = async (query, style, deck = untimed) => {
      const page = await context.newPage()
      page.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`${deck}${query}: console ${m.type()}: ${m.text()}`))
      page.on('pageerror', (e) => complaints.push(`${deck}${query}: page error: ${e.message}`))
      await page.goto(new URL(`${deck}${query.replace(/^&/, '?')}`, base).href)
      if (style) await page.addStyleTag({ content: style })
      await page.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
      return page
    }
    // the theme worn (the viewport's), the canvas's background, the title colour of slide 2 (an
    // h2: its default is the accent), and the root's --ar-bg (a default)
    const look = (page) => page.evaluate(() => {
      const css = (el, p) => (el ? getComputedStyle(el).getPropertyValue(p).trim() : null)
      const title = document.querySelectorAll('.ar-slide')[1]?.querySelector('h2')
      return {
        theme: document.querySelector('.ar-viewport')?.dataset.theme,
        bg: css(document.querySelector('.ar-canvas'), 'background-color'),
        title: css(title, 'color'),
        root: css(document.documentElement, '--ar-bg'),
        picker: document.querySelectorAll('.ar-controls .ar-btn[title^="Theme"]').length,
      }
    })
    // the theme picker, opened: each theme's name and its swatch (its painted gradient)
    const picker = async (page) => {
      await page.evaluate(() => document.querySelector('.ar-controls .ar-btn[title^="Theme"]')?.click())
      await page.waitForSelector('.ar-themes .swatch', { timeout: 5_000 }).catch(() => {})
      return page.evaluate(() => [...document.querySelectorAll('.ar-themes .ar-item')].map((item) => ({
        name: item.querySelector('.t')?.textContent.trim(),
        swatch: getComputedStyle(item.querySelector('.swatch')).backgroundImage,
      })))
    }
    try {
      let page = await open('')
      const plain = await look(page)
      if (plain.theme !== 'default') complaints.push(`no ?theme=: wears "${plain.theme}", not default`)
      if (!plain.root) complaints.push('no default --ar-bg at the root')
      if (!plain.picker) complaints.push('no theme picker in the controls: the deck has one theme, not default and ' + THEME)
      // every theme there is: THEME-extra comes from a partial of brand.css (the plugin follows it)
      const offered = (await picker(page)).map((t) => t.name)
      const all = ['default', THEME, `${THEME}-extra`, ROOM, IMPORTED, LINKED]
      if (JSON.stringify(offered) !== JSON.stringify(all)) complaints.push(`the picker offers ${offered.join(', ') || 'nothing'}, not ${all.join(', ')}`)
      await page.keyboard.press('Escape')
      await page.keyboard.press('t')
      await page.waitForFunction((t) => document.querySelector('.ar-viewport')?.dataset.theme === t, THEME, { timeout: 5_000 }).catch(() => {})
      const cycled = await look(page)
      if (cycled.theme !== THEME || cycled.bg !== SAMPLE.bg) complaints.push(`t: wears "${cycled.theme}" (background ${cycled.bg}), not ${THEME} (${SAMPLE.bg})`)
      await page.close()

      page = await open(`&theme=${THEME}`)
      const asked = await look(page)
      if (asked.theme !== THEME || asked.bg !== SAMPLE.bg || asked.title !== SAMPLE.accent)
        complaints.push(`?theme=${THEME}: wears "${asked.theme}" (background ${asked.bg}, h2 ${asked.title}), not ${THEME} (${SAMPLE.bg}, ${SAMPLE.accent})`)
      await page.close()

      // outside every theme: the presenter view (its notes, its controls) still reads the defaults;
      // on slide 2 (two steps), its docked controls show the step dots, the first one in their accent
      const presenter = (page) => page.evaluate(() => {
        const box = document.querySelector('.ar-p-notes-body') ?? document.querySelector('.ar-presenter')
        const css = (p) => getComputedStyle(box).getPropertyValue(p).trim()
        const dot = document.querySelector('.ar-controls.docked .ar-dot.on')
        const root = getComputedStyle(document.documentElement)
        return { placeholder: css('--ar-placeholder'), bg: css('--ar-bg'), root: root.getPropertyValue('--ar-bg').trim(),
          dot: dot && getComputedStyle(dot).backgroundColor, shadow: root.getPropertyValue('--ar-presenter-shadow') }
      })
      page = await open('&presenter#/2/1')
      const outside = await presenter(page)
      if (outside.placeholder !== 'currentColor' || !outside.bg || outside.bg !== outside.root)
        complaints.push(`presenter view, outside every theme: --ar-placeholder "${outside.placeholder}", --ar-bg "${outside.bg}" (the root's: "${outside.root}")`)
      const FG = 'rgba(255, 255, 255, 0.94)' // --ar-controls-fg, the docked controls' accent unless set
      if (outside.dot !== FG) complaints.push(`presenter view: the docked controls' step dot is ${outside.dot}, not their text colour ${FG}`)
      await page.close()
      // :root rules reach the presenter view: the docked controls' accent, and the length editor's
      // shadow, which follows the presenter's background
      const ACCENT = 'rgb(4, 5, 6)'
      const PBG = 'rgb(7, 8, 9)'
      page = await open('&presenter#/2/1', `:root { --ar-controls-accent: ${ACCENT}; --ar-presenter-bg: ${PBG}; }`)
      const set = await presenter(page)
      if (set.dot !== ACCENT) complaints.push(`:root { --ar-controls-accent: ${ACCENT} }: the docked controls' step dot is ${set.dot}`)
      if (!set.shadow.includes(PBG)) complaints.push(`:root { --ar-presenter-bg: ${PBG} }: --ar-presenter-shadow is "${set.shadow.trim()}", not drawn from it`)
      await page.close()

      // a :root rule of the project's own wins over a default, and the h2 title (whose default is
      // the accent) follows it; a theme's own value wins over the rule
      const MINE = 'rgb(1, 2, 3)'
      page = await open('', `:root { --ar-accent: ${MINE}; }`)
      const mine = await look(page)
      if (mine.title !== MINE) complaints.push(`:root { --ar-accent: ${MINE} }: the h2 title is ${mine.title}, not ${MINE}`)
      // the picker's swatches: default's shows the rule (what default wears), THEME's its own accent
      const swatches = Object.fromEntries((await picker(page)).map((t) => [t.name, t.swatch]))
      if (!swatches.default?.includes(MINE)) complaints.push(`:root { --ar-accent: ${MINE} }: the swatch of default is ${swatches.default}`)
      if (!swatches[THEME]?.includes(SAMPLE.accent)) complaints.push(`:root { --ar-accent: ${MINE} }: the swatch of ${THEME} is ${swatches[THEME]}, not its own accent ${SAMPLE.accent}`)
      await page.close()
      page = await open(`&theme=${THEME}`, `:root { --ar-accent: ${MINE}; }`)
      const over = await look(page)
      if (over.title !== SAMPLE.accent) complaints.push(`:root { --ar-accent } and ?theme=${THEME}: the h2 title is ${over.title}, not the theme's ${SAMPLE.accent}`)
      await page.close()

      // a theme added to the linked package (outside the root) while the dev server runs: offered
      // by the next page (the plugin watches the package where its files are)
      const LATE = 'late'
      await writeFile(join(`${project}-linked`, 'themes', 'late.css'), `[data-theme="${LATE}"] { --ar-accent: rgb(2, 2, 2); }\n`)
      try {
        let offeredLate = []
        for (let i = 0; i < 20 && !offeredLate.includes(LATE); i++) {
          await pause(500)
          page = await open('')
          offeredLate = (await picker(page)).map((t) => t.name)
          await page.close()
        }
        if (!offeredLate.includes(LATE)) complaints.push(`a theme added to the linked package (${LATE}) is not offered: ${offeredLate.join(', ')}`)
      } finally {
        await rm(join(`${project}-linked`, 'themes', 'late.css'), { force: true })
        await pause(1500)
      }

      // a theme of the theme package, and listed: worn, with no warning
      page = await open('', null, venue)
      const hall = await look(page)
      if (hall.theme !== IMPORTED || hall.bg !== HALL.bg) complaints.push(`/${venue}: wears "${hall.theme}" (background ${hall.bg}), not ${IMPORTED} (${HALL.bg})`)
      await page.close()
      console.log(`  dev themes: ${complaints.length ? 'problems below' : `${all.join(', ')} listed, t and ?theme= wear ${THEME}, defaults outside themes, :root wins over defaults (and reaches the docked controls and default's swatch), themes over :root, ${IMPORTED} (a theme package's) worn`}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev themes: ${c}`)
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
    // ms as the bar writes it (state/timer.ts clock): 1:30:00, 20:00
    const clock = (ms) => {
      const t = Math.floor(ms / 1000)
      const [h, m, sec] = [Math.floor(t / 3600), Math.floor(t / 60) % 60, String(t % 60).padStart(2, '0')]
      return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
    }
    // the presenter's bar shows the length on its button, the time left under the timer, and
    // marks a length that is not the deck's (.changed); no length (ms null): "length" and no
    // time left. Waits for it, says what it saw otherwise
    const shows = async (page, ms, changed, when) => {
      const want = { button: ms ? clock(ms) : 'length', left: ms ? `${clock(ms)} left` : null, changed }
      const read = () => page.evaluate(() => ({
        button: document.querySelector('.ar-p-dur')?.textContent.trim(),
        left: document.querySelector('.ar-p-sub')?.textContent.match(/[\d:]+ left/)?.[0] ?? null,
        changed: !!document.querySelector('.ar-p-dur.changed'),
      }))
      const ok = await page.waitForFunction((w) => {
        const b = document.querySelector('.ar-p-dur')
        const sub = document.querySelector('.ar-p-sub')?.textContent ?? ''
        return b?.textContent.trim() === w.button && (w.left ? sub.includes(w.left) : !sub.includes(' left'))
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
      await error(presenter, ['30s', '1 minute'], 'a length under a minute')
      await input(presenter).fill('25h')
      await presenter.keyboard.press('Enter')
      await error(presenter, ['25h', '24 hours'], 'a length over 24 hours')
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
      if (!offer.includes('Remove')) complaints.push(`no duration: the reset offers ${JSON.stringify(offer)}`)
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
      // "p" is no shortcut of the presenter view: it opens no other window there
      const extra = context.waitForEvent('page', { timeout: 1_500 }).then(() => true, () => false)
      await win.keyboard.press('p')
      if (await extra) complaints.push('"p" in the presenter window opened another window')
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

  // a deck's window, open at /<second>#/2/1, stays where it is (its hash, and its timer, idle)
  // while the list is opened in another window of the same browser and reloaded there: the
  // covers drawn in the list join no deck's windows
  async function apart(base) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const complaints = []
    context.on('page', (p) => {
      p.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
      p.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    })
    try {
      const deck = await context.newPage()
      await deck.goto(new URL(`${second}#/2/1`, base).href)
      await deck.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
      const state = () => deck.evaluate(() => JSON.stringify({ hash: location.hash, timer: window.__faces[0].timer.value }))
      const was = await state()
      if (JSON.parse(was).hash !== '#/2/1') complaints.push(`/${second}#/2/1 opened at ${JSON.parse(was).hash}`)
      const list = await context.newPage()
      for (const how of ['opened', 'reloaded']) {
        await (how === 'opened' ? list.goto(base) : list.reload())
        const drawn = await list.waitForFunction((n) => {
          const cards = [...document.querySelectorAll('.ar-decks-card')]
          return cards.length === n && cards.every((c) => c.querySelector('.ar-thumb .ar-slide'))
        }, decks.length, { timeout: 30_000 }).then(() => true, () => false)
        if (!drawn) complaints.push(`the list ${how}: not every cover drawn`)
        await pause(500)
        const is = await state()
        if (is !== was) complaints.push(`the list ${how} in another window: /${second} went from ${was} to ${is}`)
      }
      console.log(`  dev list beside a deck: ${complaints.length ? 'problems below' : `/${second}#/2/1 stays put, its timer as it was, while / opens and reloads`}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev list beside a deck: ${c}`)
  }

  const second = basename(SECOND[0], '.vue').toLowerCase()
  const untimed = basename(UNTIMED[0], '.vue').toLowerCase()
  const other = decks.find((d) => d.toLowerCase() !== second && d.toLowerCase() !== untimed)
  const venue = basename(VENUE[0], '.vue').toLowerCase()
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
        await themes(base)
        await controls(base)
        await notes(base)
        await languages(base)
        await duration(base)
        await presenter(base)
        await apart(base)
      }
    } finally {
      await stop()
    }
  }

  // tiny decks, for the decks folders of the cases below: a cover and a slide of two steps
  const tiny = (title, themes, script = '') => `<template lang="pug">
Deck(:themes="${JSON.stringify(themes).replace(/"/g, "'")}")
  Slide(layout="cover" title="${title}")
    h1 ${title}
  Slide
    h2 Two steps
    p(v-step="2") The second.
</template>
${script}`
  // a deck that throws once it runs (the export's case), and one that throws as it is drawn
  // (its setup: the list's case)
  const THROWS = `<script setup>
setTimeout(() => { throw new Error('smoke: this deck throws at runtime') })
</script>
`
  const THROWS_DRAWN = `<script setup>
throw new Error('smoke: this deck throws as it is drawn')
</script>
`

  // createDeckApp's other cases: the project's own files rewritten for each one, the dev server
  // started on them (Vue's warnings only exist in dev, and no build is needed), and put back.
  // Each visit opens a path and expects the second deck (`deck`; `theme`: the theme it must wear)
  // or the list (`list`: so many decks, each with its cover; `covers`: the theme each one wears,
  // by deck); `warns`: the one [arao] warning the page must give. Each check is a function of its
  // own, given the site's URL.
  const solo = 'src/solo' // a decks folder holding the second deck alone
  // a decks folder holding two copies of the second deck: one lists a theme there is not before
  // THEME, the other no theme there is
  const listed = 'src/listed'
  const LISTED = {
    'Listed.vue': SECOND[1].replace(`:themes="['default', '${THEME}']"`, `:themes="['nosuch', '${THEME}']"`),
    'Nameless.vue': SECOND[1].replace(`:themes="['default', '${THEME}']"`, `:themes="['nosuch']"`),
  }
  const crowd = 'src/crowd' // a decks folder of many decks, one of which cannot be drawn
  const asIs = { 'src/main.js': files['src/main.js'], 'vite.config.js': files['vite.config.js'] }
  const alone = asIs['vite.config.js'].replace('arao({', `arao({ decks: '${solo}',`)
  const withOptions = (o) => asIs['src/main.js'].replace('createDeckApp()', `createDeckApp(${o})`)
  const crowded = { 'Broken.vue': tiny('Broken', ['default'], THROWS_DRAWN), 'Café.vue': tiny('Café', ['default']) }
  for (let i = 1; i <= 12; i++) crowded[`Deck${String(i).padStart(2, '0')}.vue`] = tiny(`Deck ${i}`, ['default'])

  // a project's only deck opens at / and at /<second>: the two windows are one deck's, in step
  // either way, / staying / in the address bar; "p" at / opens the presenter at /<second>?presenter
  async function together(base, variant) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const complaints = []
    context.on('page', (p) => {
      p.on('console', (m) => ['warning', 'error'].includes(m.type()) && complaints.push(`console ${m.type()}: ${m.text()}`))
      p.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    })
    const at = (p) => p.evaluate(() => location.hash || '#/1/1')
    const reaches = (p, hash) => p.waitForFunction((h) => (location.hash || '#/1/1') === h, hash, { timeout: 5_000 }).then(() => true, () => false)
    const opened = async (path) => {
      const p = await context.newPage()
      await p.goto(new URL(path, base).href)
      await p.waitForSelector('.ar-slide', { state: 'attached', timeout: 30_000 })
      await pause(300)
      return p
    }
    try {
      const root = await opened('')
      const named = await opened(second)
      await root.keyboard.press('ArrowRight')
      const one = await at(root)
      if (one === '#/1/1') complaints.push('ArrowRight did not move /')
      else if (!(await reaches(named, one))) complaints.push(`/${second} did not follow / to ${one} (at ${await at(named)})`)
      await named.keyboard.press('ArrowRight')
      const two = await at(named)
      if (two === one) complaints.push(`ArrowRight did not move /${second}`)
      else if (!(await reaches(root, two))) complaints.push(`/ did not follow /${second} to ${two} (at ${await at(root)})`)
      const path = await root.evaluate(() => location.pathname)
      if (path !== new URL(base).pathname) complaints.push(`/ became ${path}`)
      const [win] = await Promise.all([context.waitForEvent('page', { timeout: 10_000 }), root.keyboard.press('p')])
      await win.waitForSelector('.ar-presenter', { timeout: 30_000 })
      const url = new URL(win.url())
      if (url.pathname !== new URL(second, base).pathname || !url.searchParams.has('presenter'))
        complaints.push(`"p" at / opened ${url.pathname}${url.search}, not /${second}?presenter`)
      else if (!(await reaches(win, two))) complaints.push(`the presenter window is at ${await at(win)}, not ${two}`)
      console.log(`  dev ${variant.name}: / and /${second} in step both ways, / kept; "p" opens ${url.pathname}${url.search}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev ${variant.name}, / and /${second}: ${c}`)
  }

  // a long list on a phone (390x844): the covers far below the screen are not drawn until they
  // are scrolled to; a deck that cannot be drawn says "No preview" (with one [arao]
  // warning) and the rest of the list goes on; a path is shown as written (/café), not encoded
  async function lazy(base, variant) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    const complaints = []
    let expected = 'broken' // the one warning the page may give
    page.on('console', (m) => {
      if (!['warning', 'error'].includes(m.type())) return
      if (expected && m.type() === 'warning' && m.text().startsWith('[arao]') && m.text().includes(`"${expected}"`)) return void (expected = null)
      complaints.push(`console ${m.type()}: ${m.text()}`)
    })
    page.on('pageerror', (e) => complaints.push(`page error: ${e.message}`))
    const card = (name) => page.locator(`.ar-decks-card:has(a[href$="/${encodeURIComponent(name)}"])`)
    try {
      await page.goto(base)
      const count = Object.keys(crowded).length
      await page.locator('.ar-decks-card').nth(count - 1).waitFor({ state: 'attached', timeout: 30_000 }).catch(() => {})
      const cards = await page.locator('.ar-decks-card').count()
      if (cards !== count) complaints.push(`the list has ${cards} decks, not ${count}`)
      const failed = await card('broken').locator('.ar-cover-failed').waitFor({ timeout: 30_000 }).then(() => true, () => false)
      const says = failed ? (await card('broken').locator('.ar-cover-failed').textContent()).trim() : null
      if (says !== 'No preview') complaints.push(`the deck that throws shows ${says == null ? 'no failure' : JSON.stringify(says)}, not "No preview"`)
      const firstDrawn = await card('café').locator('.ar-thumb .ar-slide').first().waitFor({ state: 'attached', timeout: 30_000 }).then(() => true, () => false)
      if (!firstDrawn) complaints.push('the cards on screen have no cover drawn')
      const shown = (await card('café').locator('.ar-decks-path').textContent().catch(() => '')).trim()
      if (shown !== `${new URL(base).pathname}café`) complaints.push(`the path of Café is shown as ${shown}`)
      await pause(1000)
      const last = card('deck12')
      const early = await last.locator('.ar-slide').count()
      if (early) complaints.push('the last card, far below the screen, has its cover drawn before it is scrolled to')
      await last.scrollIntoViewIfNeeded()
      const later = await last.locator('.ar-thumb .ar-slide').first().waitFor({ state: 'attached', timeout: 30_000 }).then(() => true, () => false)
      if (!later) complaints.push('the last card has no cover once scrolled to')
      await pause(300)
      if (expected) complaints.push('no [arao] console warning naming "broken"')
      console.log(`  dev ${variant.name}: ${cards} cards at 390x844; the last drawn only once scrolled to; Broken: ${says}`)
    } finally {
      await context.close()
    }
    for (const c of complaints) fail(`dev ${variant.name}: ${c}`)
  }

  const variants = [
    { name: 'one deck', files: { 'vite.config.js': alone },
      visits: [{ path: '', deck: true }, { path: second, deck: true }], checks: [together] },
    { name: `one deck, createDeckApp({ deckList: 'always' })`, files: { 'vite.config.js': alone, 'src/main.js': withOptions(`{ deckList: 'always' }`) },
      visits: [{ path: '', list: 1 }, { path: second, deck: true }] },
    { name: `one deck, createDeckApp({ deckList: 'sometimes' })`, files: { 'vite.config.js': alone, 'src/main.js': withOptions(`{ deckList: 'sometimes' }`) },
      visits: [{ path: '', deck: true, warns: 'deckList' }] },
    { name: 'a long list', files: { 'vite.config.js': asIs['vite.config.js'].replace('arao({', `arao({ decks: '${crowd}',`) },
      checks: [lazy] },
    { name: `Deck(:themes="['nosuch', '${THEME}']") and Deck(:themes="['nosuch']")`, files: { 'vite.config.js': asIs['vite.config.js'].replace('arao({', `arao({ decks: '${listed}',`) },
      visits: [{ path: '', list: 2, covers: { listed: THEME, nameless: 'default' } },
        { path: 'listed', deck: true, theme: THEME, warns: '"nosuch"' }, { path: 'nameless', deck: true, theme: 'default', warns: '"nosuch"' }] },
  ]

  async function visit(base, variant, { path, deck, list, warns, theme, covers }) {
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
        const worn = await page.evaluate(() => document.querySelector('.ar-viewport')?.dataset.theme)
        if (theme && worn !== theme) complaints.push(`wears the theme "${worn}", not ${theme}`)
      } else {
        await page.locator('.ar-decks-card').first().waitFor({ timeout: 30_000 }).catch(() => {})
        const cards = await page.locator('.ar-decks-card').count()
        if (cards !== list) complaints.push(`the list has ${cards} decks, not ${list}`)
        const drawn = await page.waitForFunction((n) => document.querySelectorAll('.ar-decks-card .ar-thumb .ar-slide').length >= n, list, { timeout: 30_000 })
          .then(() => true, () => false)
        if (!drawn) complaints.push('a card has no cover drawn in it')
        const worn = Object.fromEntries(await page.locator('.ar-decks-card').evaluateAll((cs) => cs.map((c) =>
          [c.querySelector('a')?.getAttribute('href').split('?')[0].split('/').pop(), c.querySelector('.ar-thumb')?.dataset.theme ?? null])))
        for (const [name, want] of Object.entries(covers ?? {}))
          if (worn[name] !== want) complaints.push(`the cover of ${name} wears "${worn[name]}", not ${want}`)
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
  await mkdir(join(project, crowd), { recursive: true })
  for (const [name, text] of Object.entries(crowded)) await writeFile(join(project, crowd, name), text)
  await mkdir(join(project, listed), { recursive: true })
  for (const [name, text] of Object.entries(LISTED)) await writeFile(join(project, listed, name), text)
  try {
    for (const variant of variants) {
      for (const [name, text] of Object.entries({ ...asIs, ...variant.files })) await writeFile(join(project, name), text)
      const base = await serve('dev')
      try {
        for (const v of variant.visits ?? []) await visit(base, variant, v)
        for (const check of variant.checks ?? []) await check(base, variant)
      } finally {
        await stop()
      }
    }
  } finally {
    for (const [name, text] of Object.entries(asIs)) await writeFile(join(project, name), text)
    await rm(join(project, solo), { recursive: true, force: true })
    await rm(join(project, crowd), { recursive: true, force: true })
    await rm(join(project, listed), { recursive: true, force: true })
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
    const line = said.split('\n').find((l) => l.startsWith(`exports/${venue}.pdf: `))
    if (line && !line.endsWith(`theme ${IMPORTED}`)) fail(`export of every deck: ${venue} is not printed in ${IMPORTED}, its first theme: ${line}`)
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

  // --url is the site's base, never a deck's: a deck's own URL gets a warning naming the base it
  // would mean, and then fails on the deck printed (the page says which), as does a URL under
  // which another deck opens (with no warning: its last segment is no deck's); either way exit 1
  // and nothing written. Against vite preview of the build. (A base named like a deck exports
  // with the warning: the CLI's cases, below.)
  const deckName = basename(SECOND[0], '.vue')
  log(`${BIN} export --url <a deck's URL> --deck ${other}`)
  try {
    const base = await serve('preview')
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const printed = new RegExp(`printed the deck "${deckName}", not ${esc(other)}: nothing written`)
    const warned = (url) => new RegExp(`--url ${esc(url)} ends in the name of the deck "${deckName}"\\. If it is that deck's own URL, give the site's base instead, --url ${esc(base)} `)
    const tries = [
      { url: new URL(second, base).href, res: [warned(new URL(second, base).href), printed] },
      { url: new URL(`${second}/x/`, base).href, res: [printed], not: /ends in the name of the deck/ },
    ]
    try {
      for (const t of tries) {
        const { code, err } = await exec('npx', ['--no-install', BIN, 'export', '--url', t.url, '--deck', other, '--out', 'guard/'], project)
        const what = `export --url ${t.url} --deck ${other}`
        if (code !== 1) fail(`${what}: exited with ${code}, not 1`)
        for (const re of t.res) if (!re.test(err)) fail(`${what}: no message matching ${re} on its stderr`)
        if (t.not?.test(err)) fail(`${what}: a message matching ${t.not} on its stderr`)
        const made = await readdir(join(project, 'guard')).catch(() => [])
        if (made.length) fail(`${what}: wrote ${made.join(', ')}`)
      }
    } finally {
      await stop()
    }
  } catch (e) {
    fail(`export --url guard: ${e.message}`)
  }

  // a site under a sub-path: the same project with base '/sub/', built and served by vite
  // preview there, its list, a deck and its export
  log(`a site under /sub/: vite build, vite preview, ${BIN} export`)
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
  // pointed at it, one export into a folder of its own (--out <case>/). A case with a base is built
  // under it and printed from vite preview there (--url <its base>)
  const cases = [
    { name: 'talks', base: 'talks', args: [],
      files: { 'Talks.vue': tiny('Talks', ['default']), 'Second.vue': tiny('Second', ['default']) },
      code: 0, pdfs: { 'talks.pdf': 3, 'second.pdf': 3 },
      lines: [/^talks\/talks\.pdf: /m, /^2 of 2 decks exported, 6 pages$/m],
      errs: [/--url http:\/\/\S+\/talks\/ ends in the name of the deck "Talks"\. If it is that deck's own URL, give the site's base instead, --url http:\/\/\S+\/ .*if the site's base is named like the deck, nothing to do/] },
    { name: 'theme', args: ['--theme', THEME],
      files: { 'Second.vue': tiny('Second', ['default']), '.Hidden.vue': tiny('Hidden', ['default', THEME]) },
      link: { 'Third.vue': tiny('Third', ['default', THEME]) },
      code: 0, pdfs: { [`third-${THEME}.pdf`]: 3, 'second.pdf': 3 },
      lines: [new RegExp(`^theme/second\\.pdf: .*theme default \\(it does not list ${THEME}`, 'm'), new RegExp(`^theme/third-${THEME}\\.pdf: .*theme ${THEME}$`, 'm'), /^2 of 2 decks exported, 6 pages$/m] },
    { name: 'typo', args: ['--theme', 'nosuch'],
      files: { 'Second.vue': tiny('Second', ['default']), 'Third.vue': tiny('Third', ['default', THEME]) },
      code: 1, pdfs: {}, errs: [/no deck lists the theme "nosuch"/] },
    { name: 'partial', args: [],
      files: { 'Broken.vue': tiny('Broken', ['default'], THROWS), 'Second.vue': tiny('Second', ['default']), 'Third.vue': tiny('Third', ['default']) },
      code: 1, pdfs: { 'second.pdf': 3, 'third.pdf': 3 },
      lines: [/^2 of 3 decks exported, 6 pages; failed: Broken$/m], errs: [/Broken: the deck threw before its pages were ready: .*smoke: this deck throws/] },
    { name: 'clash', args: ['--theme', THEME],
      files: { 'Alpha.vue': tiny('Alpha', ['default', THEME]), [`alpha-${THEME}.vue`]: tiny('Not Alpha', ['default']),
        'Beta.vue': tiny('Beta', ['default']), 'beta.vue': tiny('Beta again', ['default']) },
      code: 1, pdfs: { [`alpha-${THEME}.pdf`]: 3, 'beta.pdf': 3 },
      lines: [new RegExp(`^clash/alpha-${THEME}\\.pdf: .*theme ${THEME}$`, 'm'), new RegExp(`^2 of 4 decks exported, 6 pages; failed: alpha-${THEME}, beta$`, 'm')],
      errs: [/differ only in case.*Beta and beta/, new RegExp(`alpha-${THEME}: clash/alpha-${THEME}\\.pdf is Alpha's, written in this run: not overwritten`), /beta: clash\/beta\.pdf is Beta's/] },
    { name: 'imported', args: ['--theme', IMPORTED],
      files: { 'Gamma.vue': tiny('Gamma', ['default', IMPORTED]), 'Second.vue': tiny('Second', ['default']) },
      code: 0, pdfs: { [`gamma-${IMPORTED}.pdf`]: 3, 'second.pdf': 3 },
      lines: [new RegExp(`^imported/gamma-${IMPORTED}\\.pdf: .*theme ${IMPORTED}$`, 'm'), /^2 of 2 decks exported, 6 pages$/m] },
  ]
  try {
    for (const c of cases) {
      log(`${BIN} export ${[...c.args, ...(c.base ? ['--url', `<vite preview>/${c.base}/`] : []), '--out', `${c.name}/`].join(' ')} (${c.name})`)
      const folder = `src/cases/${c.name}`
      await mkdir(join(project, folder), { recursive: true })
      for (const [name, text] of Object.entries(c.files)) await writeFile(join(project, folder, name), text)
      // a deck that is a symlink to a file elsewhere: the app's glob takes it, so must the CLI
      for (const [name, text] of Object.entries(c.link ?? {})) {
        await writeFile(join(project, 'src/cases', name), text)
        await symlink(join(project, 'src/cases', name), join(project, folder, name))
      }
      let config = asIs['vite.config.js'].replace('arao({', `arao({ decks: '${folder}',`)
      if (c.base) config = config.replace('defineConfig({', `defineConfig({ base: '/${c.base}/',`)
      await writeFile(join(project, 'vite.config.js'), config)
      const url = []
      if (c.base) {
        await run(process.execPath, [viteBin, 'build'], project)
        url.push('--url', await serve('preview', `${c.base}/`))
      }
      let said
      try {
        said = await exec('npx', ['--no-install', BIN, 'export', ...c.args, ...url, '--out', `${c.name}/`], project)
      } finally {
        if (c.base) await stop()
      }
      const { code, out, err } = said
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
