<!-- Header: .github/assets/readme-header*.svg (text as paths, so it renders the same everywhere). Badges: shieldcn
     (https://shieldcn.dev), each a light/dark pair so the row follows the reader's GitHub theme. -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset=".github/assets/readme-header-on-dark.svg" />
  <img alt="Arao: slides as Vue components. One canvas, every screen." src=".github/assets/readme-header.svg" width="750" />
</picture>

<p>
  <a href="https://github.com/rubasace/araojs/actions/workflows/ci.yml"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/ci/rubasace/araojs.svg?variant=secondary&size=sm&workflow=ci.yml&branch=main&mode=dark" /><img alt="CI status" src="https://shieldcn.dev/github/ci/rubasace/araojs.svg?variant=secondary&size=sm&workflow=ci.yml&branch=main&mode=light" /></picture></a>
  <a href="https://www.npmjs.com/package/araojs"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/npm/araojs.svg?variant=secondary&size=sm&mode=dark" /><img alt="npm version" src="https://shieldcn.dev/npm/araojs.svg?variant=secondary&size=sm&mode=light" /></picture></a>
  <a href="LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/license-Apache--2.0.svg?variant=secondary&size=sm&mode=dark" /><img alt="licence: Apache-2.0" src="https://shieldcn.dev/badge/license-Apache--2.0.svg?variant=secondary&size=sm&mode=light" /></picture></a>
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/node-%3E%3D20.19.svg?variant=secondary&size=sm&logo=nodedotjs&mode=dark" /><img alt="requires Node 20.19 or newer" src="https://shieldcn.dev/badge/node-%3E%3D20.19.svg?variant=secondary&size=sm&logo=nodedotjs&mode=light" /></picture>
  <a href="https://vuejs.org/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/vue-3.svg?variant=secondary&size=sm&logo=vuedotjs&mode=dark" /><img alt="Vue 3" src="https://shieldcn.dev/badge/vue-3.svg?variant=secondary&size=sm&logo=vuedotjs&mode=light" /></picture></a>
  <a href="https://vite.dev/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/vite-8.svg?variant=secondary&size=sm&logo=vite&mode=dark" /><img alt="Vite 8" src="https://shieldcn.dev/badge/vite-8.svg?variant=secondary&size=sm&logo=vite&mode=light" /></picture></a>
</p>

# Arao

**Arao** is a slide library for technical talks, built on **Vue 3 + Vite**. A deck is a Vue file:
slides are components, written as plain **HTML** or as **Pug** (supported out of the box and
recommended for brevity). Every slide is drawn on one fixed canvas and scaled to the screen, so
your laptop, the projector, the presenter view and the PDF all show the same slide, with the same
line breaks. Themes are only CSS tokens, layouts are props, and a deck needs little or no CSS of
its own.

Arao is a library (the `araojs` package: the engine, its components, addons, themes, a Vite plugin
and the PDF export). Decks live in a **slides project** of their own that depends on it.

> **Status:** the first release is not on npm yet (the `araojs` name holds a placeholder). Until
> then a project uses it from a checkout, `"araojs": "file:../araojs"` (run `npm run build` here
> after each change to the library), or from a tarball made with `npm pack`.

## Why Arao

Arao continues the idea of [eagle.js](https://github.com/Zulko/eagle.js): a slideshow is a Vue
app, slides are components, and anything Vue can do, a slide can do. eagle.js was built for Vue 2
and is no longer maintained; Arao takes the same idea and rebuilds it for Vue 3 and Vite, around a
fixed canvas, absolute steps and themes made of tokens. eagle.js had its bird; so does Arao: the
*arao* is the common guillemot, a seabird of the Cíes islands off Vigo.

## Features

- **One fixed canvas.** 1920x1080 px by default (`Deck(:width="…" :height="…")` sets another),
  scaled to the window with a CSS transform. Every size inside a slide is canvas px.
- **Steps.** `v-step="n"` shows an element from step `n` of its slide; `.only` and `.collapse`
  variants; `v-step-from` makes a reusable component's steps relative. A slide counts its own
  steps: nothing to declare.
- **Layouts and composition.** `Slide(layout=…)`: `cover`, `section`, `split`, `image-left`,
  `image-right`, with `ratio`. `Cols`, `Rows`, `Grid` and `Center` arrange boxes by props
  (`ratio`, `gap`, `align`, `cols`), no CSS needed.
- **Slide zones and footer.** A content slide is a header (the heading it starts with), a body
  (centred by default, or `Slide(align=…)`) and the deck's `#footer`, drawn as real text on every
  content slide.
- **Code.** `Snippet`: a macOS-style window with [Shiki](https://shiki.style/) colours, files
  named from a folder, the same frame and font size on every slide, and line and word highlights
  per step.
- **Icons.** `Icon(name="lucide:rocket")`: any [Iconify](https://icon-sets.iconify.design/) icon
  by name, resolved at build time. Offline when presenting, vectors in the PDF.
- **Pictures and backgrounds.** `Img(file=…)` and `Slide(bg=…)` with fit, position, opacity and
  blur; a dashed placeholder names a missing file.
- **Themes as tokens.** A theme is a block of `--ar-*` CSS variables. Same slides, another venue:
  only the theme changes, live (`t`, the picker, `?theme=`).
- **Presenter view.** Current slide, next step, speaker notes, a timer with countdown and the wall
  clock; every window of the deck stays in step.
- **Keyboard and touch.** Keys, a jump menu, tap and swipe on phones and tablets.
- **PDF export.** `arao export`: one page per slide or per step, text kept as text, optional notes
  pages.
- **Written by people or by agents.** The declarative style keeps decks short and regular, which
  also makes them easy for AI agents to write: [AGENTS.md](AGENTS.md) is their guide, and ships
  with the package.

## Quick start

A slides project is a Vite app with `araojs` (and `vue` and `vite`, its peers):

```bash
npm install araojs vue && npm install -D vite
```

```js
// vite.config.js
import { defineConfig } from 'vite'
import arao from 'araojs/vite'

export default defineConfig({ plugins: [arao()] })
```

```js
// src/main.js
import { createDeckApp } from 'araojs'
import 'araojs/themes/default.css'
import 'araojs/themes/vigojug.css'

createDeckApp().mount('#app')
```

```html
<!-- index.html -->
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

```json
"scripts": { "dev": "vite", "build": "vite build", "export": "arao export" }
```

That is the whole setup:

- `arao()` is the only Vite plugin: it brings `@vitejs/plugin-vue` and Pug along (don't add
  `vue()` too; Vue's options go in `arao({ vue: { … } })`), serves the project's folders (decks in
  `src/decks`, code files in `src/snippets`, pictures in `src/images`, each one an option) and
  builds in the icons the source names.
- `createDeckApp()` creates the Vue app with the engine installed and renders the deck named by
  `?deck=` (`createDeckApp({ deck: 'mytalk' })`: the deck to open when the URL names none). A
  project with its own app shell uses `createApp(MyApp).use(Arao)` instead
  (`import Arao from 'araojs'`).
- The engine's CSS comes with `'araojs'`; the themes the decks wear are imported one by one.

### A first deck

Create `src/decks/MyTalk.vue` (and put a `DebugFilter.java` in `src/snippets/`):

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
import { ProgressBar, SlideNumber } from 'araojs'
</script>
```

The same deck in HTML: a `<template>` with no `lang`, with the same components, props, slots and
directives. Each file picks its own syntax; the `<script setup>` does not change.

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

`Deck`, `Slide`, `Img`, `Icon`, `Snippet`, `Notes`, `Cols`, `Rows`, `Grid`, `Center` and the
`v-step` and `v-step-from` directives are registered globally. Addons (`ProgressBar`,
`SlideNumber` from `'araojs'`, or your own) are imported.

Then `npm run dev` and open `http://localhost:5173/`:

| URL | What it opens |
|---|---|
| `/` | the list of the project's decks, a link to each (a project with one deck opens it) |
| `/?deck=mytalk` | the deck `src/decks/MyTalk.vue` (the name is case-insensitive) |
| `/?deck=mytalk&theme=vigojug` | the same deck with another of its themes |
| `/?deck=mytalk#/5/2` | slide 5, step 2 (the hash follows you as you move) |
| `/?deck=mytalk&presenter` | the presenter view |
| `/?deck=mytalk&export` | the deck as a book of pages, for printing |

A name that is no deck shows the list too, with a notice (and a warning in the console).

### Project layout

```
package.json        depends on araojs; scripts dev, build, export
vite.config.js      plugins: [arao()]
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

A component written for one talk goes in `src/decks/<talk>/`; one that several decks use goes in
`src/slides/`. Neither is registered globally: the deck imports it
(`import Card from '../slides/Card.vue'`).

## Writing slides

The [reference](docs/reference.md) has every prop, slot, token and URL parameter; these are the
essentials.

### Steps

Steps are absolute numbers within a slide: `v-step="3"` means "from step 3 of this slide", and
step 1 is what shows when the slide arrives. The slide's step count is the largest step inside it.

```pug
Slide
  h2 One at a time
  p Always visible.
  p(v-step="2") From step 2.
  p(v-step.only="3") Only at step 3 (keeps its space).
  p(v-step.only.collapse="4") Only at step 4 (takes no space).
```

`.collapse` takes no space while hidden, and the elements around it glide into place. Inside a
reusable component, number its steps from 1 and place it with `v-step-from`:
`Card(v-step-from="5")` shows the card's step 1 at step 5 of the slide
([v-step-from](docs/reference.md#v-step-from-relative-steps-for-reusable-components)).

### Layouts and composition

```pug
Slide(layout="split")
  h2 Before and after
  template(#left)
    h3 Before
    p Every team rolled its own.
  template(#right)
    h3(v-step="2") After
    p(v-step="2") One starter, one version.

Slide
  h2 Three pillars
  Cols(gap="lg")
    div
      h3 Logging
    div(v-step="2")
      h3 Metrics
    div(v-step="3")
      h3 Clients
```

Layouts: `default`, `cover`, `section`, `split` (two named zones), `image-left` / `image-right`
(an edge-to-edge picture beside the text), with `ratio="3 2"`. Pieces: `Cols(ratio="2 1")`,
`Rows`, `Grid(cols="3")` or `Grid(ratio="2:1")` (the count decides the shape), `Center`. A
`Deck`'s `#footer` slot draws on every slide except covers and sections, with the slide number if
wanted. Plain tables and lists are styled by the theme.

### Code

```pug
Slide(title="A debug filter")
  h2 A debug filter
  Snippet(file="DebugFilter.java" :highlights='{ "2": 2, "8-10:isDebug+++MDC.put": 3 }')
```

Step 1 shows the code plain; at step 2 line 2 is highlighted; at step 3 only those words on lines
8-10. Each step shows only its own rules. Every snippet has the same frame and font size, and
shrinks only when the code would not fit. Inline code:
`Snippet(code="npm run dev" lang="bash" name="terminal" fit :line-numbers="false")`.

### Pictures and icons

```pug
Slide(layout="image-right" ratio="3 2")
  template(#image)
    Img(file="team.jpg" alt="The team")
  h2 #[Icon(name="lucide:users")] One picture, one idea
  Icon(name="simple-icons:kubernetes" size="120" label="Kubernetes")
```

`Img` takes `fit`, `position`, `opacity`, `blur` and `rounded`. `Slide(bg=…)` takes a picture, a
URL, a colour or a gradient, tuned with `bg-opacity`, `bg-position`, `bg-blur` and `bg-fit`; a
`#background` slot takes anything.

Icons are inline SVG in the text colour, `1em` tall or `size` px. Lucide (UI icons) and Simple
Icons (technology logos) come with the library; any other Iconify set works after
`npm install -D @iconify-json/<prefix>`. The plugin builds in only the icons whose full names
appear in the source, so nothing is fetched while presenting. Sets and their licences:
[Icon](docs/reference.md#icon).

### Themes

A theme is one rule of tokens, imported in `src/main.js` and listed in `Deck(:themes)`:

```css
/* src/themes/acme.css */
[data-theme="acme"] {
  --ar-bg: #f6f3ec;
  --ar-fg: #1b2a3a;
  --ar-accent: #2a7de1;
  --ar-font-sans: Georgia, serif;
  /* … */
}
```

Tokens cover colours, fonts, sizes, title and body placement, footer, tables and code colours;
some have no fallback and every theme must set them
([Theme tokens](docs/reference.md#theme-tokens)). The shipped themes, `default` and `vigojug`,
are imported from the package: `import 'araojs/themes/vigojug.css'`. In a slide, style through
tokens (`color: var(--ar-accent)`) rather than fixed colours. Utility classes (`.muted`,
`.center`, `.upper`, `.small`) are there as an escape hatch.

## Presenting

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

Keys with Ctrl, Cmd or Alt are left to the browser. Letter keys act in lowercase only: with Caps
Lock on (or Shift held), `g` `t` `f` `p` do nothing. Moving the mouse shows the controls
(first/prev/next/last, slide counter with step dots, jump menu, theme picker, presenter view,
fullscreen); they never show on keyboard navigation and hide after 2.5 s without movement. On a
touch screen, tap the right edge for next, the left edge for previous and the middle for the
controls; swiping left or right also navigates.

### Presenter view

Press `p` (or the controls' screen button, or open the URL with `&presenter`). A separate window
shows the current slide with the controls under it, a preview of what the next press shows, the
speaker notes of the slide (the ones that start at the current step are marked), the slide number
and title, the timer and the wall clock.

The timer starts with the first move in any window; it can be paused and reset, and it survives
reloading the windows. With `Deck(duration="45m")` it also counts down: amber near the end, red
when over. All windows of the same deck in the same browser follow each other (position, theme,
timer). If the browser blocks the pop-up, a notice offers a link to open it by hand. The presenter
UI is in Spanish.

## Export to PDF

In a slides project (`"export": "arao export"` in its scripts; `npx arao export …` works too):

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

The command builds the project (with its own Vite config) into a temporary folder, serves it,
opens `?export` in headless Chromium and prints. By default each slide is one page showing its
last step. Pages are 1920x1080 px (1440x810 pt). `ARAO_CHROMIUM=/path/to/chrome` uses a browser
you already have. Opening `?export` in a normal browser and printing to PDF gives the same pages.

## Documentation

- [docs/reference.md](docs/reference.md): every component, prop, slot, token, key and URL
  parameter.
- [AGENTS.md](AGENTS.md): the guide for AI agents writing decks (rules, gotchas, recipes, how to
  verify a deck). In a slides project it is at `node_modules/araojs/AGENTS.md`.
- [playground/](playground/): a tiny slides project on the library's source.

## Development

Node 20.19 or newer.

| Script | What it does |
|---|---|
| `npm run dev` | the playground, on the library's source, on 127.0.0.1:5173 (`ARAO_PUBLIC_HOST` allows a tunnel host) |
| `npm run build` | the library into `dist/`: `index.js` (ESM, imports its CSS), `arao.css`, `themes/*.css`; also run by `npm pack` / `npm publish` |
| `npm run smoke [-- <file.tgz>]` | the packaged-consumer smoke test (below) |

In a slides project, `npm run dev` is the Vite dev server with hot reload, `npm run build` a
static build into `dist/` (every deck; pick one with `?deck=`) and `npm run export` the PDF.

### Repository layout

```
src/
  index.js          what 'araojs' exports (the only barrel: every other module imports a file)
  plugin.js         the Vue plugin: global components and directives, the engine's CSS
  app.js            createDeckApp
  state/            the deck, its stages, its slides: createDeck/useDeck, createStage/useStage, createSlide/useSlide
  composables/      the effects (internal): useHashRoute, useDeckSync, usePresenterWindow, useKeyboard, useTouchNav, useMouseIdle, useFullscreen
  core/             plain modules: sync, timer, exporter, image, icons, flip
  views/            what Arao draws: AudienceView, PresenterView, ExportView
    parts/          Stage (the scaled canvas), Controls, PresenterBar
  components/       Deck, Slide, Img, Icon, Snippet, Notes, Cols/Rows/Grid/Center (layout.js)
  directives/       v-step and v-step-from (step.js)
  addons/           ProgressBar, SlideNumber: things drawn over every slide
  styles/           engine.css (structure), layouts.css (content and layouts)
  themes/           the shipped themes (default.css, vigojug.css)
vite/               the Vite plugin (araojs/vite; icons.js resolves the icons)
bin/                the arao command (arao export)
playground/         a tiny slides project on the library's source, for developing it
docs/reference.md   the full reference
docs/architecture.md how the engine is built: folders, views, provide/inject, useDeck's face
dist/               the build (npm run build): index.js, arao.css, themes/
```

### Smoke test

`scripts/smoke.mjs` checks the package the way a user gets it. It packs the library (or takes the
tarball it is given), installs it into a new slides project in a temporary folder with the
playground's decks, images and snippets (and a second, tiny deck of its own), and then:

1. runs `vite build`;
2. opens every deck under the dev server (Vue's own warnings only show up in dev) and under
   `vite preview`, and walks each one with ArrowRight to its last step. Any console warning or
   error, any page error, or a deck with no slides fails the test;
3. opens `/` under both servers: it must list every deck, each link must open its deck (the first
   one followed with the keyboard) and keep the page's other query parameters, and an unknown
   `?deck=` must show the list with one warning;
4. rewrites the project's `src/main.js` (and once its `vite.config.js`) for createDeckApp's
   other cases, under the dev server: a project with one deck opens it at `/`;
   `createDeckApp({ deck: 'second' })` opens that deck at `/` while `?deck=<other>` still wins;
   `createDeckApp({ deck: 'missing' })` shows the list with one `[arao]` warning;
5. runs `<bin> export --deck <name>` for every deck and checks that the PDF exists and that the
   summary line reports at least one page.

The package name and the CLI's name come from `package.json`. CI runs it on every pull request and
on every push to `main`. To run it locally:

```bash
npx playwright-core install chromium   # once; or ARAO_CHROMIUM=/path/to/chrome
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
4. The `publish` job in the same workflow builds the package and runs `npm stage publish`. It
   authenticates through OIDC, so there is no npm token. npm adds provenance on its own when the
   repository is public.
5. The version waits in npm's staging queue until the owner approves it with 2FA, on npmjs.com or
   with `npm stage approve`. Nothing goes live without that approval.

The release pull request is opened with `GITHUB_TOKEN`, and GitHub doesn't start other workflows
for events made with that token. As a result, CI doesn't run on the release PR by itself. To get
CI on it, give the action a fine-grained PAT or a GitHub App token through its `token` input.

One-time setup by the owner:

- **GitHub**: Settings → Actions → General → Workflow permissions: select "Read and write
  permissions" and tick "Allow GitHub Actions to create and approve pull requests".
- **npm**: the package (published as `araojs`) has to exist on npmjs.com first. Then, under the
  package's Settings → Trusted publisher → GitHub Actions, set organization or user `rubasace`,
  repository `araojs`, workflow filename `release-please.yml`, and leave the environment empty.
  Under "Allowed actions", keep only `npm stage publish` (the default): CI stages, the owner
  approves. Every field is case-sensitive. If you rename the package or the repository, update the
  trusted publisher and `repository.url` in `package.json` too: they have to match.

## License and credits

Arao is licensed under the [Apache License 2.0](LICENSE). Copyright 2026 Ruben Pahino.

Arao owes its starting idea to [eagle.js](https://github.com/Zulko/eagle.js), by Zulko and its
contributors: slides as Vue components. Icons come from the [Lucide](https://lucide.dev) and
[Simple Icons](https://simpleicons.org) sets through [Iconify](https://iconify.design), and code
colours from [Shiki](https://shiki.style/), each under its own licence.
