# Phoenyx reference

Everything a deck can use, as the code on `v2-engine` implements it. Sizes are canvas px (the
canvas is 1920x1080 unless `Deck` says otherwise). Examples are Pug, inside a deck's
`<template lang="pug">`.

Globally registered: `Deck`, `Slide`, `Img`, `Snippet`, `Notes`, `Cols`, `Rows`, `Grid`,
`Center`, and the directive `v-step`. Imported by hand: the addons (`src/addons/*.vue`) and the
composables (`useDeck`, `useSlide` from `src/engine`).

Pug reminders: a plain attribute is a string (`gap="sm"`); a `:`-bound one is a JavaScript
expression (`:themes="['default']"`, `:size="36"`, `:line-numbers="false"`). Object props are
written as JSON in single quotes: `:highlights='{ "2-3": 2 }'`.

Contents: [Deck](#deck) · [Slide](#slide) · [v-step](#v-step) ·
[Cols, Rows, Grid, Center](#cols-rows-grid-center) · [Utility classes](#utility-classes) ·
[Img](#img) · [Snippet](#snippet) · [Notes](#notes) · [Controls](#controls) ·
[Presenter view](#presenter-view) · [Export mode](#export-mode) · [useDeck()](#usedeck) ·
[useSlide()](#useslide) · [Addons](#addons) · [Vite plugin](#vite-plugin) ·
[Theme tokens](#theme-tokens) · [URL parameters](#url-parameters)

---

## Deck

The root of a deck: the canvas, the slides, the controls, the keyboard, the URL, the presenter
view and export mode. One per deck file (`src/decks/<Name>.vue`).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `themes` | Array of strings | `['default']` | the themes this deck can wear; the first is the default. Each must exist as a `[data-theme="<name>"]` token block imported in `src/main.js`. |
| `duration` | String or Number | none | the talk's length, for the presenter's countdown. `90` / `"90"` / `"7.5"` (minutes), `"45m"`, `"45min"`, `"1h30m"`, `"1h 30m"`, `"1h30"`, `"90s"`, `"45:00"` (m:ss), `"1:30:00"` (h:mm:ss). Anything else warns and shows no countdown. |
| `width` | Number | `1920` | canvas width in px |
| `height` | Number | `1080` | canvas height in px |
| `hideCursorAfter` | Number (ms) | `5000` | hide the mouse cursor after this long without movement; `0` never hides it |

Slots: the default slot holds the slides and the addons, in any order. Slide order is the order
in the template (document order), even for slides mounted later by `v-if` or moved by a keyed
`v-for`.

Behaviour:
- The hash `#/<slide>/<step>` (both 1-based) is kept up to date and read on load and on change.
- `?theme=<name>` picks the theme; `t` or the picker cycles through `themes`. A name that is not
  in `themes` is applied anyway in the normal view (no tokens match: the slides look unstyled) and
  is an error in export mode.
- All windows of the same deck in the same browser stay in step (position, theme, timer) through a
  `BroadcastChannel` keyed by the page path and query, ignoring `presenter` and `theme`. A new
  window takes the position and theme of those already open, unless its URL names a theme.

```pug
Deck(:themes="['default', 'vigojug']" duration="45m")
  ProgressBar
  SlideNumber
  Slide
    h1 Hello
```

---

## Slide

One slide. Content flows top to bottom in a padded column (`--ph-pad`).

| Prop | Type | Default | Accepted values |
|---|---|---|---|
| `layout` | String | `default` | `default`, `cover`, `section`, `split`, `image-left`, `image-right`, `two-cols`; any other value only adds the class `layout-<value>` (for a theme to style) |
| `title` | String | first `h1`/`h2`/`h3` of the slide (outside the background) | name in the jump menu, the presenter bar and the notes pages |
| `ratio` | String | `"1 1"` | zone widths for `split`, `image-left`, `image-right`, left to right. Exactly two entries; each a positive number (a share), `auto`, or `<n>px`. Shares are proportions: `"2 1"` = `"66 33"`. Invalid → warning, `"1 1"`. |
| `bg` | String | none | background: a URL, an images-folder file, or a CSS colour/gradient (see below) |
| `bg-opacity` | Number or String | `1` | `0`..`1`: the picture's opacity over the slide colour |
| `bg-position` | String | `center` | CSS `object-position` / `background-position`, e.g. `"center 30%"` |
| `bg-blur` | Number or String | `0` | blur radius in px (`4` or `"4px"`) |
| `bg-fit` | String | `cover` | `cover` or `contain` |

### Layouts

| Layout | What it does | Slots |
|---|---|---|
| `default` | padded column | `#title` (optional), default |
| `cover` | content centred vertically; `h1` at 1.25x `--ph-title`; a `.bar` element draws a short accent bar | default |
| `section` | everything centred, slide filled with `--ph-accent`, text `--ph-accent-fg`; `h1` at 1.4x `--ph-title` | default |
| `split` | a header (the default slot: the heading, maybe a lead line) above two zones side by side | `#title`, default (header), `#left`, `#right` |
| `image-left` / `image-right` | the `#image` zone fills its half edge to edge (no padding, inset `--ph-image-inset`); the default slot is the text side, padded like a slide | `#image`, `#title`, default (text side) |
| `two-cols` | legacy: a child with class `.cols` becomes a two-column grid. Prefer `split` or `Cols`. | default |

All slots receive `{ step }` (the slide's current step) as slot props.

- `#title` always renders first; in `image-*` it tops the text column, never the image.
- A zone keeps its width: wider content is clipped at the zone's edge. Heights do not clip.
- `ratio` in `image-*` sizes the zones left to right, whichever side holds the image:
  `image-right` with `ratio="3 2"` is text 3/5, image 2/5.
- Content styles from `layouts.css`: `h1` is `--ph-title`; `h2` is 0.6x `--ph-title` in
  `--ph-accent`; `p` has a bottom margin of 0.6em.

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
background shows (`--ph-slide-bg-*`), and the `bg-*` props tune it. Headings inside the
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
`.veil { background: color-mix(in srgb, var(--ph-bg) 70%, transparent); }`.)

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
- Fade duration: `--ph-step-duration` (default `.35s`).
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
| `Grid` | `cols`, `gap` | `cols="3"`, equal cells filled row by row, `gap="md"` |
| `Center` | none | content centred both ways, text centred too |

- `ratio` (String): one entry per track, separated by spaces or commas. Each entry is a positive
  number (a share of the free space; shares are proportions, `"1 2"` = `"33 67"`), `auto` (fits its
  content) or `<n>px`. No other units, no `fr`, no CSS functions. Invalid → warning, equal tracks.
  Children beyond the entries start a new row (`Cols`) or get equal rows (`Rows`).
- `gap` (String or Number): `sm` | `md` | `lg` (tokens `--ph-gap-sm|md|lg`: 24/48/80 px), a number
  of px (`12`), or a length in `px`, `em`, `rem` (`"1.5em"`). Invalid → warning, `md`.
- `align` (`Cols` only): `start` | `center` | `end` | `stretch`, vertical placement in each column.
- `cols` (`Grid` only): a whole number ≥ 1.
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
| `.muted` | colour `--ph-muted` |
| `.center` | `text-align: center` |
| `.upper` | uppercase |
| `.small` | font size `--ph-text-small` (default `.75em`) |

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
| `rounded` | Boolean, String or Number | `false` | `rounded` = the theme's `--ph-radius`; `rounded="full"` = circle; `rounded="24"` = px; or a CSS length |

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
| `size` | Number | theme's `--ph-code-size` | font size in px (`:size="36"`); still shrinks to fit |
| `theme` | String | theme's `--ph-code-theme`, else `material-theme-darker` | a Shiki theme name for this snippet |

**Frame and size.** Every snippet window has the same size and place (`--ph-code-width` 1520 x
`--ph-code-height` 760 px, capped by the space available), code top-left like an editor. The font
is the theme's standard `--ph-code-size` on every slide; a snippet that would not fit at that size
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
  Links, buttons and inputs inside a slide keep their taps; add `data-ph-touch="ignore"` to any
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
  typed into inputs, are ignored. `Space`/`Enter` on a focused button press the button.
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

Opened with `p`, the controls' screen button, or `&presenter` in the URL. A separate pop-up
window (named per deck: pressing `p` again brings it forward instead of reloading it). If the
browser blocks it, a notice above the controls links to it.

Layout (its own dark look, whatever the deck theme; only the slides wear the theme):
- **Top bar**: slide `n / total` and title; the timer (elapsed, state, remaining) with
  play/pause and reset buttons; the wall clock.
- **Current slide**, large, with the controls docked under it (always visible).
- **Next**: a live preview of what one more press shows (the next step, or the next slide at step
  1); "Fin de la presentación" at the end.
- **Notes** of the slide on screen, those whose `step` has been reached; the ones starting at
  the current step have an accent bar and are scrolled into view.

Timer:
- Idle until the first move of the deck in any window; then running. Pause/resume and reset
  (back to idle: starts again with the next move).
- With `Deck(duration)`: shows `quedan m:ss`, turns amber when the time left is at most 10 % of the
  duration and at most 5 minutes, red with `m:ss de más` when over.
- Kept in `sessionStorage`: survives reloading the windows, not closing them.

Gotchas: the presenter window mounts every slide twice (current + preview): side effects in
slides and addons run twice there and element ids repeat. Use `useDeck().role` to skip them.

---

## Export mode

`?export` renders the deck as a book of pages for printing: no controls, no keyboard, no
transitions, no sync with other windows; `useDeck().role` is `'export'`.

| Parameter | Effect |
|---|---|
| `export` | one page per slide, each at its **last** step (everything revealed, last snippet highlight); `v-step.only` content of earlier steps is not on it |
| `per-step` | one page per step of every slide |
| `notes` | after the page(s) of a slide with notes, a white page with its notes |
| `theme=<name>` | must be one of the deck's `themes`, else an error |

A flag set to `0`, `false`, `no` or `off` counts as unset. Every page is exactly the canvas size.

**CLI**: `npm run export -- [--deck <name>] [--theme <name>] [--per-step] [--notes] [--out <path>] [--url <url>]`.
Builds the site to a temp folder, serves it, prints `?export` with headless Chromium, checks the
page count, writes atomically. Default output `exports/<deck>[-<theme>][-steps][-notes].pdf`; an
`--out` that is a folder (exists, or ends in `/`) gets that name inside. Chromium:
`npx playwright-core install chromium`, or `PHOENYX_CHROMIUM=/path/to/chrome`. Missing pictures
print as placeholders and are listed.

- `--url <url>`: no build and no server of its own; prints from the server already running at
  that URL (`npm run dev`: `http://127.0.0.1:5173/`). The export query (`?deck=…&export…`)
  replaces the URL's own query and hash; its path is kept. The `--deck` name is still checked
  against this checkout's `src/decks` before anything opens, so the server must serve the same
  decks.
- `-h`, `--help`: prints the usage and exits. An unknown option prints the error and the usage,
  and exits with code 1.

**Late content**: the export waits for elements with the attribute `data-ph-busy` inside the slide
(or in addons) before copying each page, up to 15 s. Snippet and Img set it while loading. A
component that loads something may do the same:

```pug
div(:data-ph-busy="loading ? '' : undefined")
```

A named value (Img uses its URL) is given up on once, for all later pages; an empty value is
waited for on every page. When done, `window.__phoenyxReady` is
`{ pages, slides, steps, width, height, missing, stalled, theme }` or `{ error }`.

Gotcha: pages are static DOM copies: canvas/WebGL drawings, video frames, iframes, shadow DOM and
`url(#id)` references (ids repeat) are not printed faithfully.

---

## useDeck()

For components inside `Deck` (addons, or anything in a slide) to read where the deck is and move
it. Throws outside a `Deck`.

```js
import { useDeck } from '../engine' // path relative to your component
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
| `next()`, `prev()` | functions | move one step |
| `go(i, step = 1)` | function | go to slide `i` (0-based) at `step` (clamped; `Infinity` = last step); out-of-range `i` is ignored |
| `role` | String (not a ref) | which rendering this is: `'audience'` (the audience window), `'presenter'` (presenter view, current slide), `'preview'` (presenter view, next-step preview), `'export'` (?export) |

In the `'preview'` copy, `next`/`prev`/`go` do nothing and the refs read the preview's position.

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
import { useSlide } from '../../engine'
const props = defineProps({ to: { type: Number, default: 3 } })
const slide = useSlide()
slide.requireSteps(() => props.to)
</script>
```

---

## Addons

Components placed inside `Deck` but outside any `Slide`, drawn over every slide in canvas space
(absolute positioning, `z-index: 10`). They are copied onto every export page. They are imported
by the deck:

```pug
Deck
  ProgressBar(position="top")
  SlideNumber
```

| Addon | Props | What it draws |
|---|---|---|
| `ProgressBar` (`src/addons/ProgressBar.vue`) | `position`: `"bottom"` (default) or `"top"` | a full-width bar, `--ph-progress-height` tall (8 px), filled with `--ph-accent` by `progress` |
| `SlideNumber` (`src/addons/SlideNumber.vue`) | none | `n / total`, bottom right, 24 px, `--ph-muted` |

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
import { useDeck } from '../../engine'

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
  font-size: 24px; color: var(--ph-muted); pointer-events: none;
}
</style>
```

---

## Vite plugin

`phoenyx/vite.js` exposes two project folders as virtual modules, so slides name files and need
no imports.

```js
// vite.config.js
import phoenyx from './phoenyx/vite.js'
export default defineConfig({
  plugins: [vue(), phoenyx({ snippets: 'src/snippets', images: 'src/images' })],
})
```

| Option | Default | Used by | Contents |
|---|---|---|---|
| `snippets` | `'src/snippets'` | `Snippet(file)` | every file, as raw text, loaded lazily |
| `images` | `'src/images'` | `Img(file)`, `Slide(bg)` | `png jpg jpeg gif webp avif svg` (any case), as URLs, eager |

- A folder is relative to the Vite root, or absolute. One outside the root (`../shared/images`)
  works too: it is added to `server.fs.allow` and watched.
- A folder that was set explicitly but does not exist is reported when Vite starts.
- Subfolders are allowed; files are named by their path inside the folder; names are
  case-sensitive.
- Adding or removing a picture during development updates the slides in place.
- Modules: `virtual:phoenyx/snippets` exports `snippets` (path → loader) and `snippetsDir`;
  `virtual:phoenyx/images` exports `images` (path → URL) and `imagesDir`.

---

## Theme tokens

A theme is a CSS rule `[data-theme="<name>"] { --ph-…: …; }` in `src/themes/<name>.css`,
imported in `src/main.js` and listed in `Deck(:themes)`. Themes set tokens only; layouts read them
(`layouts.css`, `engine.css`, component styles). Unset tokens use the fallback below. Rows marked
**theme** have no engine fallback: every theme must set them (both shipped themes do).

### Colours and type

| Token | Default (`default` theme / fallback) | Meaning |
|---|---|---|
| `--ph-bg` | `#0f1115` (theme) | slide background colour |
| `--ph-fg` | `#e8e8ea` (theme) | text colour |
| `--ph-muted` | `#9aa0a6` (theme) | secondary text (`.muted`, slide number) |
| `--ph-accent` | `#ff6a3d` (theme) | `h2`, cover bar, section background, progress, highlights |
| `--ph-accent-fg` | `#0f1115` (theme) | text on accent (section slides) |
| `--ph-letterbox` | `#000` | around the canvas when the window shape differs |
| `--ph-font-sans` | `"Inter", system-ui, …` (theme) | text font |
| `--ph-font-mono` | `"JetBrains Mono", ui-monospace, …` (theme) | code font |
| `--ph-text-base` | `40px` | base font size of a slide |
| `--ph-title` | `88px` (theme) | `h1` size; `h2` is 0.6x, cover `h1` 1.25x, section `h1` 1.4x |
| `--ph-text-small` | `.75em` | `.small` |
| `--ph-placeholder` | text colour | colour of the missing-picture box |

### Spacing and shape

| Token | Default | Meaning |
|---|---|---|
| `--ph-pad` | `96px 120px` | slide padding (and the text side of `image-*`) |
| `--ph-radius` | `16px` (theme) | corner radius (`Img rounded`, placeholders) |
| `--ph-gap-sm` / `-md` / `-lg` | `24px` / `48px` / `80px` | `gap="sm\|md\|lg"`; `md` is the default gap of `Cols`/`Rows`/`Grid`; `lg` between zones |
| `--ph-image-inset` | `0` | padding around the picture in an `image-*` zone |

### Background, steps, addons

| Token | Default | Meaning |
|---|---|---|
| `--ph-slide-bg-image` | `none` | default slide background: a gradient, or `url(…)` relative to the theme file |
| `--ph-slide-bg-position` | `center` | its position |
| `--ph-slide-bg-opacity` | `1` | its opacity |
| `--ph-step-duration` | `.35s` | fade time of `v-step` |
| `--ph-progress-height` | `8px` | `ProgressBar` height |

A theme can leave a layout without its default background:
`[data-theme="x"] .layout-section { --ph-slide-bg-image: none; }`.

### Code (Snippet)

| Token | Default | Meaning |
|---|---|---|
| `--ph-code-theme` | `material-theme-darker` | Shiki theme (`vigojug`: `github-light`) |
| `--ph-code-size` | `44px` | standard code font size |
| `--ph-code-width` | `1520px` | standard window width |
| `--ph-code-height` | `760px` | standard window height |
| `--ph-code-bg` | `#2b2b2b` | window background |
| `--ph-code-bar` | `#383a40` | title bar |
| `--ph-code-fg` | `#eeffff` | text before colours load |
| `--ph-code-muted` | `#8a8f98` | line numbers |
| `--ph-code-title` | `rgba(255,255,255,.92)` | title bar text |
| `--ph-code-hl` | `--ph-accent` | highlight colour |
| `--ph-code-radius` | `22px` | window corner radius |

Set by the engine, read-only: `--ph-scale` (the stage's current scale factor; `1` in export).

```css
/* src/themes/venue.css, then import it in src/main.js and add 'venue' to Deck(:themes) */
[data-theme="venue"] {
  --ph-letterbox: #111; --ph-bg: #fff; --ph-fg: #222; --ph-muted: #777;
  --ph-accent: #0a7; --ph-accent-fg: #fff;
  --ph-font-sans: system-ui, sans-serif; --ph-font-mono: ui-monospace, monospace;
  --ph-title: 88px; --ph-radius: 12px;
  --ph-code-theme: github-light; --ph-code-bg: #f6f8fa; --ph-code-bar: #e6e8eb;
}
```

---

## URL parameters

| Parameter | Example | Effect |
|---|---|---|
| `deck` | `?deck=framework` | the deck file in `src/decks` (case-insensitive); unknown → Demo, silently |
| `theme` | `&theme=vigojug` | the theme; also keeps this window's theme when it joins other windows |
| `presenter` | `&presenter` | the presenter view |
| `export` | `&export` | export mode (wins over `presenter`); `export=0\|false\|no\|off` = off |
| `per-step` | `&export&per-step` | export: one page per step |
| `notes` | `&export&notes` | export: notes pages |
| hash | `#/12/3` | slide 12, step 3 (1-based); kept up to date while presenting |
