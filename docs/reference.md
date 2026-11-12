# Arao reference

Everything a deck can use, as the library (the `araojs` package) implements it. Sizes are
canvas px (the canvas is 1920x1080 unless `Deck` says otherwise). Examples are Pug, inside a
deck's `<template lang="pug">`: the recommended form, for brevity. A deck can also be a plain
HTML `<template>`, with the same components, props, slots and directives
([Pug or HTML](#pug-or-html)). Paths like `src/decks` are the slides project's, with the
plugin's default folders.

Globally registered: `Deck`, `Slide`, `Img`, `Icon`, `Snippet`, `Notes`, `Cols`, `Rows`, `Grid`,
`Center`, and the directives `v-step` and `v-step-from`. Imported by hand from `'araojs'`:
the addons (`ProgressBar`, `SlideNumber`) and the composables (`useDeck`, `useSlide`).

Pug reminders: a plain attribute is a string (`gap="sm"`); a `:`-bound one is a JavaScript
expression (`:themes="['default']"`, `:size="36"`, `:line-numbers="false"`). Object props are
written as JSON in single quotes: `:highlights='{ "2-3": 2 }'`.

Contents: [Setup](#setup) · [Deck](#deck) · [Slide](#slide) ([zones](#zones-header-body-footer)) · [v-step](#v-step) ·
[Cols, Rows, Grid, Center](#cols-rows-grid-center) · [Utility classes](#utility-classes) ·
[Img](#img) · [Icon](#icon) · [Snippet](#snippet) · [Notes](#notes) · [Controls](#controls) ·
[Presenter view](#presenter-view) · [Export mode](#export-mode) · [useDeck()](#usedeck) ·
[useSlide()](#useslide) · [Addons](#addons) · [Vite plugin](#vite-plugin) ·
[Theme tokens](#theme-tokens) · [URLs](#urls) · [Hosting](#hosting)

How the engine itself is built (folders, views, provide/inject channels): [architecture.md](architecture.md).

---

## Setup

A slides project is a Vite app with the `araojs` package (and `vue`, `vite`, its peers):

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
// src/main.js (index.html: <div id="app"></div> and <script type="module" src="/src/main.js">)
import { createDeckApp } from 'araojs'
import 'araojs/themes/default.css'
import 'araojs/themes/vigojug.css'
createDeckApp().mount('#app')
```

```json
"scripts": { "dev": "vite", "build": "vite build", "export": "arao export" }
```

- `arao()` is the only plugin: it includes `@vitejs/plugin-vue` and Pug ([Vite plugin](#vite-plugin)).
- `createDeckApp(options?)` creates the Vue app with the engine installed and renders the deck
  the URL's path names, `/<name>` ([URLs](#urls)). At `/` it lists the decks: a card per deck,
  in alphabetical order, with the deck's cover (its first slide at step 1, in its first theme)
  drawn live and small in it, its title and its path. The title is the cover's first heading once
  the cover is drawn (else its `Slide(title)`), and until then the file name in words. A cover is
  drawn when its card nears the viewport, and is a picture: nothing in it reacts, nothing plays,
  it touches neither the URL nor other windows (`useDeck().role` is `'thumbnail'` there; only
  the cover slide draws its content, but code a deck runs when it mounts runs there too). The
  page has its own dark look, like the presenter view. Each card is a link that keeps the page's
  query, not its hash: on `/?presenter&theme=vigojug` they lead to
  `/<name>?presenter&theme=vigojug`. A path that names no deck warns in the console and shows
  the list, with a notice. Two deck files whose names differ only in case (`Talk.vue`,
  `talk.vue`) are one deck to the path: the first in code-point order (`Talk`) is kept, with a
  warning in the dev server.

  | Option | Default | Meaning |
  |---|---|---|
  | `deckList` | `'auto'` | `'auto'`: a project with one deck opens it at `/`, with several `/` lists them. `'always'`: `/` lists the decks even when there is one |

  Any other option, or a value that is none of these, warns in the console and is ignored.
- The engine's CSS (structure, layouts, controls) comes with `'araojs'`; themes are imported
  one by one: `araojs/themes/<name>.css` for the shipped ones (`default`, `vigojug`), your own
  from `src/themes/` ([Theme tokens](#theme-tokens)).
- Own app shell instead of `createDeckApp`: `createApp(MyApp).use(Arao)` with
  `import Arao from 'araojs'`; it registers the components and directives above.
- Package entry points: `araojs` (engine, `createDeckApp`, components, `step`/`stepFrom`,
  composables, addons), `araojs/vite` (the plugin), `araojs/themes/*.css`,
  `araojs/style.css` (the engine's CSS, already imported by `araojs`); the `arao` command
  ([Export mode](#export-mode)).

### Pug or HTML

A deck's template is a plain Vue template, in either syntax; each file picks its own. Pug
(`<template lang="pug">`) is the recommended one, for brevity, and the plugin brings it along.
HTML (`<template>`) is Vue's own and needs nothing. Components, props, slots, directives and the
attribute rules above are the same in both: `Slide(layout="split")` is `<Slide layout="split">`,
`p.muted Text` is `<p class="muted">Text</p>`, `template(#left)` is `<template #left>`, and a
component with no content may close itself. A split slide, in HTML:

```vue
<template>
  <Deck :themes="['default']">
    <Slide layout="split">
      <h2>Before and after</h2>
      <template #left>
        <h3>Before</h3>
        <p class="muted">Every team rolled its own.</p>
      </template>
      <template #right>
        <h3 v-step="2">After</h3>
        <Snippet file="Starter.java" :highlights='{ "2-3": 2 }' :line-numbers="false" />
      </template>
    </Slide>
  </Deck>
</template>
```

---

## Deck

The root of a deck: the canvas, the slides, the controls, the keyboard, the URL, the presenter
view and export mode. One per deck file (`src/decks/<Name>.vue`).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `themes` | Array of strings | `['default']` | the themes this deck can wear; the first is the default. Each must exist as a `[data-theme="<name>"]` token block imported in `src/main.js` (`araojs/themes/<name>.css` for the shipped ones). |
| `duration` | String or Number | none | the talk's length, for the presenter's countdown. `90` / `"90"` / `"7.5"` (minutes), `"45m"`, `"45min"`, `"1h30m"`, `"1h 30m"`, `"1h30"`, `"90s"`, `"45:00"` (m:ss), `"1:30:00"` (h:mm:ss). Anything else warns and shows no countdown; a length under 1 minute or over 24 hours warns and still counts. It is the default: the presenter can change it live, without editing the deck, and that change wins until it is reset ([Presenter view](#presenter-view)). |
| `width` | Number | `1920` | canvas width in px |
| `height` | Number | `1080` | canvas height in px |
| `hideCursorAfter` | Number (ms) | `5000` | hide the mouse cursor after this long without movement; `0` never hides it |

Slots:
- default: the slides and the addons, in any order. Slide order is the order in the template
  (document order), even for slides mounted later by `v-if` or moved by a keyed `v-for`.
- `#footer`: the deck's footer, drawn at the bottom of every slide except `cover` and `section`
  ([Zones](#zones-header-body-footer)). Slot props: `{ number, total }`, the slide's number
  (1-based) and the number of slides. Real DOM in the theme's fonts, so it prints as text and shows
  in the presenter view; each slide draws its own copy, which fades with it.

```pug
Deck(:themes="['default']")
  template(#footer="{ number, total }")
    span ACME · DevConf 2026
    span {{ number }} / {{ total }}
  Slide
    h2 Hello
```

Behaviour:
- The hash `#/<slide>/<step>` (both 1-based) is kept up to date and read on load and on change.
- `?theme=<name>` picks the theme; `t` or the picker cycles through `themes`. A name that is not
  in `themes` is applied anyway in the normal view (no tokens match: the slides look unstyled) and
  is an error in export mode.
- All windows of the same deck in the same browser stay in step (position, theme, timer, the
  duration set in the presenter view) through a `BroadcastChannel` keyed by the page path and
  query, ignoring `presenter` and `theme`. A new window takes the position and theme of those
  already open, unless its URL names a theme.

```pug
Deck(:themes="['default', 'vigojug']" duration="45m")
  ProgressBar
  SlideNumber
  Slide
    h1 Hello
```

---

## Slide

One slide, inside its padding (`--ar-pad`). A content slide has three zones, top to bottom: the
header (its title), the body (everything else) and the deck's footer
([Zones](#zones-header-body-footer)).

| Prop | Type | Default | Accepted values |
|---|---|---|---|
| `layout` | String | `default` | `default`, `cover`, `section`, `split`, `image-left`, `image-right`, `two-cols`; any other value adds the class `layout-<value>` (for a theme to style) and works as `default` |
| `title` | String | first `h1`/`h2`/`h3` of the slide (outside the background and the footer) | name in the jump menu, the presenter bar and the notes pages |
| `align` | String | the theme's `--ar-body-align` (`center` by default) | `start`, `center`, `end`: where the body sits vertically (`default` layout) |
| `footer` | Boolean | shown, except on `cover` and `section` | `:footer="false"` hides the deck's footer on this slide; `:footer="true"` shows it on a `cover` or `section` |
| `ratio` | String | `"1 1"` | zone widths for `split`, `image-left`, `image-right`, left to right. Exactly two entries; each a positive number (a share), `auto`, or `<n>px`. Shares are proportions: `"2 1"` = `"66 33"`. Invalid → warning, `"1 1"`. |
| `bg` | String | none | background: a URL, an images-folder file, or a CSS colour/gradient (see below) |
| `bg-opacity` | Number or String | `1` | `0`..`1`: the picture's opacity over the slide colour |
| `bg-position` | String | `center` | CSS `object-position` / `background-position`, e.g. `"center 30%"` |
| `bg-blur` | Number or String | `0` | blur radius in px (`4` or `"4px"`) |
| `bg-fit` | String | `cover` | `cover` or `contain` |

### Layouts

| Layout | What it does | Slots |
|---|---|---|
| `default` | zones: the header (the heading the slot starts with), the body (the rest, centred by default), the footer | `#title` (optional, for a complex header), default |
| `cover` | content centred vertically; `h1` at 1.25x `--ar-title`; a `.bar` element draws a short accent bar; no footer unless `:footer="true"` | default |
| `section` | everything centred, slide filled with `--ar-accent`, text `--ar-accent-fg`; `h1` at 1.4x `--ar-title`; no footer unless `:footer="true"` | default |
| `split` | a header (the default slot: the heading, maybe a lead line) above two zones side by side | `#title`, default (header), `#left`, `#right` |
| `image-left` / `image-right` | the `#image` zone fills its half edge to edge (no padding, inset `--ar-image-inset`); the default slot is the text side, padded like a slide | `#image`, `#title`, default (text side) |
| `two-cols` | legacy: a child with class `.cols` becomes a two-column grid. Prefer `split` or `Cols`. | default |

All slots receive `{ step }` (the slide's current step) as slot props.

- `#title` always renders first; in `image-*` it tops the text column, never the image.
- A zone keeps its width: wider content is clipped at the zone's edge. Heights do not clip.
- `ratio` in `image-*` sizes the zones left to right, whichever side holds the image:
  `image-right` with `ratio="3 2"` is text 3/5, image 2/5.
- `split` and `image-*` keep their own zones; the footer shows under them (their zones end where
  it begins), and their heading is the slide's title for the `--ar-title-*` tokens. `align` only
  places the body of `default` (and of layouts without zones of their own).
- Content styles from `Slide.vue`'s CSS: `h1` is `--ar-title`; `h2` is 0.6x `--ar-title` in
  `--ar-accent`; `p` has a bottom margin of 0.6em; lists and tables below.

### Zones: header, body, footer

A slide of the `default` layout (or of any layout name without zones of its own) is laid out in
three zones. Nothing to declare: the slide finds them.

```pug
Slide
  h2 Three pillars        //- header: the heading the slide starts with
  Cols(gap="lg")          //- body: everything else
    div …
```

- **Header**: when the default slot starts with an `h1` or `h2`, that heading is the slide's title
  and goes into the header; headings right after it go there too (a subtitle, or one title per
  step: `h2(v-step.only.collapse="1") …`, `h2(v-step.only.collapse="2") …`). Comments, `v-if`s
  that render nothing and `Notes` before it do not count. A `#title` slot, when given, is the
  header instead, for headers with more than a heading (a kicker line, a logo); its first `h1`/`h2`
  is the title. A slide that starts with anything else has no header: the body takes the slide.
  The title carries the class `ar-title` and follows the `--ar-title-*` tokens; with
  `--ar-header-height` the header is a band of that height with the title centred in it
  ([Theme tokens](#slide-zones-and-content)).
- **Body**: everything else, in a column that fills the space between the header and the footer.
  `align` (or the theme's `--ar-body-align`, `center` unless the theme says otherwise) places it:
  `start` (from the top), `center`, `end`. What does not fit overflows at the bottom, never at the
  top. What fills the body still fills it whatever the alignment: `Img`, `Snippet`, an element with
  `flex: 1`, the `1fr` rows of `Grid` and `Rows`. `Cols`, `Rows` and `Grid` placed directly in a
  centred (or end-aligned) body shrink their auto rows to their content and centre them, unless
  they hold something that needs the full height (a `Snippet`, an `Img`, another piece): then
  they fill as in a `start` body. `Cols(align="stretch")`, written out, keeps full-height columns.
  `.collapse` steps in a centred body move the rest as they come and go (it is re-centred).
- **Footer**: the `Deck`'s `#footer` slot, in a band `--ar-footer-height` tall (88 px) at the
  bottom of the slide, with the slide's side padding and its text in `--ar-footer-size` and
  `--ar-footer-color`. Its children sit in a row, spread by `--ar-footer-align` (`space-between`:
  one at the start, two at both ends). The band takes the place of the slide's bottom padding, so
  the body (and the zones of `split` and `image-*`) ends where the footer begins. Hidden on `cover`
  and `section` unless `:footer="true"`; there it sits over the bottom padding, and on a section it
  takes the section's text colour unless the theme sets `--ar-footer-color` for `.layout-section`.
  `Slide(:footer="false")` hides it on one slide.
- `SlideNumber` keeps its corner (bottom right, on the footer band's line with the default
  height), outside the footer's content box. To have the number inside the footer, use the slot
  props (`{{ number }} / {{ total }}`) instead of `SlideNumber`.

```pug
Slide(align="start")      //- this slide's body from the top
  h2 A long list
  ul …

Slide(:footer="false")    //- no footer here (a full-bleed picture, say)
  …
```

### Lists and tables

- Lists: `--ar-list-gap` is the space between items (default `0`).
- Tables get a plain style from tokens: full width, collapsed borders, cells padded
  `--ar-table-pad`, a line `--ar-table-border` under every row, header cells in
  `--ar-table-head-color` on `--ar-table-head-bg`, every other body row on `--ar-table-stripe`.
  These rules have zero specificity: any rule of the deck (`.my-table td { … }`) wins.

```pug
Slide
  h2 Pace
  table
    thead
      tr
        th Period
        th Merged
    tbody
      tr
        td September
        td 32
      tr
        td October
        td 59
```

### Backgrounds

The background is a layer under the content, as big as the slide, that never catches the pointer.
`bg` is read in this order:

1. **URL**: starts with a scheme or `/` (`https://…`, `data:…`, `/from-public.jpg`). Root-relative
   paths are served under Vite's `base`.
2. **File**: a file in the images folder (`city.jpg`, `team/ana.png`, `"photo (1).jpg"`), or a
   name that looks like a file (ends in an extension) but is not there: shown as missing, with a
   warning.
3. **CSS**: anything else, as a CSS `background` (`"#1d2b4a"`, `"linear-gradient(…)"`).
   `url(…)` here is plain CSS, relative to the page, not processed by Vite: name the file instead.
   An invalid value warns in development.

A blank `bg` is no bg. `#background` slot: every element in it covers the whole slide, stacked in
order (a picture, then a tint over it); `v-step` works inside. With both, `bg` is drawn first and
the slot above it. With neither (a slot that renders nothing counts as none), the theme's default
background shows (`--ar-slide-bg-*`), and the `bg-*` props tune it. Headings inside the
background are not used as the slide's title.

```pug
Slide(layout="split" ratio="2 1")
  h2 Before and after
  template(#left)
    p Every team rolled its own.
  template(#right)
    p(v-step="2") One starter, one version.

Slide(layout="image-right" ratio="3 2")
  template(#image)
    Img(file="demo/landscape.svg" alt="A landscape")
  h2 One picture, one idea
  p The picture fills its side edge to edge.

Slide(bg="demo/city.svg" bg-opacity="0.25")
  h2 Built for the city

Slide(bg="linear-gradient(135deg, #1d2b4a, #0f1115)")
  h2 A gradient background

Slide
  template(#background)
    Img(file="demo/landscape.svg" blur="6")
    .veil
  h2 A softened background
```

(`.veil` is a class of the deck, e.g.
`.veil { background: color-mix(in srgb, var(--ar-bg) 70%, transparent); }`.)

---

## v-step

Reveals an element at a step of its slide.

| Form | Meaning |
|---|---|
| `v-step="n"` | visible from step `n` on; hidden before (keeps its space: `opacity: 0`) |
| `v-step.only="n"` | visible only at step `n` |
| `v-step.collapse="n"` | like `v-step`, but while hidden it takes no space (`display: none`) |
| `v-step.only.collapse="n"` | both |

Numbering rules:
- Steps start at 1 and `n` is **absolute** within the slide (not relative to the previous
  element). Step 1 is what shows when the slide arrives; `v-step="1"` is always visible.
- A slide's step count is the **largest** `n` over every `v-step` inside it (any depth, any
  component) and every `useSlide().requireSteps(n)` (Snippet highlights use this). There is
  nothing to declare. Gaps are allowed: a slide with only `v-step="3"` has 3 steps, and step 2
  changes nothing.
- A slide already passed shows its last step; a slide not reached yet shows step 1.
- Several elements may share a number: they appear together.

Behaviour:
- Works in nested components (it finds its slide through the DOM) and in `#background`.
- Outside a `Slide` it warns and does nothing.
- Fade duration: `--ar-step-duration` (default `.35s`).
- With `.collapse`, the elements around it glide to their new place (FLIP). Slides not on screen,
  `prefers-reduced-motion`, and export mode switch without the glide.
- Inside `Cols`/`Rows`/`Grid`, a collapsed child frees its track and the children after it shift
  back one track until it shows.

```pug
Slide
  h2 One at a time
  p Always visible.
  p(v-step="2") From step 2.
  p(v-step.only="3") Only at step 3 (keeps its space).
  p(v-step.only.collapse="4") Only at step 4 (takes no space).
```

### v-step-from: relative steps for reusable components

`v-step-from="n"` on any element or component makes every `v-step` and `useSlide()` inside it
**relative**: their step 1 is step `n` of the slide. A component can number its own steps from 1
and the deck decides where they land, so the same component (or the same "animation") is reused
at any point of any slide.

- Value: an integer ≥ 1 (anything else warns and counts as 1). `v-step-from="1"` changes nothing.
- Scopes nest and add up: `v-step-from="3"` inside `v-step-from="2"` starts at step 4.
- A `v-step` on the same element as `v-step-from` is **not** shifted by it (it places the element
  itself, relative to the outer scopes); its descendants are.
- `useSlide()` inside a scope: `step` is relative (it can be ≤ 0 before the scope starts) and
  `requireSteps(n)` declares `n` relative steps. Snippet highlights follow, since they use it.
- The slide's total is still the highest absolute step.

```pug
//- src/slides/Card.vue — knows nothing about where it sits
.card
  h3 {{ title }}
  ul
    li(v-for="(item, i) in items" v-step="i + 1") {{ item }}
```
```pug
Slide
  h2 Two cards, one after the other
  Cols
    Card(title="A" :items="['One', 'Two', 'Three']" v-step-from="2")   //- steps 2, 3, 4
    Card(title="B" :items="['Four', 'Five']" v-step-from="5")          //- steps 5, 6
  Snippet(file="App.java" v-step-from="7" :highlights='{ "3": 2 }')    //- highlight at step 8
```

---

## Cols, Rows, Grid, Center

Boxes laid out by props. Each fills the free space of its container (the rest of the slide under
the title, a zone, a cell of another piece) and takes `v-step` like any element.

| Component | Props | Default |
|---|---|---|
| `Cols` | `ratio`, `gap`, `align` | one equal column per child, `gap="md"`, `align="stretch"` |
| `Rows` | `ratio`, `gap` | equal rows, one per child, `gap="md"` |
| `Grid` | `cols`, `ratio`, `gap` | `cols="3"`, equal cells filled row by row, `gap="md"`; with `ratio` the columns come from the number of children |
| `Center` | none | content centred both ways, text centred too |

- `ratio` (String): one entry per track, separated by spaces or commas. Each entry is a positive
  number (a share of the free space; shares are proportions, `"1 2"` = `"33 67"`), `auto` (fits its
  content) or `<n>px`. No other units, no `fr`, no CSS functions. Invalid → warning, equal tracks.
  Children beyond the entries start a new row (`Cols`) or get equal rows (`Rows`).
- `gap` (String or Number): `sm` | `md` | `lg` (tokens `--ar-gap-sm|md|lg`: 24/48/80 px), a number
  of px (`12`), or a length in `px`, `em`, `rem` (`"1.5em"`). Invalid → warning, `md`.
- `align` (`Cols` only): `start` | `center` | `end` | `stretch`, vertical placement in each column.
  In a centred slide body the row is as tall as its content; `align="stretch"`, written out, keeps
  the columns as tall as the body.
- `cols` (`Grid` only): a whole number ≥ 1.
- `ratio` (`Grid` only): the grid's **shape**, columns : rows — `"2:1"`, `"3/2"`, `"1.5"` (not the
  track ratio of Cols/Rows). With n children: rows = round(√(n / ratio)), at least 1, and
  columns = ⌈n / rows⌉. For 2:1: 3 → one row of 3, 5 → 3 + 2, 6 → 3 + 3, 7 → 4 + 3, 8 → 4 + 4. An
  incomplete last row is **centred** under the full ones. It overrides `cols`; invalid values warn.
  ```pug
  Grid(ratio="2:1" gap="sm")
    .card(v-for="(item, i) in items" v-step="i + 1") {{ item }}
  ```
- Overflow: widths hold, heights grow. A child is never wider than its track; what is wider
  inside it is clipped at the track edge. Rows grow to fit their content, so a piece that does not
  fit overflows its container at the bottom.

```pug
Slide
  h2 Three pillars
  Cols(gap="lg")
    div
      h3 Logging
      p.muted MDC, JSON, levels
    div(v-step="2")
      h3 Metrics
    div(v-step="3")
      h3 Clients

Slide
  h2 Rows and Grid
  Rows(ratio="auto 1")
    p.muted Six things, in a 3-column grid
    Grid(cols="3" gap="sm")
      Center(v-for="n in 6" :key="n") Item {{ n }}
```

---

## Utility classes

An escape hatch for one-off tweaks inside a slide, not a styling system.

| Class | Effect |
|---|---|
| `.muted` | colour `--ar-muted` |
| `.center` | `text-align: center` |
| `.upper` | uppercase |
| `.small` | font size `--ar-text-small` (default `.75em`) |

`.bar` inside a `cover` slide draws the accent bar. `.cols` inside a `two-cols` slide is its grid.

```pug
p.small.muted.center A footnote
```

---

## Img

A picture from the images folder (`src/images` by default) or any URL.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `file` | String | — | path inside the images folder (`team.jpg`, `team/ana.jpg`); case-sensitive. Wins over `src`. |
| `src` | String | — | any URL; root-relative (`/logo.svg`, from `public/`) is served under Vite's `base` |
| `alt` | String | `''` | describe the picture when it says something; empty = decorative |
| `fit` | String | `contain` (`cover` inside `#image` and backgrounds) | `contain` or `cover` |
| `position` | String | `center` | CSS `object-position`: what stays in view when cropped |
| `opacity` | Number or String | `1` | `0`..`1` |
| `blur` | Number or String | `0` | px |
| `rounded` | Boolean, String or Number | `false` | `rounded` = the theme's `--ar-radius`; `rounded="full"` = circle; `rounded="24"` = px; or a CSS length |

Behaviour and gotchas:
- **No size of its own.** It fills the box its container gives it (the space under the title, a
  column, a cell, a zone, `Center`) and fits the picture inside. In a plain block it is as wide as
  the block and as tall as the picture's shape. For a fixed size, give it a class with width and
  height (or one of them and the other `auto`): `.avatar { flex: none; width: 320px; height: 320px; }`.
- A missing file (or a URL that fails) shows a dashed box with the file name (and the alt, if
  any), and one grouped warning in development.
- Every picture of the folder is fetched when the deck opens (all slides are in the page).
  Text, code, CSS and SVG stay sharp at any screen size (the canvas is scaled with a transform and
  re-rasterised), but photos are upscaled with it: for a 4K screen give a picture about twice its
  size in canvas px (a full-slide background ≈ 3840 px wide). Prefer WebP/AVIF/JPEG to keep the
  download small.
- Only `png`, `jpg`, `jpeg`, `gif`, `webp`, `avif`, `svg` are taken from the folder.

```pug
Cols
  Img(file="demo/landscape.svg")
  Img(file="demo/landscape.svg" fit="cover" rounded)
  Center
    Img.avatar(file="demo/city.svg" fit="cover" rounded="full")
```

---

## Icon

An icon of an [Iconify](https://icon-sets.iconify.design/) set, drawn inline as SVG. Icons are
resolved when the project is built or served: nothing is fetched when presenting, and they are
vectors in the PDF.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | String | — (required) | `prefix:name`: `lucide:rocket`, `simple-icons:vuedotjs` |
| `size` | Number or String | `1em` tall | px, the icon's height: `size="64"` (plain is fine) or `:size="64"`. The width follows the icon's shape (square for Lucide and Simple Icons) |
| `label` | String | — | what the icon says: `role="img"` and `aria-label`; without it the icon is decorative (`aria-hidden`) |

```pug
h2 #[Icon(name="lucide:rocket")] Launch
p #[Icon.hot(name="lucide:flame")] The hot path
Icon(name="simple-icons:kubernetes" size="120" label="Kubernetes")
Grid(cols="4" gap="md")
  Icon(v-for="it in items" :key="it.icon" :name="it.icon" size="96")
```

(`.hot { color: var(--ar-accent); }` in the deck's `<style scoped>`; `items` lists the names in the
deck's script: `[{ icon: 'lucide:gauge' }, …]`.)

**Sets.** `lucide` (UI icons, [lucide.dev](https://lucide.dev)) and `simple-icons` (logos of
technologies and brands, [simpleicons.org](https://simpleicons.org)) come with the library. Any
other Iconify set works once the slides project installs its package,
`npm install -D @iconify-json/<prefix>` (`@iconify-json/mdi`, `@iconify-json/logos`, …: the prefix is
the one in the set's address on icon-sets.iconify.design). A set installed in the project wins over
the library's copy of the same set, so a project can pin another version of Lucide.

**How icons get in.** The Vite plugin reads the project's source (`src/` and the decks folder;
`.vue .pug .js .ts .jsx .tsx .mjs .cjs` files; not the snippets and images folders) for words of the
form `prefix:name` that are icons of an installed set, and builds only those into the app, through
the module `virtual:arao/icons`. A static `name="…"` is found, and so are names written in data
(`{ icon: 'lucide:rocket' }`) and bound with `:name`. During development, a name written in a
saved file shows at once, without a restart; a set installed while the dev server runs is found at
the next save of a file that uses it.
- **Limitation:** a name put together at runtime (`` :name="`lucide:${kind}`" ``, a value from a
  fetch) is not in the source, so it is not built in. Write the full names somewhere in the source
  (a list of them is enough), or force them with the plugin option
  `arao({ icons: ['lucide:sun', 'lucide:moon'] })` ([Vite plugin](#vite-plugin)).
- A word that looks like a name but is no icon (`localhost:5173`, `a:hover`) is ignored; a real
  name in a comment or in text is built in too (it only costs its few hundred bytes).

**Look.** The colour is `currentColor`: the icon takes the colour of the text, and is styled like
text (`color: var(--ar-accent)`). Multicolour sets keep their own colours. It is `1em` tall by
default, so it follows the font size where it sits (in a heading it is as tall as the heading's
text; a class with `font-size` resizes it); `size` sets px. It sits on the text's baseline like a
glyph and never shrinks in a flex row. Width and height are SVG attributes, so a CSS rule with
`width`/`height` wins over them. Classes: `.ar-icon` (the `svg`), `.ar-icon-missing`.

**Missing icon.** A name that is not in the build (its set is not installed, a typo, a name built
at runtime) shows an empty dashed box of the same size, so nothing around it moves, and one warning
per name in development: `[arao] Icon "foo:bar" not found: …`, which says to install
`@iconify-json/foo` or to check the name.

**Licences.** Icons are others' work, under their own licences: check a set's licence on
icon-sets.iconify.design before using it in a talk you publish.
- Lucide: ISC (free to use; nothing to show on the slides).
- Simple Icons: CC0 for the drawings, but the logos are trademarks of their owners. Use them to
  refer to the technology or the brand, not as decoration or to suggest endorsement. Some brands
  are left out at their owner's request (Java: `simple-icons:openjdk` is the closest).
- Some sets require attribution, such as Font Awesome Free (CC BY 4.0): credit them, on a closing
  slide for instance.

---

## Snippet

A code window: macOS-style title bar, Shiki syntax colours, line numbers, per-step highlights.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `file` | String | — | path inside the snippets folder (`src/snippets` by default) |
| `code` | String | — | inline code, instead of `file` (wins if both are given) |
| `lang` | String | from the extension of `file`; plain text with no `file` (inline `code`) | any Shiki language; unknown → plain text. Mapped extensions: `yml`→yaml, `kt`/`kts`→kotlin, `sh`→bash, `md`→markdown, `py`→python, `rb`→ruby, `rs`→rust, `ts`→typescript, `js`→javascript, `h`→c, `hpp`→cpp, `cs`→csharp, `txt`→text, `factories`→properties |
| `name` | String | the last path segment of `file` (`legacy/App.java` → `App.java`); empty with no `file` | the title bar text |
| `highlights` | Object | `{}` | `{ "<lines>[:<word>+++<word>]": <step> }`, see below |
| `line-numbers` | Boolean | `true` | `:line-numbers="false"` hides them |
| `fit` | Boolean | `false` | the window hugs the code instead of the standard frame (small inline snippets) |
| `size` | Number | theme's `--ar-code-size` | font size in px (`:size="36"`); still shrinks to fit |
| `theme` | String | theme's `--ar-code-theme`, else `material-theme-darker` | a Shiki theme name for this snippet |

**Frame and size.** Every snippet window has the slide's shape (`--ar-code-aspect`, 16/9) and is as
large as fits in the space it gets, up to `--ar-code-width` (1520 px): on a slide with a title that
is about 1396 x 785, the same on every full-slide snippet. In a column it keeps the shape, smaller.
Code sits top-left like an editor; `fit` makes the window hug the code instead. The font
is the theme's standard `--ar-code-size` on every slide; a snippet that would not fit at that size
shrinks to fit, never grows.

**Highlights.** Keys are a line spec, optionally followed by `:` and words separated by `+++`;
values are the step at which the rule applies.
- Lines: `"4"`, `"4-7"`, `"1,10-14"` (1-based).
- Words: `"2:implements Filter"`, `"8-10:isDebug+++MDC.put"`: on those lines only those words (every
  occurrence, plain substring match) are highlighted, the rest of the line is dimmed.
- At step `n`, the rules whose value is `n` highlight their lines/words and every other line is
  dimmed. Rules are **not cumulative**: each step shows only its own rules. A step with no rule
  shows the code plain.
- Step 1 always shows the code plain: a rule with value `1` never shows. Start at 2.
- The largest value counts as a step of the slide (`requireSteps`).

Gotchas: a missing file warns and shows `// missing snippet: <file>`. In this pod `monospace`
fonts may render proportional; that is the environment, not the engine.

```pug
Slide(title="A debug filter")
  h2 A debug filter
  Snippet(file="DebugFilter.java" :highlights='{ "2": 2, "8-10:isDebug+++MDC.put": 3 }')

Slide
  h2 Inline code
  Center
    Snippet(code="npm run export -- --deck demo" lang="bash" name="terminal" fit :line-numbers="false")
```

---

## Notes

Speaker notes, anywhere inside a `Slide`. Never drawn on the slide: no room, no step, no title.
The presenter view shows them; `npm run export -- --notes` prints them.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `step` | Number or String | `1` | the note shows from step `n` of the slide on (like `v-step`); the presenter marks notes that start at the step on screen |

Slot: default, any markup (paragraphs, lists, `strong`, `code`), rendered as written.

- Several per slide are fine; they show in the order written (one brought in later by `v-if` goes
  last).
- `v-step` and `useSlide()` do not work inside notes.
- Outside a `Slide` it warns and shows nowhere.

```pug
Slide
  h2 Pricing
  p(v-step="2") Three tiers
  Notes
    p Start with the story of the first customer.
  Notes(step="2")
    p Tiers: say why there are exactly three.
```

---

## Controls

Built into `Deck`; nothing to add. A floating panel at the bottom centre of the audience window.

- **Touch** (phones, tablets): tap the right quarter of the screen → next, the left quarter →
  previous, the middle → show/hide the panel (it stays 4 s); swipe left/right → next/previous.
  Links, buttons and inputs inside a slide keep their taps; add `data-ar-touch="ignore"` to any
  other element that needs them. Pinch-zoom still works. Below 560 px wide the panel drops the
  first/last buttons and the jump menu fits the screen.
- **Shows on mouse movement only**, never on keyboard navigation; hides 2.5 s after the mouse
  stops (stays while hovered or while a menu is open). The cursor hides after `hideCursorAfter`.
- Buttons: first, previous, slide counter (`3 / 18`, click = jump menu), step dots (one per step
  when the slide has more than one; click = go to that step), next, last, theme picker (only with
  more than one theme), presenter view, fullscreen.
- **Jump menu** (`g`, a digit, or the counter): a search box over the slide list; a number
  filters by slide number prefix, text by title (`Slide(title)` or its first heading). `↑`/`↓`,
  `Enter`, `Esc`.
- **Theme picker**: the deck's `themes`, each with a swatch from its tokens.
- Keys (in any window of the deck): see the table below. Ctrl/Cmd/Alt combinations, and keys
  typed into inputs or anywhere in the presenter's duration field (its buttons too), are ignored.
  `Space`/`Enter` on a focused button press the button.
- Letter keys are case-sensitive: only lowercase `g`, `t`, `f`, `p` act. With Caps Lock on, or
  with Shift held, they type `G`, `T`, `F`, `P` and do nothing. Shift does not stop the
  navigation keys: `Shift`+`→` still moves.

| Key | Action |
|---|---|
| `→` `↓` `PageDown` `Space` `Enter` | next step, then next slide |
| `←` `↑` `PageUp` `Backspace` | previous step (to the last step of the previous slide) |
| `Home` / `End` | first slide / last step of the last slide |
| `g` | toggle the jump menu |
| `0`–`9` | open the jump menu pre-filled with that digit |
| `Esc` | close the open panel (jump menu or theme picker) |
| `t` | next theme |
| `f` | fullscreen |
| `p` | open or bring forward the presenter window (not in the presenter itself) |

UI labels are in Spanish.

---

## Presenter view

Opened with `p`, the controls' screen button, or `?presenter` in the deck's URL (`/talk?presenter`). A separate pop-up
window (named per deck: pressing `p` again brings it forward instead of reloading it). If the
browser blocks it, a notice above the controls links to it.

Layout (its own dark look, whatever the deck theme; only the slides wear the theme):
- **Top bar**: slide `n / total` and title; the timer (elapsed, state, remaining) with
  play/pause and reset buttons and the talk's duration (a button); the wall clock.
- **Current slide**, large, with the controls docked under it (always visible).
- **Next**: a live preview of what one more press shows (the next step, or the next slide at step
  1); "Fin de la presentación" at the end.
- **Notes** of the slide on screen, those whose `step` has been reached; the ones starting at
  the current step have an accent bar and are scrolled into view.

Timer:
- Idle until the first move of the deck in any window; then running. Pause/resume and reset
  (back to idle: starts again with the next move).
- With a duration: shows `quedan m:ss`, turns amber when the time left is at most 10 % of the
  duration and at most 5 minutes, red with `m:ss de más` when over.
- Kept in `sessionStorage`: survives reloading the windows, not closing them.

Duration:
- Set in the deck with `Deck(duration="45m")`: the default, and the deck's own value.
- Changed live from the bar, without editing the deck: its duration button (it shows the duration
  in effect, or `duración` when there is none) opens a field that takes the same formats as
  `Deck(duration)` (`90`, `45m`, `1h30`, `45:00`…), from 1 minute to 24 hours. `Enter` applies;
  `Esc`, a click elsewhere or moving the focus out of the field (`Tab` past it) cancels; an
  invalid value, or one out of those bounds, shows an inline error and changes nothing. Works
  without `Deck(duration)` too: it adds a countdown.
- Keyboard: the button is reachable with `Tab` and opens with `Enter`. While the focus is in the
  field (its buttons too), no deck key acts. Closed from inside (`Enter`, `Esc`, going back to the
  deck's value), the focus rests next to the button, not on it: `Space` and `Enter` move the
  slides again at once, and the next `Tab` reaches the button.
- Changed in another window while the field is open: the field takes the new value if nothing was
  typed in it, and keeps the typed text otherwise; a line under it says it changed either way, so
  `Enter` does not overwrite the new value unknowingly.
- A changed duration shows in the accent colour; the field then offers to go back to the deck's
  value (`Volver a la de la presentación: m:ss`, or `Quitar la cuenta atrás` when the deck has
  none). Setting the deck's own value is the same as going back.
- A changed duration wins over the deck until it is reset, even when the deck's `duration` changes
  (an edit of the deck while presenting with the dev server); if the deck's new value equals it,
  the change is dropped, as if it had been reset.
- Shared like the timer: every window of the deck takes it (`useDeck().duration`), and it is kept
  in `sessionStorage` (survives reloading the windows, not closing them). The elapsed time is not
  touched: only the countdown changes.

Gotchas: the presenter window mounts every slide twice (current + preview): side effects in
slides and addons run twice there and element ids repeat. Use `useDeck().role` to skip them.

---

## Export mode

`?export` on a deck's URL (`/talk?export`) renders the deck as a book of pages for printing: no
controls, no keyboard, no transitions, no sync with other windows; `useDeck().role` is `'export'`.

| Parameter | Effect |
|---|---|
| `export` | one page per step of every slide |
| `per-slide` | one page per slide instead, each at its **last** step (everything revealed, last snippet highlight); `v-step.only` content of earlier steps is not on it |
| `per-step` | one page per step: the default, accepted and ignored (`per-step=0` does not make it per slide; only `per-slide` does, and wins if both are given) |
| `notes` | after the page(s) of a slide with notes, a white page with its notes |
| `theme=<name>` | must be one of the deck's `themes`, else an error |

A flag set to `0`, `false`, `no` or `off` counts as unset. Every page is exactly the canvas size.

**CLI**: `arao export [--deck <name>] [--theme <name>] [--per-slide | --per-step] [--notes] [--out <path>] [--url <url>]`,
run in the slides project (its folder is the current directory); with `"export": "arao export"`
in its scripts, `npm run export -- …`. Without `--deck`, **every deck** of the decks folder, one
PDF each, in name order; `--deck <name>` exports that one. Builds the project once with its own
Vite config to a temp folder, serves it with `vite preview` (under the config's `base`), prints
each deck's `/<deck>?export` with one headless Chromium, checks each page count, writes each PDF
atomically. One page per step by default; `--per-slide` gives one per slide (`--per-step` is
accepted, and is an error together with `--per-slide`). Default output
`exports/<deck>[-<theme>][-slides][-notes].pdf` (before 0.4 the default was per slide and
`-steps` marked a per-step file; now `-slides` marks a per-slide one); an `--out` that is a
folder (exists, or ends in `/`) gets that name inside. With several decks `--out` is always a
folder, and a path ending in `.pdf` is an error. Output: one summary line per PDF (`<path>: <n>
pages (<s> slides, <t> steps), <w>x<h> px, theme <name>`) and, with several decks, a total
(`<n> of <m> decks exported, <p> pages[; failed: …]`). A build error stops the run; a deck that
fails once the site is up (it does not render, throws before its pages are ready, crashes its
page, cannot be printed or written) is reported and the others still export; the exit code is 1
if any failed. The decks are the plugin's (the same `*.vue` the app lists: symlinks included,
dotfiles not). Two decks never write the same file in one run: the second fails instead (names
that differ only in case, which also open as one deck and are warned about; or `Alpha` with
`--theme vigojug` and a deck `alpha-vigojug` in its first theme). `--theme` with several decks:
the decks that list it are printed in it, then the others in their first theme (their summary
line says so and their file name has no theme); a theme no deck lists is an error and nothing is
written; with `--deck`, a theme the deck does not list is an error. Chromium:
`npx playwright-core install chromium`, or `ARAO_CHROMIUM=/path/to/chrome`. Missing pictures
print as placeholders and are listed.

- `--url <url>`: no build and no server of its own; prints from the server already running at
  that URL, the site's base (`npm run dev`: `http://127.0.0.1:5173/`; under a base,
  `http://127.0.0.1:5173/talks/`). Each deck opens at `<url><deck>?export…`: the URL's own
  query and hash are dropped, and its path is taken as a folder (`/talks` is `/talks/`). The decks (the `--deck` name, or every
  deck) are still read from the project's decks folder before anything opens, so the server must
  serve the same decks.
- `-h`, `--help`: prints the usage and exits. An unknown option prints the error and the usage,
  and exits with code 1.

**Late content**: the export waits for elements with the attribute `data-ar-busy` inside the slide
(or in addons) before copying each page, up to 15 s. Snippet and Img set it while loading. A
component that loads something may do the same:

```pug
div(:data-ar-busy="loading ? '' : undefined")
```

A named value (Img uses its URL) is given up on once, for all later pages; an empty value is
waited for on every page. When done, `window.__araoReady` is
`{ pages, slides, steps, width, height, missing, stalled, theme }` or `{ error }`; for a theme the
deck does not list, `{ error, code: 'theme-not-listed', themes }`.

Gotcha: pages are static DOM copies: canvas/WebGL drawings, video frames, iframes, shadow DOM and
`url(#id)` references (ids repeat) are not printed faithfully.

**Printing** (Chromium's print path; the deck on screen is untouched). The book works around what
Chromium prints differently from what it shows:

- A page prints in one piece (`contain: size` on `.ar-page`). Otherwise Chromium splits whatever is
  laid out across the bottom edge of a page that has a page after it, clipped or not, and prints the
  part above the break as a box of its own: no bottom border, no rounded bottom corners, percentages
  of its height taken from that part. A ring placed with `top: 50%; transform: translateY(-50%)`
  (its box, before the transform, reaches past the bottom) printed as an arch on every page but the
  last.
- Blurred `box-shadow`s (outer and inset) are drawn on a canvas and painted as the element's
  `border-image`, outset over the shadow: Chromium prints a blurred shadow as a soft mask of the
  graphics state, which macOS Preview and Quick Look ignore, drawing the shadow's whole box as a
  solid square of its colour (pdf.js, PDFium/Chrome and MuPDF draw it right). A picture with
  transparency every reader draws. Same place, transforms, opacity and clipping as the shadow; a
  visible solid border is drawn into the picture too. Left as Chromium prints them: elements with a
  `border-image` of their own, a border that is not `solid` in one colour, a `filter`, and inline or
  table-part boxes.
- Pictures with a `filter` of blur and colour functions (`Img(blur)`, `Slide(bg-blur)` on a picture)
  are drawn with that filter on a canvas, fitted by `object-fit`/`object-position`, and printed
  unfiltered: Chromium blurs only what is inside the clip, so the soft edge of the blur showed inside
  the box (a dark frame around a blurred background). Left as Chromium prints them: pictures from
  another origin without CORS (a canvas cannot read them), `drop-shadow()` and `url()` filters.

Known limitation: a **blurred `text-shadow`** still prints as a soft mask, so macOS Preview and Quick
Look draw a solid box of the shadow's colour behind the text. Use a `text-shadow` without blur, or
`filter: drop-shadow(0 8px 20px …)` on the element instead of the `text-shadow`: Chromium prints a
filtered element as a picture with transparency, which every reader draws (its text is then part of
that picture, not selectable).

---

## useDeck()

For components inside `Deck` (addons, or anything in a slide) to read where the deck is and move
it. Throws outside a `Deck`.

```js
import { useDeck } from 'araojs'
const deck = useDeck()
```

| Field | Type | Meaning |
|---|---|---|
| `index` | readonly ref, Number | current slide, **0-based** |
| `step` | readonly ref, Number | current step of that slide, 1-based |
| `total` | computed, Number | number of slides |
| `steps` | computed, Number | steps of the current slide |
| `progress` | computed, 0..1 | position over every step of the deck |
| `theme` | readonly ref, String | current theme name |
| `themes` | readonly ref, Array of strings | the deck's `themes` |
| `fullscreen` | readonly ref, Boolean | the window is fullscreen (whatever element is: `f` then leaves it) |
| `timer` | readonly ref, Object | the talk's timer: `{ state: 'idle' \| 'running' \| 'paused', acc, since }` (ms counted before `since`, and when it last started running) |
| `duration` | computed, Number or `null` | the talk's length in effect, in ms: the one set in the presenter view, else `Deck(duration)`; `null` when there is none |
| `next()`, `prev()` | functions | move one step |
| `go(i, step = 1)` | function | go to slide `i` (0-based) at `step` (clamped; `Infinity` = last step); out-of-range `i` is ignored |
| `setTheme(name)` | function | wear another of the deck's `themes` (written in the URL, followed by the other windows); any other name warns and is ignored |
| `toggleFullscreen()` | function | enter or leave fullscreen (as `f`) |
| `openPresenter()` | function | open the presenter window, or bring it forward (as `p`) |
| `role` | String (not a ref) | which rendering this is: `'audience'` (the audience window), `'presenter'` (presenter view, current slide), `'preview'` (presenter view, next-step preview), `'export'` (?export), `'thumbnail'` (the deck's cover in the list of decks at `/`: its actions do nothing, as the preview's) |

In the `'preview'` copy the refs read the preview's position and no function does anything
(`next`, `prev`, `go`, `setTheme`, `toggleFullscreen`, `openPresenter`): the preview is a copy, it
cannot act. The object is frozen and its refs read-only, all the way down (`themes.value`,
`timer.value`): change things through the functions. Being frozen, Vue does not make it reactive:
don't put it inside `reactive()` or `data()` (its refs are not unwrapped there); read its refs
directly (`deck.index.value`).

```js
onMounted(() => deck.role === 'audience' && video.value.play())
```

---

## useSlide()

For components inside a `Slide` that change *within* the slide (highlight, count, dim) rather
than just appear. Throws outside a `Slide`.

| Field | Meaning |
|---|---|
| `step` | readonly ref: this slide's current step (1-based; the last step once passed, 1 before reached) |
| `requireSteps(n)` | the slide has at least `n` steps (same as a `v-step="n"`). `n` may be a number, a ref or a getter; changes are followed; released on unmount. Returns a function that releases it early. |

```vue
<template lang="pug">
.counter {{ slide.step.value }} / {{ to }}
</template>

<script setup>
import { useSlide } from 'araojs'
const props = defineProps({ to: { type: Number, default: 3 } })
const slide = useSlide()
slide.requireSteps(() => props.to)
</script>
```

---

## Addons

Components placed inside `Deck` but outside any `Slide`, drawn over every slide in canvas space
(absolute positioning, `z-index: 10`). They are copied onto every export page. They are imported
by the deck (`import { ProgressBar, SlideNumber } from 'araojs'`):

```pug
Deck
  ProgressBar(position="top")
  SlideNumber
```

| Addon | Props | What it draws |
|---|---|---|
| `ProgressBar` | `position`: `"bottom"` (default) or `"top"` | a full-width bar, `--ar-progress-height` tall (8 px), filled with `--ar-accent` by `progress` |
| `SlideNumber` | none | `n / total`, bottom right, 24 px, `--ar-muted`; on the line of the footer band, outside its content (with a footer, `{{ number }} / {{ total }}` in `#footer` puts the number inside it) |

**Writing one**: a component that calls `useDeck()`, positions itself absolutely in canvas px,
uses tokens for colours, and sets `pointer-events: none`. Skip side effects where they do not
belong with `role`.

```vue
<!-- src/decks/mytalk/SlideClock.vue: the wall clock, top right -->
<template lang="pug">
.slide-clock(v-if="deck.role !== 'preview'") {{ time }}
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useDeck } from 'araojs'

const deck = useDeck()
const time = ref('')
let timer
const tick = () => (time.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
onMounted(() => { tick(); timer = setInterval(tick, 10000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<style>
.slide-clock {
  position: absolute; top: 28px; right: 40px; z-index: 10;
  font-size: 24px; color: var(--ar-muted); pointer-events: none;
}
</style>
```

---

## Vite plugin

`arao()` from `araojs/vite` is all a slides project puts in its Vite config. It includes
`@vitejs/plugin-vue` (do not add `vue()` as well: Vite stops with an error) with Pug for the
templates (no need to install `pug`; HTML templates need nothing), and exposes three project folders as virtual modules, so
slides name files and need no imports. It also resolves the [icons](#icon) the source uses.

```js
// vite.config.js
import arao from 'araojs/vite'
export default defineConfig({
  plugins: [arao({ decks: 'src/decks', snippets: 'src/snippets', images: 'src/images' })],
})
```

| Option | Default | Used by | Contents |
|---|---|---|---|
| `decks` | `'src/decks'` | `createDeckApp()`, `arao export` | the `.vue` files directly in it (not in subfolders), one lazily loaded chunk each, each opened at `/<file name>` |
| `snippets` | `'src/snippets'` | `Snippet(file)` | every file, as raw text, loaded lazily |
| `images` | `'src/images'` | `Img(file)`, `Slide(bg)` | `png jpg jpeg gif webp avif svg` (any case), as URLs, eager |
| `icons` | `[]` | `Icon` | names (`'lucide:sun'`) built in even when the source does not spell them out (built at runtime); one that is in no installed set is reported when the module is built |
| `vue` | `{}` | — | options for `@vitejs/plugin-vue`, passed through |

- A folder is relative to the Vite root, or absolute. One outside the root (`../shared/images`)
  works too: it is added to `server.fs.allow` and watched.
- A folder that was set explicitly but does not exist is reported when Vite starts.
- Subfolders are allowed; files are named by their path inside the folder; names are
  case-sensitive.
- Adding or removing a picture during development updates the slides in place.
- Modules: `virtual:arao/decks` exports `decks` (file name → loader) and `decksDir`;
  `virtual:arao/snippets` exports `snippets` (path → loader) and `snippetsDir`;
  `virtual:arao/images` exports `images` (path → URL) and `imagesDir`;
  `virtual:arao/icons` exports `icons` (`prefix:name` → `{ body, width, height }`, only the icons
  the source uses, plus the `icons` option).
- It also keeps `araojs` out of Vite's dependency prebundling (it imports those virtual
  modules), prebundles what it imports (`vue`, `shiki`, `@vueuse/core`), and dedupes `vue`, so a
  linked copy of the library (`npm link`, `file:`) uses the project's Vue.

---

## Theme tokens

A theme is a CSS rule `[data-theme="<name>"] { --ar-…: …; }` in a CSS file imported in
`src/main.js` and listed in `Deck(:themes)`: `import 'araojs/themes/default.css'` for a shipped
one, `src/themes/<name>.css` in the project for your own. Themes set tokens only; layouts read them
(the engine's CSS: each component's styles, and `styles/base.css`). Unset tokens use the default below,
declared in `styles/tokens.css` (or, where it depends on the context, at the rule that reads it). Rows marked
**theme** have no engine fallback: every theme must set them (both shipped themes do).

### Colours and type

| Token | Default (`default` theme / fallback) | Meaning |
|---|---|---|
| `--ar-bg` | `#0f1115` (theme) | slide background colour |
| `--ar-fg` | `#e8e8ea` (theme) | text colour |
| `--ar-muted` | `#9aa0a6` (theme) | secondary text (`.muted`, slide number) |
| `--ar-accent` | `#ff6a3d` (theme) | `h2`, cover bar, section background, progress, highlights |
| `--ar-accent-fg` | `#0f1115` (theme) | text on accent (section slides) |
| `--ar-letterbox` | `#000` | around the canvas when the window shape differs |
| `--ar-font-sans` | `"Inter", system-ui, …` (theme) | text font |
| `--ar-font-mono` | `"JetBrains Mono", ui-monospace, …` (theme) | code font |
| `--ar-text-base` | `40px` | base font size of a slide |
| `--ar-title` | `88px` (theme) | the type scale: `h1` size; `h2` is 0.6x, cover `h1` 1.25x, section `h1` 1.4x (the slide title's own size is `--ar-title-size`) |
| `--ar-text-small` | `.75em` | `.small` |
| `--ar-placeholder` | text colour | colour of the missing-picture box |

### Spacing and shape

| Token | Default | Meaning |
|---|---|---|
| `--ar-pad` | `96px 120px` | slide padding, the safe margin (and the text side of `image-*`); the footer band, when shown, takes the place of its bottom |
| `--ar-radius` | `16px` (theme) | corner radius (`Img rounded`, placeholders) |
| `--ar-gap-sm` / `-md` / `-lg` | `24px` / `48px` / `80px` | `gap="sm\|md\|lg"`; `md` is the default gap of `Cols`/`Rows`/`Grid`; `lg` between zones |
| `--ar-image-inset` | `0` | padding around the picture in an `image-*` zone |

### Background, steps, addons

| Token | Default | Meaning |
|---|---|---|
| `--ar-slide-bg-image` | `none` | default slide background: a gradient, or `url(…)` relative to the theme file |
| `--ar-slide-bg-position` | `center` | its position |
| `--ar-slide-bg-opacity` | `1` | its opacity |
| `--ar-step-duration` | `.35s` | fade time of `v-step` |
| `--ar-progress-height` | `8px` | `ProgressBar` height |

A theme can leave a layout without its default background:
`[data-theme="x"] .layout-section { --ar-slide-bg-image: none; }`.

### Slide zones and content

The title tokens style the slide's title (`.ar-title`: the header's heading, the heading of
`split`'s header and of `image-*`'s text side), not every `h1`/`h2`; cover and section headings
keep `--ar-title`. Without them the title looks as any `h2` (or `h1`) does.

| Token | Default | Meaning |
|---|---|---|
| `--ar-title-size` | an `h2`: 0.6x `--ar-title`; an `h1`: `--ar-title` | the title's font size |
| `--ar-title-color` | an `h2`: `--ar-accent`; an `h1`: the text colour | the title's colour |
| `--ar-title-align` | as the slide's text | `start`, `center`, `end` |
| `--ar-title-gap` | `.6em` under an `h2`, `.4em` under an `h1` | space between the title and the body (em: the title's size; under a header band, give px) |
| `--ar-header-height` | none (as tall as the title) | a header band: the header is at least this tall, the title centred in it, `--ar-title-gap` under the band |
| `--ar-body-align` | `center` | `start`, `center` or `end`: where the body sits, unless `Slide(align)` says (anything else warns and centres) |
| `--ar-list-gap` | `0` | space between list items |
| `--ar-footer-height` | `88px` | the footer band, at the bottom of the slide, in place of the bottom padding |
| `--ar-footer-size` | `24px` | footer text size |
| `--ar-footer-color` | `--ar-muted` (on a section: its text colour) | footer text colour |
| `--ar-footer-align` | `space-between` | how the footer's children spread: `flex-start`, `center`, `flex-end`, `space-between` |

| Token | Default | Meaning |
|---|---|---|
| `--ar-table-pad` | `.4em .8em` | cell padding |
| `--ar-table-border` | `2px solid` the text colour at 15 % | the line under every row (a CSS `border`) |
| `--ar-table-head-bg` | none | header cells' background |
| `--ar-table-head-color` | `--ar-muted` | header cells' text colour |
| `--ar-table-stripe` | none | background of every other body row |

Tokens may be set per layout, or on any element, like every token:

```css
[data-theme="venue"] .layout-default { --ar-title-color: #fff; --ar-title-gap: 120px; } /* content slides */
[data-theme="venue"] .layout-section { --ar-footer-color: #fff; }
```

```pug
table.dense(style="--ar-table-pad: 12px 20px")
```

### Sizes

Rules of thumb for a 1920x1080 canvas (and what the defaults do):

- **Safe margin** ≈ 5 % of each side, for projectors that crop the edges: `--ar-pad` (96 x 120 px).
- **Header** ≈ 12–15 % of the height for the title zone (a band, if any: `--ar-header-height`).
- **Footer** ≈ 5–8 % of the height: the default band is 88 px, in place of the bottom padding,
  with 24 px text.
- **Body text** 36–44 px (`--ar-text-base`: 40 px); nothing under ≈ 28 px except the footer and
  dense code.

### Code (Snippet)

| Token | Default | Meaning |
|---|---|---|
| `--ar-code-theme` | `material-theme-darker` | Shiki theme (`vigojug`: `github-light`) |
| `--ar-code-size` | `44px` | standard code font size |
| `--ar-code-width` | `1520px` | standard window width |
| `--ar-code-aspect` | `16 / 9` | window shape (width / height); the window is as large as fits with this shape |
| `--ar-code-bg` | `#2b2b2b` | window background |
| `--ar-code-bar` | `#383a40` | title bar |
| `--ar-code-fg` | `#eeffff` | text before colours load |
| `--ar-code-muted` | `#8a8f98` | line numbers |
| `--ar-code-title` | `rgba(255,255,255,.92)` | title bar text |
| `--ar-code-hl` | `--ar-accent` | highlight colour |
| `--ar-code-radius` | `22px` | window corner radius |

Set by the engine, read-only: `--ar-scale` (the stage's current scale factor; `1` in export).

```css
/* src/themes/venue.css, then import it in src/main.js and add 'venue' to Deck(:themes) */
[data-theme="venue"] {
  --ar-letterbox: #111; --ar-bg: #fff; --ar-fg: #222; --ar-muted: #777;
  --ar-accent: #0a7; --ar-accent-fg: #fff;
  --ar-font-sans: system-ui, sans-serif; --ar-font-mono: ui-monospace, monospace;
  --ar-title: 88px; --ar-radius: 12px;
  --ar-code-theme: github-light; --ar-code-bg: #f6f8fa; --ar-code-bar: #e6e8eb;
}
```

---

## URLs

A deck is a path; how it shows is the query; where it stands is the hash:
`/framework?presenter#/12/3`.

| Part | Example | Effect |
|---|---|---|
| path | `/framework` | the deck file in the decks folder (`src/decks/Framework.vue`; case-insensitive), the first path segment after the app's base. `/` (the base) → the list of decks, or the project's only deck (`createDeckApp`'s `deckList`); a name that is no deck → the list, with a notice and a console warning. The list's links keep the page's query (`theme`, `presenter`, `export`…) |
| `theme` | `?theme=vigojug` | the theme; also keeps this window's theme when it joins other windows |
| `presenter` | `?presenter` | the presenter view |
| `export` | `?export` | export mode (wins over `presenter`); `export=0\|false\|no\|off` = off |
| `per-slide` | `?export&per-slide` | export: one page per slide, each at its last step (default: one per step) |
| `per-step` | `?export&per-step` | export: one page per step (the default) |
| `notes` | `?export&notes` | export: notes pages |
| hash | `#/12/3` | slide 12, step 3 (1-based); kept up to date while presenting |

- The address bar always shows a deck's path in one form, without reloading: `/Framework/` and
  `/framework/anything` become `/framework`, the query and the hash kept. Every window of a deck
  (audience, presenter) then has the same path, which is what keeps them in step (and keeps two
  decks apart).
- `?deck=framework`, the URL of Arao before 0.4, still opens the deck: the address bar turns it
  into `/framework`, keeping the rest of the query and the hash (`/?deck=framework&theme=x#/3` →
  `/framework?theme=x#/3`).
- Under a base (Vite's `base: '/talks/'`) every path is under it: `/talks/` is the list,
  `/talks/framework` the deck. With a relative base (`base: './'`) the base is the page's folder,
  so the deck must be the last segment of the path (`…/framework`, no trailing slash).
- `index.html` as the first segment is the base itself (the list).

## Hosting

A deck's path is the app's own page under another URL: whatever serves the site must answer
`/framework` with `index.html`.

- `npm run dev` and `vite preview` do (Vite's SPA fallback), under any `base`.
- `vite build` writes `dist/404.html`, a copy of `dist/index.html` (from the `arao()` plugin):
  GitHub Pages, and every static host that serves `404.html` for a path it has no file for,
  answer a deck's path with the app, which opens the deck (with HTTP status 404, which browsers
  ignore and crawlers do not). A `404.html` of the project's own in `public/` is kept instead.
- Elsewhere, have the server fall back to `index.html` (nginx: `try_files $uri $uri/ /index.html;`;
  Netlify: `/* /index.html 200` in `_redirects`).
- Under a sub-path, build with that `base` (GitHub Pages of `user/talks`: `base: '/talks/'`).
- A deck cannot be named like a file or folder at the site's root (`assets`, a file of
  `public/`): the server answers that path with the file.
