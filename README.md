# Phoenyx

A slide engine of its own for technical talks, built on **Vue 3 + Vite**, with slides written as
Vue templates: plain **HTML**, or **Pug**, supported out of the box and recommended for brevity.

- **One fixed canvas.** Every slide is drawn on a canvas of fixed size, 1920x1080 px by default
  (`Deck(:width="…" :height="…")` sets another), and scaled to the window with a CSS transform.
  What you see on your laptop is what the projector, the presenter view and the PDF show: same
  line breaks, same sizes. All sizes inside a slide are canvas px.
- **Themes are tokens only.** A theme is a block of `--ph-*` CSS variables (colours, fonts, sizes,
  title, body placement, footer, tables, code colours). Same slides, different venue: only the
  theme changes.
- **Declarative.** Layouts, composition pieces and props cover the usual arrangements, so a deck
  needs little or no custom CSS. That also makes decks easy for AI agents to write (see
  [AGENTS.md](AGENTS.md)).

Phoenyx is a library (the `phoenyxjs` package: the engine, its components, addons, themes, a Vite
plugin and the PDF export). Decks live in a **slides project** of their own that depends on it.

> **Status:** not published to npm yet (the package name `phoenyxjs` is a placeholder). A project
> uses it from a checkout: `"phoenyxjs": "file:../phoenyxjs"` (then `npm run build` here after each
> change to the library), or from a tarball made with `npm pack`.

## Quick start: a slides project

```bash
npm install phoenyxjs vue && npm install -D vite
```

```js
// vite.config.js
import { defineConfig } from 'vite'
import phoenyx from 'phoenyxjs/vite'

export default defineConfig({ plugins: [phoenyx()] })
```

```js
// src/main.js
import { createDeckApp } from 'phoenyxjs'
import 'phoenyxjs/themes/default.css'
import 'phoenyxjs/themes/vigojug.css'

createDeckApp().mount('#app')
```

```html
<!-- index.html -->
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

```json
"scripts": { "dev": "vite", "build": "vite build", "export": "phoenyx export" }
```

That is the whole setup:

- `phoenyx()` is the only Vite plugin: it brings `@vitejs/plugin-vue` and Pug along (don't add
  `vue()` too; Vue's options go in `phoenyx({ vue: { … } })`), and serves the project's folders:
  decks in `src/decks`, code files in `src/snippets`, pictures in `src/images` (each one an option),
  and builds in the icons the source names.
- `createDeckApp()` creates the Vue app with the engine installed and renders the deck named by
  `?deck=`. A project with its own app shell uses `createApp(MyApp).use(Phoenyx)` instead
  (`import Phoenyx from 'phoenyxjs'`).
- The engine's CSS comes with `'phoenyxjs'`; the themes the decks wear are imported one by one.

Then `npm run dev` and open `http://localhost:5173/`:

| URL | What it opens |
|---|---|
| `/?deck=mytalk` | the deck `src/decks/MyTalk.vue` (the name is case-insensitive) |
| `/?deck=mytalk&theme=vigojug` | the same deck with another of its themes |
| `/?deck=mytalk#/5/2` | slide 5, step 2 (the hash follows you as you move) |
| `/?deck=mytalk&presenter` | the presenter view |
| `/?deck=mytalk&export` | the deck as a book of pages, for printing |

Without `?deck=`, or with a name that is no deck, the first deck by name opens, without a warning.

### Keys

| Key | Action |
|---|---|
| `→` `↓` `PageDown` `Space` `Enter` | next step (then next slide) |
| `←` `↑` `PageUp` `Backspace` | previous step |
| `Home` / `End` | first slide / last step of the last slide |
| `g`, or a digit | jump menu (search by number or title; a digit pre-fills it) |
| `Esc` | close the open panel (jump menu or theme picker) |
| `t` | next theme of the deck |
| `f` | fullscreen |
| `p` | open (or bring forward) the presenter window |

On a touch screen: tap the right edge → next, the left edge → previous, the middle → controls;
swipe left/right also navigates.

Keys with Ctrl, Cmd or Alt are left to the browser. Letter keys act in lowercase only: with Caps
Lock on (or Shift held), `g` `t` `f` `p` do nothing. Moving the mouse shows the controls
(first/prev/next/last, slide counter with step dots, jump menu, theme picker, presenter view,
fullscreen); they never show on keyboard navigation and hide after 2.5 s without movement.

## A minimal deck

Create `src/decks/MyTalk.vue` and open `/?deck=mytalk`:

```pug
<template lang="pug">
Deck(:themes="['default', 'vigojug']" duration="30m")
  ProgressBar
  SlideNumber

  Slide(layout="cover")
    .bar
    h1 My talk
    p.muted Jane Doe · Conf 2026

  Slide
    h2 Three things
    ul
      li First, from the start
      li(v-step="2") Second, at step 2
      li(v-step="3") Third, at step 3
    Notes
      p Speaker notes: only the presenter view shows them.

  Slide(title="The code")
    h2 The code
    Snippet(file="DebugFilter.java" :highlights='{ "8-10": 2 }')

  Slide(layout="section")
    h1 Thanks!
</template>

<script setup>
import { ProgressBar, SlideNumber } from 'phoenyxjs'
</script>
```

A deck's template is a plain Vue template. Pug, as above and in every example of these docs, is
the recommended way to write it: it is shorter, and the plugin brings it along. Plain HTML works
just as well, with the same components, props, slots and directives: a `<template>` with no `lang`.
Each file picks its own. The same deck in HTML (the `<script setup>` does not change):

```vue
<template>
  <Deck :themes="['default', 'vigojug']" duration="30m">
    <ProgressBar />
    <SlideNumber />

    <Slide layout="cover">
      <div class="bar"></div>
      <h1>My talk</h1>
      <p class="muted">Jane Doe · Conf 2026</p>
    </Slide>

    <Slide>
      <h2>Three things</h2>
      <ul>
        <li>First, from the start</li>
        <li v-step="2">Second, at step 2</li>
        <li v-step="3">Third, at step 3</li>
      </ul>
      <Notes><p>Speaker notes: only the presenter view shows them.</p></Notes>
    </Slide>

    <Slide title="The code">
      <h2>The code</h2>
      <Snippet file="DebugFilter.java" :highlights='{ "8-10": 2 }' />
    </Slide>

    <Slide layout="section">
      <h1>Thanks!</h1>
    </Slide>
  </Deck>
</template>
```

`Deck`, `Slide`, `Img`, `Icon`, `Snippet`, `Notes`, `Cols`, `Rows`, `Grid`, `Center` and the `v-step`
directive are registered globally. Addons (`ProgressBar`, `SlideNumber` from `'phoenyxjs'`, your
own) are imported.

## Folder layout

A slides project:

```
package.json        depends on phoenyxjs; scripts dev, build, export
vite.config.js      plugins: [phoenyx()]
index.html          <div id="app"> and /src/main.js
src/
  main.js           createDeckApp().mount('#app'), after the theme imports
  decks/            one .vue file per deck (?deck=<file name>)
    <talk>/         components only that talk uses
  slides/           components shared by several decks
  snippets/         code files shown by Snippet(file="…"), by name (subfolders allowed)
  images/           pictures used by Img(file="…") and Slide(bg="…"), by name (subfolders allowed)
  themes/           the project's own themes, if any
```

A component written for one talk goes in `src/decks/<talk>/` and is imported only by that deck;
one that several decks use goes in `src/slides/`. Neither is registered globally: the deck
imports it (`import Card from '../slides/Card.vue'`). A new theme is a file in `src/themes/`,
imported in `src/main.js`.

This repository, the library:

```
src/
  index.js          what 'phoenyxjs' exports
  app.js            createDeckApp
  engine/           the engine (Deck, Slide, v-step, layouts, Img, Icon, Notes, presenter, export, CSS)
  components/       Snippet
  addons/           ProgressBar, SlideNumber: things drawn over every slide
  themes/           the shipped themes (default.css, vigojug.css)
vite/               the Vite plugin (phoenyxjs/vite; icons.js resolves the icons)
bin/                the phoenyx command (phoenyx export)
playground/         a tiny slides project on the library's source, for developing it
docs/reference.md   the full reference
dist/               the build (npm run build): index.js, phoenyx.css, themes/
```

## Features

- **Steps** — `v-step="n"` shows an element from step n; `.only` shows it only at step n;
  `.collapse` makes it take no space while hidden (neighbours glide into place). A slide counts its
  own steps.
- **Layouts** — `Slide(layout=…)`: `default`, `cover`, `section`, `split` (two named zones),
  `image-left` / `image-right` (an edge-to-edge picture beside the text), with `ratio`.
- **Slide zones** — a content slide is a header (the heading it starts with, no template needed),
  a body (centred vertically by default; `Slide(align="start|center|end")` or the theme's
  `--ph-body-align`) and a footer.
- **Footer** — `Deck`'s `#footer` slot on every slide (real text in the theme's fonts, with the
  slide number if wanted), hidden on covers and sections, in the presenter view and the PDF.
- **Tables and lists** — plain `table` and lists styled by the theme (`--ph-table-*`,
  `--ph-list-gap`); title colour, size, alignment and gap are tokens too (`--ph-title-*`).
- **Composition** — `Cols`, `Rows`, `Grid`, `Center`: boxes laid out by props (`ratio`, `gap`,
  `align`, `cols`), no CSS needed.
- **Code** — `Snippet`: a macOS-style window with Shiki colours, files by name, the same frame
  and font size on every slide (shrinks only when the code would not fit), line and word highlights
  per step.
- **Pictures** — `Img(file=…)` from the images folder, with `fit`, `position`, `opacity`, `blur`,
  `rounded`; a dashed placeholder with the file name when it is missing.
- **Icons** — `Icon(name="lucide:rocket")`: any [Iconify](https://icon-sets.iconify.design/) icon by
  name, inline SVG in the text colour, `1em` tall or `size` px. Lucide (UI) and Simple Icons
  (technology logos) come with the library, other sets with `npm install -D @iconify-json/<prefix>`.
  Resolved at build time from the names the source uses: offline, and vectors in the PDF
  (sets and licences: [docs/reference.md](docs/reference.md#icon)).
- **Backgrounds** — `Slide(bg=…)` takes a picture, a URL, a colour or a gradient, tuned with
  `bg-opacity`, `bg-position`, `bg-blur`, `bg-fit`; or a free `#background` slot. A theme may set
  a default background.
- **Speaker notes** — `Notes` inside a slide, optionally from a step on (`Notes(step="2")`).
- **Presenter view** — current slide, next step, notes, timer with countdown, wall clock; windows
  stay in step with each other.
- **Themes** — token files switched live (`t`, the picker, `?theme=`).
- **Addons** — components drawn over every slide (`useDeck()` tells them where the deck is).
- **PDF export** — one page per slide or per step, text kept as text.
- **Utility classes** — `.muted`, `.center`, `.upper`, `.small`, as an escape hatch.

The complete reference, with every prop, slot, token and URL parameter, is in
[docs/reference.md](docs/reference.md).

## Presenter view

Press `p` (or the controls' screen button, or open the URL with `&presenter`). A separate window
shows the current slide with the controls under it, a preview of what the next press shows, the
speaker notes of the slide (the ones that start at the current step are marked), the slide number
and title, the timer and the wall clock.

The timer starts with the first move in any window; it can be paused and reset, and it survives
reloading the windows. With `Deck(duration="45m")` it also counts down: amber near the end, red
when over. All windows of the same deck in the same browser follow each other (position, theme,
timer). If the browser blocks the pop-up, a notice offers a link to open it by hand.

The presenter UI is in Spanish.

## Export to PDF

In a slides project (`"export": "phoenyx export"` in its scripts; `npx phoenyx export …` works too):

```bash
npx playwright-core install chromium      # once: the Chromium that playwright-core drives
npm run export -- --deck mytalk                       # exports/mytalk.pdf
npm run export -- --deck mytalk --theme vigojug --per-step --notes --out talk.pdf
```

| Option | Meaning |
|---|---|
| `--deck <name>` | a deck of the decks folder, `src/decks` (default: the first by name) |
| `--theme <name>` | one of the deck's themes (default its first) |
| `--per-step` | one page per step instead of one per slide |
| `--notes` | a page with the speaker notes after each slide that has them |
| `--out <path>` | output file or folder (default `exports/<deck>[-<theme>][-steps][-notes].pdf`) |
| `--url <url>` | print from a running server (e.g. `http://127.0.0.1:5173/`) instead of building |

The command builds the project (with its own Vite config) into a temporary folder, serves it, opens `?export` in headless
Chromium and prints. By default each slide is one page showing its last step. Pages are
1920x1080 px (1440x810 pt). `PHOENYX_CHROMIUM=/path/to/chrome` uses a browser you already have.
Opening `?export` in a normal browser and printing to PDF gives the same pages.

## Scripts

In a slides project:

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | static build into `dist/` (every deck; pick one with `?deck=`) |
| `npm run export` | PDF of a deck (above) |

In this repository:

| Script | What it does |
|---|---|
| `npm run build` | the library into `dist/`: `index.js` (ESM, imports its CSS), `phoenyx.css`, `themes/*.css`; also run by `npm pack` / `npm publish` |
| `npm run dev` | the playground, on the library's source, on 127.0.0.1:5173 (`PHOENYX_PUBLIC_HOST` allows a tunnel host) |
| `npm run smoke [-- <file.tgz>]` | the packaged-consumer smoke test (below) |

Node 20.19 or newer.

## Smoke test

`scripts/smoke.mjs` checks the package the way a user gets it. It packs the library (or takes
the tarball it is given), installs it into a new slides project in a temporary folder with the
playground's decks, images and snippets, and then:

1. runs `vite build`;
2. opens every deck under the dev server (Vue's own warnings only show up in dev) and under
   `vite preview`, and walks each one with ArrowRight to its last step. Any console warning or
   error, any page error, or a deck with no slides fails the test;
3. runs `<bin> export --deck <name>` for every deck and checks that the PDF exists and that the
   summary line reports at least one page.

The package name and the CLI's name come from `package.json`. CI runs it on every pull request
and on every push to `main`. To run it locally:

```bash
npx playwright-core install chromium   # once; or PHOENYX_CHROMIUM=/path/to/chrome
npm run smoke                          # or: node scripts/smoke.mjs path/to/package.tgz
```

It needs network access (`npm install`). Anything Chromium needs on your machine (shared
libraries through `LD_LIBRARY_PATH`, `FONTCONFIG_FILE`) is passed through to the browser.
`SMOKE_KEEP=1` keeps the temporary project and prints its path.

## Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please) and
npm trusted publishing (`.github/workflows/release-please.yml`):

1. Commit to `main` using [Conventional Commits](https://www.conventionalcommits.org/):
   `feat:` (minor while below 1.0), `fix:`, `perf:`, `refactor:` and `docs:` (patch), and `feat!:`
   or `BREAKING CHANGE:` (minor while below 1.0). `ci:`, `chore:`, `test:` and similar don't
   trigger a release.
2. On every push to `main`, release-please opens or updates a release pull request that bumps
   `package.json` and `.release-please-manifest.json` and writes `CHANGELOG.md`.
3. Merging that pull request tags the version (`0.3.1`, no `v`, like the existing tags) and
   creates the GitHub release.
4. The `publish` job in the same workflow builds the package and runs `npm publish`. It
   authenticates through OIDC, so there is no npm token. npm adds provenance on its own when the
   repository is public.

The release pull request is opened with `GITHUB_TOKEN`, and GitHub doesn't start other workflows
for events made with that token. As a result, CI doesn't run on the release PR by itself. To get
CI on it, give the action a fine-grained PAT or a GitHub App token through its `token` input.

One-time setup by the owner:

- **GitHub**: Settings → Actions → General → Workflow permissions: select "Read and write
  permissions" and tick "Allow GitHub Actions to create and approve pull requests".
- **npm**: the package (published as `araojs`) has to exist on npmjs.com first. Then, under the
  package's Settings → Trusted publisher → GitHub Actions, set organization or user `rubasace`, repository
  `araojs`, workflow filename `release-please.yml`, and leave the environment empty. Under
  "Allowed actions", allow `npm publish`: new trusted publishers allow only `npm stage publish`
  by default. Every field is case-sensitive. If you rename the package or the repository, update
  the trusted publisher and `repository.url` in `package.json` too: they have to match.
