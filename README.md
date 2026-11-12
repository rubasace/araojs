# Phoenyx

A slide engine of its own for technical talks, built on **Vue 3 + Vite**, with slides written in **Pug**.

- **One fixed canvas.** Every slide is drawn on a canvas of fixed size, 1920x1080 px by default
  (`Deck(:width="…" :height="…")` sets another), and scaled to the window with a CSS transform.
  What you see on your laptop is what the projector, the presenter view and the PDF show: same
  line breaks, same sizes. All sizes inside a slide are canvas px.
- **Themes are tokens only.** A theme is a block of `--ph-*` CSS variables (colours, fonts, sizes,
  code colours). Same slides, different venue: only the theme changes.
- **Declarative.** Layouts, composition pieces and props cover the usual arrangements, so a deck
  needs little or no custom CSS. That also makes decks easy for AI agents to write (see
  [AGENTS.md](AGENTS.md)).

> **Status:** v2 is in progress on the `v2-engine` branch. Phoenyx is not published as a package
> yet: decks live inside this repository, under `src/decks/`. How to package it is still an open
> decision.

## Quick start

```bash
npm install
npm run dev          # http://127.0.0.1:5173/
```

| URL | What it opens |
|---|---|
| `/?deck=demo` | the deck `src/decks/Demo.vue` (the default; the name is case-insensitive) |
| `/?deck=framework` | `src/decks/Framework.vue` (a 122-slide real talk) |
| `/?deck=demo&theme=vigojug` | the same deck with another of its themes |
| `/?deck=demo#/5/2` | slide 5, step 2 (the hash follows you as you move) |
| `/?deck=demo&presenter` | the presenter view |
| `/?deck=demo&export` | the deck as a book of pages, for printing |

An unknown `?deck=` falls back to Demo without a warning.

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
import ProgressBar from '../addons/ProgressBar.vue'
import SlideNumber from '../addons/SlideNumber.vue'
</script>
```

`Deck`, `Slide`, `Img`, `Snippet`, `Notes`, `Cols`, `Rows`, `Grid`, `Center` and the `v-step`
directive are registered globally. Addons (`ProgressBar`, `SlideNumber`, your own) are imported.

## Folder layout

```
src/
  main.js           creates the app: installs the engine, imports layouts.css and every theme
  App.vue           picks the deck from ?deck=<name> among the .vue files directly in decks/
  decks/            one .vue file per deck (?deck=<file name>)
    <talk>/         components only that talk uses (decks/framework/: Quote, Social…)
  slides/           components shared by several decks (Card, used by the demo)
  snippets/         code files shown by Snippet(file="…"), by name (subfolders allowed)
  images/           pictures used by Img(file="…") and Slide(bg="…"), by name (subfolders allowed)
  themes/           theme token files (default.css, vigojug.css) and layouts.css
  addons/           ProgressBar, SlideNumber: things drawn over every slide
  engine/           the engine (Deck, Slide, v-step, layouts, Img, Notes, presenter, export)
  components/       Snippet
phoenyx/vite.js     the Vite plugin (snippets and images folders)
scripts/export.mjs  npm run export (PDF)
```

A component written for one talk goes in `src/decks/<talk>/` and is imported only by that deck;
one that several decks use goes in `src/slides/`. Neither is registered globally: the deck
imports it (`import Card from '../slides/Card.vue'`). A new theme is a file in `src/themes/`,
imported in `src/main.js`.

## Features

- **Steps** — `v-step="n"` shows an element from step n; `.only` shows it only at step n;
  `.collapse` makes it take no space while hidden (neighbours glide into place). A slide counts its
  own steps.
- **Layouts** — `Slide(layout=…)`: `default`, `cover`, `section`, `split` (two named zones),
  `image-left` / `image-right` (an edge-to-edge picture beside the text), with `ratio`.
- **Composition** — `Cols`, `Rows`, `Grid`, `Center`: boxes laid out by props (`ratio`, `gap`,
  `align`, `cols`), no CSS needed.
- **Code** — `Snippet`: a macOS-style window with Shiki colours, files by name, the same frame
  and font size on every slide (shrinks only when the code would not fit), line and word highlights
  per step.
- **Pictures** — `Img(file=…)` from the images folder, with `fit`, `position`, `opacity`, `blur`,
  `rounded`; a dashed placeholder with the file name when it is missing.
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

```bash
npx playwright-core install chromium      # once: the Chromium that playwright-core drives
npm run export -- --deck framework                     # exports/framework.pdf
npm run export -- --deck demo --theme vigojug --per-step --notes --out talk.pdf
```

| Option | Meaning |
|---|---|
| `--deck <name>` | a deck of `src/decks` (default `demo`) |
| `--theme <name>` | one of the deck's themes (default its first) |
| `--per-step` | one page per step instead of one per slide |
| `--notes` | a page with the speaker notes after each slide that has them |
| `--out <path>` | output file or folder (default `exports/<deck>[-<theme>][-steps][-notes].pdf`) |
| `--url <url>` | print from a running server (e.g. `http://127.0.0.1:5173/`) instead of building |

The script builds the site into a temporary folder, serves it, opens `?export` in headless
Chromium and prints. By default each slide is one page showing its last step. Pages are
1920x1080 px (1440x810 pt). `PHOENYX_CHROMIUM=/path/to/chrome` uses a browser you already have.
Opening `?export` in a normal browser and printing to PDF gives the same pages.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload on 127.0.0.1:5173 (`PHOENYX_PUBLIC_HOST` allows a tunnel host) |
| `npm run build` | static build into `dist/` (every deck; pick one with `?deck=`) |
| `npm run export` | PDF of a deck (above) |

Node 20.19 or newer.
