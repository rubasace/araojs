# AGENTS.md — writing decks with Phoenyx

Operational guide for AI agents writing or editing slide decks in this repo. Full API:
[docs/reference.md](docs/reference.md). Overview: [README.md](README.md).

## Mental model

- A deck is one file, `src/decks/<Name>.vue`, opened at `/?deck=<name>` (case-insensitive).
- Structure: `Deck` → `Slide` → content. Addons (`ProgressBar`, `SlideNumber`) sit inside `Deck`,
  outside slides. Slide order = template order.
- The canvas has a fixed size, **1920x1080 px** by default (`Deck(:width="…" :height="…")` sets
  another), and is scaled as a whole. Every size you write is canvas px; it renders identically on
  any screen and in the PDF.
- **Steps are absolute numbers per slide.** `v-step="3"` means "from step 3 of this slide", not
  "after the previous element". Step 1 is what shows when the slide arrives.
- **A slide counts its own steps**: the largest `v-step` (or Snippet highlight step) inside it.
  Never declare a count.
- Look comes from the theme (`--ph-*` tokens). Slides say *what*, themes say *how it looks*.
- Globally available: `Deck Slide Img Snippet Notes Cols Rows Grid Center` and `v-step`. Addons are
  imported in `<script setup>`.

## Rules

Do:
- Use a `layout` (`cover`, `section`, `split`, `image-left`, `image-right`) or a composition
  component (`Cols`, `Rows`, `Grid`, `Center`) and their props (`ratio`, `gap`, `align`, `cols`)
  for arrangement.
- Give every content slide a heading (`h2`), or `Slide(title="…")` when it has none: it names the
  slide in the jump menu, presenter view and notes pages.
- One idea per slide. Reveal with steps instead of cramming.
- Name files, never import them: `Snippet(file="App.java")` from `src/snippets/`,
  `Img(file="team.jpg")` / `Slide(bg="team.jpg")` from `src/images/` (subfolders ok, case-sensitive).
- Write sizes, if any, in canvas px (`gap="24"`, `:size="36"`, `width: 320px`).
- Put speaker notes in `Notes` inside the slide.
- Put components only one talk uses under `src/decks/<talk>/`, and components several decks share
  (like `Card`) under `src/slides/`. Neither is global: the deck imports them in `<script setup>`
  (`import Card from '../slides/Card.vue'`).

Don't:
- Don't write ad-hoc layout CSS (flex/grid wrappers, margins to position things) when a layout,
  piece or prop does it.
- Don't hard-code colours or fonts in a deck. Style through tokens:
  `color: var(--ph-accent)`, `background: color-mix(in srgb, var(--ph-fg) 8%, var(--ph-bg))`.
  Venue-specific looks are a new theme, not edits to slides.
- Don't use `vw`, `vh`, `%` font sizes or media queries inside slides: the canvas keeps its size
  whatever the window; only its scale changes.
- Don't put a highlight at step 1 (`{ "4": 1 }`): step 1 always shows the code plain.
- Don't expect Snippet highlights to accumulate: each step shows only its own rules.
- Don't use `v-step` inside `Notes` (not supported) or outside a `Slide` (warns).
- Don't edit `src/engine/` to make one deck look right.

## Gotchas

- **Pug: a plain attribute is a string; a `:`-bound one is JavaScript.** Numbers, booleans, arrays
  and objects need the colon: `:size="36"`, `:line-numbers="false"`, `:themes="['default']"`,
  `:highlights='{ "2-3": 2 }'` (JSON in single quotes). Without it, `size="36"` is the string
  `"36"` and `line-numbers="false"` the string `"false"`: Vue warns and the line numbers stay.
  Props that take text, or a number written as text, are plain: `gap="sm"`, `ratio="2 1"`,
  `cols="3"`, `file="App.java"`, `bg-opacity="0.25"`, `Notes(step="2")`.
- **`Img` has no size of its own.** It fills the box its container gives it (the space under the
  title, a column, a cell, a zone, `Center`) and fits the picture inside; in a plain block it is as
  wide as the block. For a fixed size, give it a class with both sizes:
  `.avatar { flex: none; width: 320px; height: 320px; }`.
- **A new theme** is `src/themes/<name>.css` holding one `[data-theme="<name>"] { --ph-…: …; }`
  block, imported in `src/main.js` and listed in `Deck(:themes)`. If the file is not imported or
  the selector does not match the name, the slides render unstyled and nothing warns.
- **Headings inside `#background` are ignored for the slide's title** (jump menu, presenter,
  notes pages). Put the heading in the content, or use `Slide(title="…")`.

## Skeleton

```pug
<template lang="pug">
Deck(:themes="['default', 'vigojug']" duration="30m")
  ProgressBar
  SlideNumber

  //- slides go here
</template>

<script setup>
import ProgressBar from '../addons/ProgressBar.vue'
import SlideNumber from '../addons/SlideNumber.vue'
</script>
```

## Recipes

Title slide:
```pug
Slide(layout="cover" title="Opening")
  .bar
  h1 Building a framework
  p.muted Rubén Pahíno · VigoJUG 2026
```

Section divider:
```pug
Slide(layout="section")
  h1 Why a framework?
```

Bullet reveal (4 steps):
```pug
Slide
  h2 What we wanted
  ul
    li Same defaults in every service
    li(v-step="2") Logging and metrics for free
    li(v-step="3") Upgrades in one place
    li(v-step="4") Nothing to copy and paste
```
Variants: `v-step.only="n"` (only at step n), `v-step.collapse="n"` (takes no space while hidden).

Code walkthrough with highlights per step (3 steps: plain, line 2, then words on lines 8-10):
```pug
Slide(title="A debug filter")
  h2 A debug filter
  Snippet(file="DebugFilter.java" :highlights='{ "2": 2, "8-10:isDebug+++MDC.put": 3 }')
```
Keys: `"4"`, `"4-7"`, `"1,10-14"`, optionally `:word+++word`. Inline code:
`Snippet(code="npm run dev" lang="bash" name="terminal" fit :line-numbers="false")`.

Image + text:
```pug
Slide(layout="image-right" ratio="3 2")
  template(#image)
    Img(file="demo/landscape.svg" alt="A landscape")
  h2 One picture, one idea
  p The picture fills its side edge to edge.
  p(v-step="2") The text side is padded like any slide.
```

Two columns with a header:
```pug
Slide(layout="split")
  h2 Before and after
  template(#left)
    h3 Before
    p Every team rolled its own.
  template(#right)
    h3(v-step="2") After
    p(v-step="2") One starter, one version.
```

Three columns:
```pug
Slide
  h2 Three pillars
  Cols(gap="lg")
    div
      h3 Logging
      p.muted MDC, JSON, levels
    div(v-step="2")
      h3 Metrics
      p.muted Micrometer, tags
    div(v-step="3")
      h3 Clients
      p.muted RestTemplate, WebClient
```
Uneven: `Cols(ratio="2 1")`. Grid of cards: `Grid(cols="3" gap="sm")`. Centre something: `Center`.

Background image with opacity:
```pug
Slide(bg="demo/city.svg" bg-opacity="0.25")
  h2 Built for the city
  p A photo behind the text, faded into the theme's background.
```
Also `bg-position="center 30%"`, `bg-blur="4"`, `bg-fit="contain"`; `bg` also takes a colour or a
gradient. Layered backgrounds: `template(#background)` with an `Img` and a tint element.

Speaker notes:
```pug
Slide
  h2 Pricing
  p(v-step="2") Three tiers
  Notes
    p Start with the story of the first customer.
  Notes(step="2")
    p Tiers: say why there are exactly three.
```

## Verify a deck

1. `npm run dev` and open `http://127.0.0.1:5173/?deck=<name>`; walk it with `→`. Check
   `#/<slide>/<step>` in the URL and the step dots (move the mouse to show the controls).
2. Headless check (Playwright / `playwright-core`), at a 1920x1080 viewport:
   - collect `console` messages of type `warning`/`error` and `pageerror`: expect none. They come
     in two kinds: Vue's own, `[Vue warn]: Invalid prop: …`, when a prop fails its type or its
     validator (`gap="huge"`, `size="36"` without the colon, `fit="fill"`); and Phoenyx's, prefixed
     `[phoenyx]`, on missing files, values it cannot use (`bg`, `duration`), `v-step` or `Notes`
     outside a slide;
   - count `.ph-slide` elements; press `ArrowRight` until the hash stops changing and record the
     highest step per slide: compare with what you meant;
   - for overflow, compare the visible slide's `scrollHeight`/`scrollWidth` with its
     `clientHeight`/`clientWidth`;
   - screenshot a few `#/<slide>/<step>` and look at them.
3. `npm run export -- --deck <name>` (once: `npx playwright-core install chromium`) and read the
   summary line: pages, slides, steps, missing pictures.
4. `npx vite build` must pass.

## Where to look

- Every prop, slot, token, key and URL parameter: [docs/reference.md](docs/reference.md).
- Working examples: `src/decks/Demo.vue` (one slide per feature), `src/decks/Framework.vue` (a
  real 122-slide talk; its pictures are not in the repo, so they show as placeholders).
- Themes: `src/themes/*.css`.
