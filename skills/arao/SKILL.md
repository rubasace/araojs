---
name: arao
description: Write, edit and check slide decks built with Arao (the araojs package), a Vue 3 + Vite slide library with Pug or HTML templates, steps, code snippets, themes and a presenter view. Use when a project depends on araojs or has src/decks/*.vue, or when asked to create, change, theme, present or export Arao slides or to set up a new Arao slides project.
---

# Arao

Arao turns a Vue single-file component into a slide deck: `Deck` → `Slide` → content. You write
*what* each slide says; the theme decides *how it looks*. This skill is how to write decks the
Arao way and how to check them.

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
- **Always finish** by checking the deck: [references/verify.md](references/verify.md).

## Mental model

- A deck is one file, `src/decks/<Name>.vue`, opened at `/<name>` (case-insensitive). How it
  shows is the query (`?presenter`, `?theme=acme`, `?export`), where it stands is the hash
  (`#/5/2` = slide 5, step 2). `/` lists the project's decks, each with its cover drawn in a card.
- **Templates are Pug or HTML.** `<template lang="pug">` is recommended (shorter; every recipe
  uses it). Plain HTML works the same, with the same components, props, slots and directives.
  Translate tag by tag: `Slide(layout="cover")` → `<Slide layout="cover">…</Slide>`,
  `p.muted Text` → `<p class="muted">Text</p>`, `template(#left)` → `<template #left>`.
- Structure: `Deck` → `Slide` → content. Addons (`ProgressBar`, `SlideNumber`) sit inside `Deck`,
  outside slides. Slide order = template order.
- **Fixed canvas**, 1920x1080 px by default (`Deck(:width :height)`), scaled as a whole. Every
  size you write is canvas px; it renders the same on any screen and in the PDF.
- **Steps are absolute numbers per slide.** `v-step="3"` means "from step 3 of this slide", not
  "after the previous element". Step 1 is what shows when the slide arrives. A slide counts its
  own steps (the largest `v-step` or Snippet highlight step): never declare a count.
- **A content slide has three zones**: the header (the `h1`/`h2` it starts with), the body
  (everything else, centred vertically by default) and the deck's footer (`Deck`'s `#footer`).
- Look comes from the theme (`--ar-*` tokens). Every token has a default; a theme changes some.
- Global in templates: `Deck Slide Img Icon Snippet Notes Cols Rows Grid Center`, `v-step`,
  `v-step-from`. Addons (`ProgressBar`, `SlideNumber`) and composables (`useDeck`, `useSlide`)
  are imported from `'araojs'` in `<script setup>`.

## Rules

Do:
- Arrange with a `layout` (`cover`, `section`, `split`, `image-left`, `image-right`) or a
  composition component (`Cols`, `Rows`, `Grid`, `Center`) and their props (`ratio`, `gap`,
  `align`, `cols`).
- Start every content slide with its heading (`h2`), or give it `Slide(title="…")` when it has
  none: the first heading names the slide in the jump menu, presenter view and notes pages.
  Something before it (a kicker line) makes it body: use `template(#title)` for a richer header.
- Let the body be centred (the default) or say where: `Slide(align="start")` for a long list or
  anything read from the top, `align="end"`.
- Put what goes on every slide (event, company, slide number) in `Deck`'s `template(#footer)`.
- Write tables as plain `table` / `thead` / `tbody`: the theme styles them.
- One idea per slide. Reveal with steps instead of cramming.
- Name files, never import them: `Snippet(file="App.java")` from `src/snippets/`,
  `Img(file="team.jpg")` / `Slide(bg="team.jpg")` from `src/images/` (subfolders ok, case-sensitive).
- Use `Icon` for icons and logos, by name: `lucide:…` for UI icons, `simple-icons:…` for
  technology logos. Colour it like text. Logos name the technology; they are not decoration.
- Write sizes, if any, in canvas px (`gap="24"`, `:size="36"`, `width: 320px`).
- Put speaker notes in one `Notes` inside the slide, with `v-step` inside it for what shows at
  each step.
- Put components only one talk uses under `src/decks/<talk>/`, shared ones under `src/slides/`;
  the deck imports them in `<script setup>`.

Don't:
- Don't write ad-hoc layout CSS (flex/grid wrappers, margins to position things) when a layout,
  component or prop does it: no `margin: auto` or `.ar-slide > …` selectors to centre a body
  (`align` does it), no footer drawn in a background image (`#footer` does it).
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
  `:highlights='{ "2-3": 2 }'` (JSON in single quotes). Text props stay plain: `gap="sm"`,
  `ratio="2 1"`, `cols="3"`, `file="App.java"`, `Icon(size="64")`.
- **`Img` has no size of its own**: it fills the box its container gives it. Fixed size: a class
  with both sizes (`.avatar { flex: none; width: 320px; height: 320px; }`).
- **Icon names must be written out in the source** (`lucide:rocket` in a template or in data).
  A name built at runtime shows a dashed box and warns.

More, with the fix for each: [references/troubleshooting.md](references/troubleshooting.md).

## References

| File | Read it when |
|---|---|
| [project-setup.md](references/project-setup.md) | creating a slides project, its folders and files |
| [recipes.md](references/recipes.md) | writing slides: skeleton, covers, steps, code, columns, images, icons, notes, footer, tables |
| [themes-and-fonts.md](references/themes-and-fonts.md) | changing the look: a theme, theme sources and packages, web fonts |
| [shortcuts.md](references/shortcuts.md) | keys while presenting, or a clicker/headset that needs its own key |
| [verify.md](references/verify.md) | checking a deck before calling it done |
| [troubleshooting.md](references/troubleshooting.md) | a warning, a blank or odd slide, layout surprises |

## In the manual (`docs/`)

- Every prop and slot: `reference/components.md`; `v-step`: `reference/directives.md`;
  `useDeck`/`useSlide`: `reference/composables.md`; plugin options: `reference/vite-plugin.md`;
  `arao export`: `reference/cli.md`; URLs: `reference/urls.md`; tokens: `reference/theme-tokens.md`.
- Guides: `guide/concepts.md`, `guide/slides-and-layouts.md`, `guide/steps.md`, `guide/code.md`,
  `guide/composition.md`, `guide/images-and-backgrounds.md`, `guide/icons.md`, `guide/themes.md`,
  `guide/presenting.md`, `guide/export.md`, `guide/hosting.md`, `guide/extending.md`.
- Working examples: `examples/` (small one-slide decks), the project's own decks, and
  `playground/` in the Arao repository.
- How the engine is built (only to change Arao itself): `architecture.md`.
