---
name: arao
description: Write, edit and check slide decks built with Arao (the araojs package), a Vue 3 + Vite slide library with Pug or HTML templates, steps, code snippets, themes and a presenter view. Use when a project depends on araojs or has src/decks/*.vue, or when asked to create, change, theme, present or export Arao slides or to set up a new Arao slides project.
---

# Arao

Arao turns a Vue single-file component into a slide deck: `Deck` → `Slide` → content. You write
*what* each slide says; the theme decides *how it looks*. This skill is how to write decks the
Arao way and how to check them.

**Version:** this skill describes araojs 0.5.0 or later (theme sources, fetched web fonts,
`src/shortcuts.ts`, `Background`, layouts as CSS files, `Slide` with `layout` as its only prop and
its layout's tokens as attributes, self-documented layouts and `arao layouts`, utility classes
instead of `Cols`, `Rows`, `Grid` and `Center`, overflow warnings in dev and in the export,
`Slide.fit` and `.scale-*`).
With an older araojs in the project, upgrade it (`npm install araojs@latest`, then fix the deck:
[troubleshooting.md](references/troubleshooting.md#decks-written-for-an-older-arao)) or check its
own `node_modules/araojs/docs/`.

The full manual ships with the package: in a slides project it is under
`node_modules/araojs/docs/` (guides in `guide/`, every prop and token in `reference/`), and online
at https://github.com/rubasace/araojs/tree/main/docs. Paths below like
`docs/reference/components.md` are relative to that folder.

## When you start

- **No project yet** (no `araojs` in `package.json`): set one up first with
  [references/project-setup.md](references/project-setup.md).
- **New deck**: one file `src/decks/<Name>.vue`, opened at `/<name>`. Start from the skeleton
  and recipes in [references/recipes.md](references/recipes.md).
- **Editing a deck**: read the whole file first; keep its syntax (Pug or HTML) and its theme.
- **Layouts**: run `npx arao layouts` (`--json` to parse it) in the project to learn the layouts it
  has, the library's and its own: what each is for, an example, its zones (named templates) and its
  parameters (attributes), each described. Don't read layout CSS or the library's source for that.
- **Always finish** by checking the deck: [references/verify.md](references/verify.md).

## Mental model

- A deck is one file, `src/decks/<Name>.vue`, opened at `/<name>` (case-insensitive). How it
  shows is the query (`?presenter`, `?theme=acme`, `?export`), where it stands is the hash
  (`#/5/2` = slide 5, step 2). `/` lists the project's decks, each with its cover drawn in a card.
- **Templates are Pug or HTML.** `<template lang="pug">` is recommended (shorter; every recipe
  uses it). Plain HTML works the same, with the same components, props, slots and directives.
  Translate tag by tag: `Slide(layout="cover")` → `<Slide layout="cover">…</Slide>`,
  `p.muted Text` → `<p class="muted">Text</p>`, `Slide.center` → `<Slide class="center">`,
  `template(#image)` → `<template #image>`.
- Structure: `Deck` → `Slide` → content. Addons (`ProgressBar`, `SlideNumber`) sit inside `Deck`,
  outside slides. Slide order = template order.
- **Fixed canvas**, 1920x1080 px by default (`Deck(:width :height)`), scaled as a whole. Every
  size you write is canvas px; it renders the same on any screen and in the PDF.
- **Steps are absolute numbers per slide.** `v-step="3"` means "from step 3 of this slide", not
  "after the previous element". Step 1 is what shows when the slide arrives. A slide counts its
  own steps (the largest `v-step` or Snippet highlight step): never declare a count.
- **A content slide has three zones**: the header (the `h1`/`h2` it starts with, its title, and
  an `h3` right after it, its subtitle), the body (everything else, from the top, right under the
  header) and the deck's footer (`Deck`'s `#footer`). The title looks the same whatever its tag.
  Convention: `h1` on a cover or a section, `h2` a slide's title, `h3` a subtitle or a heading
  inside (a side of `split`, a block of `grid`).
- **A layout is a CSS file.** `Slide(layout="x")` gives the slide the class `layout-x`; the
  library's layouts (`npx arao layouts` lists them) and the project's `src/layouts/<name>.css`
  style it. `layout` is `Slide`'s only prop; the layout's tokens
  (`--ar-layout-<name>-<thing>`) are attributes of its slides, `<thing>`; its zones are the named
  templates it places; the rest is classes, tokens and `Background`. Each file starts with a doc
  block saying all that, the HTML it reads (its semantic form, and the plain one it tolerates),
  which `npx arao layouts` prints: read it before using a layout.
- Look comes from the theme (`--ar-*` tokens). Every token has a default; a theme changes some.
  To override one in every theme from the project's CSS: `:root, [data-theme] { … }` (a plain
  `:root` reaches only `default`: [themes-and-fonts.md](references/themes-and-fonts.md#overriding-tokens)).
- **Two levels of layout, no CSS at either.** A slide's structure is its layout; inside one block
  (the body, a side of `split`, a block of `grid`, a zone) utility classes arrange and mark
  things: `.cols`, `.cols-3`, `.row`, `.stack`, `.middle`, `.gap-sm`, `.grow`, `.text-lg`,
  `.accent`, `.highlight`… When columns or rows are the whole slide, that is a layout. `npx arao
  layouts` prints the layouts, then every class, each described. One class it does not print,
  being `Agenda`'s: `ol.agenda`, a hand-written agenda in `Agenda`'s big numbered rows, with
  no state.
- Global in templates: `Deck Slide Background Img Icon Snippet Notes Agenda`, `v-step`,
  `v-step-from`. Addons (`ProgressBar`, `SlideNumber`) and composables (`useDeck`, `useSlide`)
  are imported from `'araojs'` in `<script setup>`.

## Rules

Do:
- Arrange the slide with a `layout` (the library's: `cover`, `section`, `split`, `grid`, `quote`,
  `statement`, `overlay`, `caption`, `image-left`, `image-right`; each's HTML and
  parameters: `npx arao layouts`): two sides are `split`, blocks in rows (features, pillars,
  logos, cards) are `grid`, columns of text `Slide.top(layout="grid" align="start"
  text-size="1em")`. Tune a layout on one slide with its parameters, attributes named after
  its tokens: `Slide(layout="image-right" columns="3fr 2fr")`, `Slide(layout="split" columns="2fr 1fr")`,
  `Slide(layout="grid" columns="4" cards="…")`, `Slide(layout="cover" bar="gold")` (each layout's:
  `npx arao layouts`). Another layout's attribute does nothing (and fails `vue-tsc` with
  `strictTemplates`).
- Arrange inside a block with the utility classes, on an element of yours (a layout lays out its
  own blocks): `.row` for an icon or a picture beside its text (`.grow` on the text), `.cols` /
  `.cols-2…4` for columns (uneven: `.cols(style="--ar-cols: 2fr 1fr")`), `.stack` for a column with
  a gap, `.top` / `.middle` / `.bottom` / `.center` to place content, `.gap-sm` / `.gap-lg`,
  `.text-sm` / `.text-lg` / `.text-xl`, `.accent`, `.muted`, `.highlight`. A `Snippet` (or an `Img`
  that should fill) inside columns needs `.grow` on them: they are as tall as their content.
- Give a slide only its layout's zones as named templates (`template(#image)` on `image-*`;
  `#title` on any): another name is not placed, and fails `vue-tsc`. The other layouts read the
  body's children: `split`'s two sides, `grid`'s blocks, each a `div`.
- The talk's agenda: a `Slide` (no layout) with `h2` and `Agenda`, which lists the `section`
  slides' titles in big numbered rows, marked done / current / upcoming from where it is (its
  look is its own, tuned by `--ar-agenda-*` tokens). A hand-written one: `ol.agenda`, the same
  rows with no state.
- Start every slide with its heading (`h2`): the first heading names the slide in the jump
  menu, presenter view and notes pages, and there is no other way to name it. Something before it
  (a kicker line) makes it body: use `template(#title)` for a richer header.
- Let the body start at the top (the default, the same height on every slide) or place it with a
  class on the slide: `Slide.center` (both ways, text centred), `Slide.middle` (top to bottom
  only), `Slide.bottom`. The same classes on a block place its content inside it.
- Put what goes on every slide (event, company, slide number) in `Deck`'s `template(#footer)`.
  Covers and sections hide it; `Slide.no-footer` / `Slide.with-footer` change that for one slide.
- A picture behind a slide: `Background(src="city.jpg" opacity="0.3")` inside it (`position`,
  `blur`, `fit` too; or content instead of `src`: a video, a tint). A plain colour or gradient is
  CSS on the slide: `Slide(style="background: #1d2b4a")`.
- A look one talk repeats that no library layout gives is a layout: `src/layouts/<name>.css`,
  tokens named `--ar-layout-<name>-<thing>`, each one an attribute of its slides; never a
  `<thing>` a slide has as an attribute already (`title`, `id`, `hidden`…: use `title-size`).
  It must start with its doc block: a line saying what it is for, `@example` (a slide of it, in
  Pug), `@zone <name> <description>` per named template it places, `@param <thing> <description>`
  per token (`@param <thing> {a|b|c} <description>` for one that takes only those words,
  `{0..1}` for a range of numbers). Its colours and sizes are tokens, never literals: colours
  `var(--ar-…)`, `currentColor`, `transparent`; lengths a token or relative to one
  (`calc(var(--ar-title) * .45)`, `em`, `%`, `fr`), no `px` but `0`, no `#fff` or `rgb()`; then
  `npx arao layouts` shows it with no problems
  ([recipes.md](references/recipes.md), `docs/guide/slides-and-layouts.md#its-doc-block`).
- Write tables as plain `table` / `thead` / `tbody`: the theme styles them.
- One idea per slide. Reveal with steps instead of cramming.
- Make every slide fit. Arao measures what each slide shows: `npm run export` lists, at the end
  of its run, every slide whose content does not fit (cut off at the bottom, under the footer,
  wider than its box), with what overflows, by how many px and the fix; the dev server says the
  same as a console warning (`[arao] overflow: …`), which `check-deck.mjs` reports. **Read those
  lines after every export and fix each slide** before calling the deck done: fewer blocks or
  less text first (one idea per slide), else `Slide.fit` (its body's text shrinks just enough,
  down to 60%) or a fixed step down, `.scale-90` / `.scale-80` / `.scale-70`, on the slide or on
  one block. A warning that `fit` stayed at 60% means split the slide. Not done until the export
  says nothing about overflow (`--strict` makes it fail instead). A decoration meant to reach
  past its box: `position: absolute`, or `data-ar-bleed` on it.
- Name files, never import them: `Snippet(file="App.java")` from `src/snippets/`,
  `Img(file="team.jpg")` / `Background(src="team.jpg")` from `src/images/` (subfolders ok,
  case-sensitive).
- Use `Icon` for icons and logos, by name: `lucide:…` for UI icons, `simple-icons:…` for
  technology logos. Colour it like text. Logos name the technology; they are not decoration.
- Write sizes, if any, in canvas px (`gap="96px"` on `split`, `Icon(size="64")`, `width: 320px`).
- Put speaker notes in one `Notes` inside the slide. `v-step` works inside `Notes`: a note with
  `v-step="2"` shows from step 2, following the slide's steps (it adds no steps of its own).
- Put components only one talk uses under `src/decks/<talk>/`, shared ones under `src/slides/`;
  the deck imports them in `<script setup>`.

Don't:
- Don't write ad-hoc layout CSS (flex/grid wrappers, margins to position things) when a layout,
  a utility class or a parameter does it: no `display: flex` wrapper for an icon and its text
  (`.row`), no `margin: auto` or `.ar-slide > …` selectors to centre a body (`Slide.center` does
  it), no footer drawn in a background image (`#footer` does it). A look that needs real CSS and
  repeats is a layout file, not deck CSS.
- Don't write `Cols`, `Rows`, `Grid` or `Center`: they are gone (Vue warns "Failed to resolve
  component"; `check-deck.mjs` names the replacement). Whole-slide columns are `split` or `grid`;
  inside a block, `.cols`, `.cols-3`, `.stack`, `.center.grow`
  ([troubleshooting.md](references/troubleshooting.md#decks-written-for-an-older-arao)).
- Don't use the props older Arao had on `Slide` (`title`, `align`, `footer`, `ratio`, `bg`,
  `bg-*`) or `template(#background)`: they do nothing now, silently (where the layout has a
  token of that name, `footer` on `cover`, `bg` on `section`, the attribute is that token now: a
  CSS value, `footer="flex"`, `bg="#0b3d2e"`)
  ([troubleshooting.md](references/troubleshooting.md#decks-written-for-an-older-arao)).
- Don't hard-code colours or fonts in a deck: use tokens (`color: var(--ar-accent)`,
  `color-mix(in srgb, var(--ar-fg) 8%, var(--ar-bg))`). A venue's look is a new theme.
- Don't use `vw`, `vh`, `%` font sizes or media queries inside slides: the canvas keeps its size.
- Don't put a Snippet highlight at step 1 (`{ "4": 1 }`): step 1 always shows the code plain; and
  don't expect highlights to accumulate: each step shows only its own rules.
- Don't use `v-step` outside a `Slide` (warns). Inside `Notes` it follows the slide's steps but
  adds none.
- Don't edit `node_modules/araojs` to make one deck look right.

## Gotchas that bite most

- **A plain attribute is a string; a `:`-bound one is JavaScript.** Numbers, booleans, arrays and
  objects need the colon: `:size="36"`, `:line-numbers="false"`, `:themes="['default']"`,
  `:highlights='{ "2-3": 2 }'` (JSON in single quotes). Text props stay plain:
  `columns="2fr 1fr"`, `opacity="0.25"`, `file="App.java"`, `Icon(size="64")`.
- **Slides start at the top.** The body sits right under the title, never centred unless asked
  (`Slide.center`). A short slide that looks empty: centre it, or give it more to say.
- **`Img` has no size of its own**: it fills the box its container gives it. Fixed size: a class
  with both sizes (`.avatar { flex: none; width: 320px; height: 320px; }`).
- **Icon names must be written out in the source** (`lucide:rocket` in a template or in data).
  A name built at runtime shows a dashed box and warns.

More, with the fix for each: [references/troubleshooting.md](references/troubleshooting.md).

## References

| File | Read it when |
|---|---|
| [project-setup.md](references/project-setup.md) | creating a slides project, its folders and files |
| [recipes.md](references/recipes.md) | writing slides: skeleton, covers, steps, code, columns, images, backgrounds, icons, notes, footer, tables, a layout of your own |
| [themes-and-fonts.md](references/themes-and-fonts.md) | changing the look: a theme, theme sources and packages, web fonts, layout tokens |
| [shortcuts.md](references/shortcuts.md) | keys while presenting, or a clicker/headset that needs its own key |
| [verify.md](references/verify.md) | checking a deck before calling it done |
| [troubleshooting.md](references/troubleshooting.md) | a warning, a blank or odd slide, layout surprises, a deck written for an older Arao |

## In the manual (`docs/`)

- Every prop and slot: `reference/components.md`; `v-step`: `reference/directives.md`;
  `useDeck`/`useSlide`: `reference/composables.md`; plugin options: `reference/vite-plugin.md`;
  `arao export`, `arao layouts`: `reference/cli.md`; URLs: `reference/urls.md`; tokens: `reference/theme-tokens.md`.
- Start here: `getting-started.md` (from an empty folder to a deck and a PDF); the project's
  files and `createDeckApp`: `guide/project.md`.
- Guides: `guide/concepts.md`, `guide/slides-and-layouts.md`, `guide/steps.md`, `guide/code.md`,
  `guide/composition.md`, `guide/images-and-backgrounds.md`, `guide/icons.md`, `guide/themes.md`,
  `guide/presenting.md`, `guide/export.md`, `guide/hosting.md`, `guide/extending.md`.
- Working examples: `examples/` (small one-slide decks), the project's own decks, and
  `playground/` in the Arao repository.
- How the engine is built (only to change Arao itself): `architecture.md`.
