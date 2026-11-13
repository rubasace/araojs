# AGENTS.md — writing decks with Arao

Operational guide for AI agents writing or editing slide decks in a slides project that uses
Arao (the `araojs` package). In such a project this file is
`node_modules/araojs/AGENTS.md`, next to the full API, [docs/reference.md](docs/reference.md).
Overview: [README.md](README.md).

## Mental model

- A deck is one file, `src/decks/<Name>.vue`, opened at `/<name>` (case-insensitive); how it
  shows is the query (`/<name>?presenter`, `?theme=acme`, `?export`), where it stands the
  hash (`#/5/2`). `/` alone lists the project's decks, each with its cover drawn in a card (with
  only one, it opens it; `createDeckApp({ deckList: 'always' })` lists it anyway). The old
  `/?deck=<name>` still works and turns into `/<name>`. Under a Vite `base` (`/talks/`) every
  path is under it.
- **Templates are Pug or HTML.** `<template lang="pug">` is the recommended form (shorter; every
  recipe here uses it). A plain HTML `<template>` works the same: same components, props, slots
  and directives; each file picks its own. Translate a recipe tag by tag: `Slide(layout="cover")`
  → `<Slide layout="cover">…</Slide>`, `p.muted Text` → `<p class="muted">Text</p>`,
  `template(#left)` → `<template #left>`, `Snippet(file="App.java")` → `<Snippet file="App.java" />`.
- Structure: `Deck` → `Slide` → content. Addons (`ProgressBar`, `SlideNumber`) sit inside `Deck`,
  outside slides. Slide order = template order.
- The canvas has a fixed size, **1920x1080 px** by default (`Deck(:width="…" :height="…")` sets
  another), and is scaled as a whole. Every size you write is canvas px; it renders identically on
  any screen and in the PDF.
- **Steps are absolute numbers per slide.** `v-step="3"` means "from step 3 of this slide", not
  "after the previous element". Step 1 is what shows when the slide arrives.
- **A slide counts its own steps**: the largest `v-step` (or Snippet highlight step) inside it.
  Never declare a count.
- **A content slide has three zones**: the header (the `h1`/`h2` the slide starts with), the body
  (everything else, **centred vertically by default**) and the deck's footer (`Deck`'s `#footer`
  slot, on every slide but covers and sections). No template needed for the title.
- Look comes from the theme (`--ar-*` tokens). Slides say *what*, themes say *how it looks*. Every
  token has a default, and the defaults are the `default` theme; a project theme changes some.
- Globally available: `Deck Slide Img Icon Snippet Notes Cols Rows Grid Center`, `v-step` and `v-step-from`. Addons
  (`ProgressBar`, `SlideNumber`) and composables (`useDeck`, `useSlide`) are imported from
  `'araojs'` in `<script setup>`.

## The project

```
package.json       depends on araojs; scripts dev (vite), build (vite build), export (arao export)
vite.config.js     plugins: [arao()], from 'araojs/vite' (Vue, Pug and the folders below)
index.html         <div id="app"> and /src/main.js
src/main.js        createDeckApp().mount('#app')
src/decks/         one .vue file per deck (/<file name>)
src/decks/<talk>/  components only that talk uses
src/slides/        components several decks share
src/snippets/      code files, by name, for Snippet(file="…")
src/images/        pictures, by name, for Img(file="…") and Slide(bg="…")
src/themes/        the project's themes, if any: CSS files, loaded by the plugin (no import)
```

The engine is the library: nothing of it is copied into the project.

## Rules

Do:
- Use a `layout` (`cover`, `section`, `split`, `image-left`, `image-right`) or a composition
  component (`Cols`, `Rows`, `Grid`, `Center`) and their props (`ratio`, `gap`, `align`, `cols`)
  for arrangement.
- Start every content slide with its heading (`h2`), or give it `Slide(title="…")` when it has
  none: the first heading is the slide's header and names the slide in the jump menu, presenter
  view and notes pages. Something before it (a kicker line) makes it body: use `template(#title)`
  for a header with more than a heading.
- Let the body be centred (the default) or say where: `Slide(align="start")` for a long list or
  anything read from the top, `align="end"`; a theme changes the default with `--ar-body-align`.
- Put what goes on every slide (event, company, slide number) in `Deck`'s `template(#footer)`,
  with `{ number, total }` for the slide number; `Slide(:footer="false")` hides it on one slide,
  `:footer="true"` shows it on a cover or a section.
- Write tables as plain `table` / `thead` / `tbody`: the theme styles them (`--ar-table-*`).
- One idea per slide. Reveal with steps instead of cramming.
- Name files, never import them: `Snippet(file="App.java")` from `src/snippets/`,
  `Img(file="team.jpg")` / `Slide(bg="team.jpg")` from `src/images/` (subfolders ok, case-sensitive).
- Use `Icon` for icons and logos, by name: `Icon(name="lucide:…")` for UI icons, `Icon(name="simple-icons:…")`
  for technology logos (names: icon-sets.iconify.design, lucide.dev, simpleicons.org). Don't put icon
  files in `src/images/` or paste SVG into a deck. Colour it like text (`color: var(--ar-accent)`);
  logos are trademarks: use them to name the technology, not as decoration.
- Write sizes, if any, in canvas px (`gap="24"`, `:size="36"`, `width: 320px`).
- Put speaker notes in one `Notes` inside the slide; say what shows at each step with `v-step`
  inside it, as on the slide.
- Put components only one talk uses under `src/decks/<talk>/`, and components several decks share
  (like `Card`) under `src/slides/`. Neither is global: the deck imports them in `<script setup>`
  (`import Card from '../slides/Card.vue'`).

Don't:
- Don't write ad-hoc layout CSS (flex/grid wrappers, margins to position things) when a layout,
  piece or prop does it. In particular, no `margin: auto` or selectors on `.ar-slide > …` to
  centre a body (`align` does it) and no footer drawn in a background image or an addon
  (`#footer` does it). Title colour, size, gap, list spacing and table look are tokens
  (`--ar-title-*`, `--ar-list-gap`, `--ar-table-*`), set in the theme.
- Don't hard-code colours or fonts in a deck. Style through tokens:
  `color: var(--ar-accent)`, `background: color-mix(in srgb, var(--ar-fg) 8%, var(--ar-bg))`.
  Venue-specific looks are a new theme, not edits to slides.
- Don't use `vw`, `vh`, `%` font sizes or media queries inside slides: the canvas keeps its size
  whatever the window; only its scale changes.
- Don't put a highlight at step 1 (`{ "4": 1 }`): step 1 always shows the code plain.
- Don't expect Snippet highlights to accumulate: each step shows only its own rules.
- Don't use `v-step` outside a `Slide` (warns). Inside `Notes` it follows the slide's steps but
  adds none: a note at a step the slide does not reach never shows.
- Don't edit the library (`node_modules/araojs`) to make one deck look right: an engine change
  is a change to Arao, made in its own repository.

## Gotchas

- **Pug or HTML: a plain attribute is a string; a `:`-bound one is JavaScript.** Numbers, booleans, arrays
  and objects need the colon: `:size="36"`, `:line-numbers="false"`, `:themes="['default']"`,
  `:highlights='{ "2-3": 2 }'` (JSON in single quotes). Without it, `size="36"` is the string
  `"36"` and `line-numbers="false"` the string `"false"`: Vue warns and the line numbers stay.
  Props that take text, or a number written as text, are plain: `gap="sm"`, `ratio="2 1"`,
  `cols="3"`, `file="App.java"`, `bg-opacity="0.25"`, `Icon(size="64")`.
- **`Img` has no size of its own.** It fills the box its container gives it (the space under the
  title, a column, a cell, a zone, `Center`) and fits the picture inside; in a plain block it is as
  wide as the block. For a fixed size, give it a class with both sizes:
  `.avatar { flex: none; width: 320px; height: 320px; }`.
- **Icon names must be written out in the source.** The build includes only the icons whose full
  name (`lucide:rocket`) appears in `src/`, in a template or in data (`{ icon: 'lucide:rocket' }` +
  `Icon(:name="it.icon")` is fine). A name put together at runtime (`` `lucide:${kind}` ``) is not:
  it shows a dashed box and warns. List such names in the source, or in `arao({ icons: [...] })`
  in `vite.config.js`. Another set than Lucide or Simple Icons needs `npm install -D @iconify-json/<prefix>`.
- **A new theme** is a `[data-theme="<name>"] { --ar-…: …; }` block in a CSS file of
  `src/themes/` (`src/themes/<name>.css`), declaring only the tokens it changes over the defaults.
  Nothing to import: the plugin loads every CSS file there and takes the theme's name from the
  selector, not from the file (one file may hold several themes). A deck without `themes` offers
  every theme, `default` first; `Deck(:themes="['venue', 'default']")` picks some, in order. A
  name in that list that no stylesheet of the page declares is skipped with an `[arao]` warning.
  A theme kept elsewhere (`src/styles`, a package, a `.scss` file) and imported by hand, after
  `'araojs'` in `src/main.js`, works when a deck lists it, but a deck without `themes` does not
  offer it. No theme ships with the package besides `default` (the defaults); there is no
  `araojs/themes/…` to import.
- **Headings inside `#background` are ignored for the slide's title** (jump menu, presenter,
  notes pages). Put the heading in the content, or use `Slide(title="…")`.
- **The list of decks (`/`) draws each deck's cover.** Its card is titled by the file name in
  words (`my-talk.vue` → "My talk"), with the cover's first heading (the `h1`) under it: name the
  file after the talk, and give the cover the talk's name as its heading. A deck's code that runs
  when it mounts runs there too: anything that plays or fetches checks `useDeck().role`
  (`'thumbnail'` in the list; `onMounted(() => deck.role === 'audience' && video.value.play())`).
- **The body is centred, but what fills stays full height.** `Img`, `Snippet`, an element with
  `flex: 1`, `Grid` (its rows are `1fr`) and pieces holding any of those fill the body as before;
  `Cols` of plain content shrinks to its content and is centred (`Cols(align="stretch")` keeps
  full-height columns). `.collapse` steps re-centre the body as they come and go: use plain
  `v-step` (keeps its space) when the rest must not move.
- **The footer takes the bottom margin.** On slides that show it, the body ends where the footer
  band begins (88 px from the bottom by default). `cover` and `section` hide it unless
  `:footer="true"`. With a footer, prefer `{{ number }} / {{ total }}` inside it to `SlideNumber`.

## Skeleton

```pug
<template lang="pug">
Deck(duration="30m")
  ProgressBar
  SlideNumber

  //- slides go here
</template>

<script setup>
import { ProgressBar, SlideNumber } from 'araojs'
</script>
```

The same template in HTML (same `<script setup>`):

```vue
<template>
  <Deck duration="30m">
    <ProgressBar />
    <SlideNumber />

    <!-- slides go here -->
  </Deck>
</template>
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

Reusable steps: inside a component, number steps from 1 (`v-step="i + 1"`) and place it in the
slide with `v-step-from`: `Card(v-step-from="5")` shows its step 1 at slide step 5. Works for
`useSlide()` (and so Snippet highlights) too; scopes nest and add up.

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
Uneven: `Cols(ratio="2 1")`. Grid of cards: `Grid(cols="3" gap="sm")`, or let the count decide:
`Grid(ratio="2:1")` (columns : rows; 5 cards → 3 + 2, last row centred). Centre something: `Center`.

Icons (in text: as tall as the text; alone: `size` px):
```pug
Slide
  h2 #[Icon(name="lucide:rocket")] Getting started
  Grid(cols="3" gap="md")
    Center(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
      Icon(:name="t.icon" size="120" :label="t.label")
      p {{ t.label }}
```
with `const tech = [{ icon: 'simple-icons:vuedotjs', label: 'Vue' }, { icon: 'simple-icons:kubernetes', label: 'Kubernetes' }, { icon: 'simple-icons:openjdk', label: 'Java' }]`
in `<script setup>`. Accent colour: a class, `Icon.hot(name="lucide:flame")` and `.hot { color: var(--ar-accent); }`.

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
    p(v-step="2") Tiers: say why there are exactly three.
```

Body placement (centred by default; the heading always stays on top):
```pug
Slide
  h2 One idea
  p.lead Centred under the title, no CSS.

Slide(align="start")
  h2 A long list
  ul
    li Read from the top…
```

Footer on every slide, with the slide number:
```pug
Deck
  template(#footer="{ number, total }")
    span ACME · DevConf 2026
    span {{ number }} / {{ total }}

  Slide(layout="cover" :footer="true")
    h1 Shown on this cover too
  Slide(:footer="false")
    h2 Not on this one
```
A theme moves and colours it with tokens: `--ar-footer-align: flex-end`, `--ar-footer-color`,
`--ar-footer-size`, `--ar-footer-height`.

Table (styled by the theme's `--ar-table-*` tokens):
```pug
Slide
  h2 Pace
  table
    thead
      tr
        th Period
        th Merged
    tbody
      tr(v-for="(r, i) in rows" :key="r.period" v-step="i + 1")
        td {{ r.period }}
        td {{ r.merged }}
```

## Verify a deck

1. `npm run dev` and open `http://127.0.0.1:5173/<name>`; walk it with `→`. Check
   `#/<slide>/<step>` in the URL and the step dots (move the mouse to show the controls). Open
   `http://127.0.0.1:5173/` too: the deck's card shows its cover, its file name in words and,
   under it, the cover's heading.
2. Headless check (Playwright / `playwright-core`), at a 1920x1080 viewport:
   - collect `console` messages of type `warning`/`error` and `pageerror`: expect none. They come
     in two kinds: Vue's own, `[Vue warn]: Invalid prop: …`, when a prop fails its type or its
     validator (`gap="huge"`, `size="36"` without the colon, `fit="fill"`); and Arao's, prefixed
     `[arao]`, on missing files or icons, values it cannot use (`bg`, `duration`), `v-step` or
     `Notes` outside a slide, a path that names no deck;
   - count `.ar-slide` elements; press `ArrowRight` until the hash stops changing and record the
     highest step per slide: compare with what you meant;
   - for overflow, compare the visible slide's `scrollHeight`/`scrollWidth` with its
     `clientHeight`/`clientWidth`;
   - screenshot a few `#/<slide>/<step>` and look at them.
3. `npm run export -- --deck <name>` (once: `npx playwright-core install chromium`) and read the
   summary line: pages (one per step by default; `--per-slide` for one per slide), slides, steps,
   missing pictures. Without `--deck` it exports every deck, one line each plus a total.
4. `npm run build` must pass.

## Where to look

- Every prop, slot, token, key and URL (and hosting a build under a path): [docs/reference.md](docs/reference.md).
- How the engine is built (only for a change to Arao itself): [docs/architecture.md](docs/architecture.md).
- Working examples: the project's own decks; `playground/` in the Arao repository, a tiny
  project set up like any other.
- Themes: the defaults (the `default` theme) in the Theme tokens table of
  [docs/reference.md](docs/reference.md#theme-tokens); the project's in `src/themes/*.css`.
