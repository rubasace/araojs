# Components

Every component a deck writes: their props, slots and rules. Sizes are canvas px (the canvas is
1920x1080 unless `Deck` says otherwise). Examples are Pug, the recommended form; the same props,
slots and directives work in an HTML template ([Pug or HTML](../guide/concepts.md#pug-or-html)).

Globally registered: `Deck`, `Slide`, `Img`, `Icon`, `Snippet`, `Notes`, `Cols`, `Rows`, `Grid`,
`Center`, and the directives `v-step` and `v-step-from` ([Directives](directives.md)). Imported
by hand from `'araojs'`: the [addons](#addons) (`ProgressBar`, `SlideNumber`) and the
[composables](composables.md) (`useDeck`, `useSlide`).

Contents: [Deck](#deck) · [Slide](#slide) · [Cols, Rows, Grid, Center](#cols-rows-grid-center) ·
[Utility classes](#utility-classes) · [Img](#img) · [Icon](../guide/icons.md) · [Snippet](#snippet) ·
[Notes](#notes) · [Addons](#addons)

## Deck

The root of a deck: the canvas, the slides, the controls, the keyboard, the URL, the presenter
view and export mode. One per deck file (`src/decks/<Name>.vue`).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `themes` | Array of strings | every theme there is: `default`, then the project's in alphabetical order | the themes this deck can wear, in this order; the first is the one it opens in. Each is `default` (the defaults), the name of a project theme (a `[data-theme="<name>"]` rule in a CSS file of `src/themes`), or the name of a theme the project imports itself from anywhere else, whose rule is in a stylesheet the page has loaded ([Themes](../guide/themes.md)); any other name warns once (`[arao]`) and is skipped (a list left empty is `['default']`). |
| `duration` | String or Number | none | the talk's length, for the presenter's countdown. `90` / `"90"` / `"7.5"` (minutes), `"45m"`, `"45min"`, `"1h30m"`, `"1h 30m"`, `"1h30"`, `"90s"`, `"45:00"` (m:ss), `"1:30:00"` (h:mm:ss). Anything else warns and shows no countdown; a length under 1 minute or over 24 hours warns and still counts. It is the default: the presenter can change it live, without editing the deck, and that change wins until it is reset ([Presenter view](../guide/presenting.md#presenter-view)). |
| `width` | Number | `1920` | canvas width in px |
| `height` | Number | `1080` | canvas height in px |
| `hideCursorAfter` | Number (ms) | `5000` | hide the mouse cursor after this long without movement; `0` never hides it |

Slots:
- default: the slides and the addons, in any order. Slide order is the order in the template
  (document order), even for slides mounted later by `v-if` or moved by a keyed `v-for`.
- `#footer`: the deck's footer, drawn at the bottom of every slide except `cover` and `section`
  ([Zones](../guide/slides-and-layouts.md#zones-header-body-footer)). Slot props: `{ number, total }`, the slide's number
  (1-based) and the number of slides. Real DOM in the theme's fonts, so it prints as text and shows
  in the presenter view; each slide draws its own copy, which fades with it.

```pug
Deck
  template(#footer="{ number, total }")
    span ACME · DevConf 2026
    span {{ number }} / {{ total }}
  Slide
    h2 Hello
```

Behaviour:
- The hash `#/<slide>/<step>` (both 1-based) is kept up to date and read on load and on change.
- `?theme=<name>` picks the theme; `t` or the picker cycles through `themes`. A name that is not
  in `themes` is applied anyway in the normal view (no theme rule matches it: the slides wear the
  defaults) and is an error in export mode.
- All windows of the same deck in the same browser stay in step (position, theme, timer, the
  duration set in the presenter view) through a `BroadcastChannel` keyed by the deck's path and
  the page's query, ignoring `presenter` and `theme`. The deck's path is the one the list links
  to (`/<name>`), even where the deck opens at `/` (a project with one deck); with an app shell
  of your own, the page's path. A new window takes the position and theme of those
  already open, unless its URL names a theme.

```pug
Deck(:themes="['default', 'acme']" duration="45m")
  ProgressBar
  SlideNumber
  Slide
    h1 Hello
```

## Slide

One slide, inside its padding (`--ar-pad`). A content slide has three zones, top to bottom: the
header (its title), the body (everything else) and the deck's footer
([Zones](../guide/slides-and-layouts.md#zones-header-body-footer)).

| Prop | Type | Default | Accepted values |
|---|---|---|---|
| `layout` | String | `default` | `default`, `cover`, `section`, `split`, `image-left`, `image-right`, `two-cols`; any other value adds the class `layout-<value>` (for a theme to style) and works as `default` |
| `title` | String | first `h1`/`h2`/`h3` of the slide (outside the background and the footer) | name in the jump menu, the presenter bar and the notes pages |
| `align` | String | the theme's `--ar-body-align` (`center` by default) | `start`, `center`, `end`: where the body sits vertically (`default` layout) |
| `footer` | Boolean | shown, except on `cover` and `section` | `:footer="false"` hides the deck's footer on this slide; `:footer="true"` shows it on a `cover` or `section` |
| `ratio` | String | `"1 1"` | zone widths for `split`, `image-left`, `image-right`, left to right. Exactly two entries; each a positive number (a share), `auto`, or `<n>px`. Shares are proportions: `"2 1"` = `"66 33"`. Invalid → warning, `"1 1"`. |
| `bg` | String | none | background: a URL, an images-folder file, or a CSS colour/gradient ([Backgrounds](../guide/images-and-backgrounds.md#backgrounds)) |
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
  `--ar-accent`; `p` has a bottom margin of 0.6em; lists and tables: [Lists and tables](../guide/slides-and-layouts.md#lists-and-tables).

How the zones, lists and tables of a slide work: [Slides and layouts](../guide/slides-and-layouts.md);
backgrounds: [Images and backgrounds](../guide/images-and-backgrounds.md#backgrounds).

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
- Their classes (`ar-cols`, `ar-rows`, `ar-grid`, `ar-center`) are hooks for a theme to
  override, not utility classes to write in a deck: the props do the layout.

Examples: [Composition](../guide/composition.md).

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

How it sizes itself, missing files, picture sizes: [Images and backgrounds](../guide/images-and-backgrounds.md#pictures-img).

## Icon

An icon of an [Iconify](https://icon-sets.iconify.design/) set, drawn inline as SVG. Icons are
resolved when the project is built or served: nothing is fetched when presenting, and they are
vectors in the PDF.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | String | — (required) | `prefix:name`: `lucide:rocket`, `simple-icons:vuedotjs` |
| `size` | Number or String | `1em` tall | px, the icon's height: `size="64"` (plain is fine) or `:size="64"`. The width follows the icon's shape (square for Lucide and Simple Icons) |
| `label` | String | — | what the icon says: `role="img"` and `aria-label`; without it the icon is decorative (`aria-hidden`) |

Sets, how icons get into the build, their look, missing icons and licences: [Icons](../guide/icons.md).

## Snippet

A code window: macOS-style title bar, Shiki syntax colours, line numbers, per-step highlights.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `file` | String | — | path inside the snippets folder (`src/snippets` by default) |
| `code` | String | — | inline code, instead of `file` (wins if both are given) |
| `lang` | String | from the extension of `file`; plain text with no `file` (inline `code`) | any Shiki language; unknown → plain text. Mapped extensions: `yml`→yaml, `kt`/`kts`→kotlin, `sh`→bash, `md`→markdown, `py`→python, `rb`→ruby, `rs`→rust, `ts`→typescript, `js`→javascript, `h`→c, `hpp`→cpp, `cs`→csharp, `txt`→text, `factories`→properties |
| `name` | String | the last path segment of `file` (`legacy/App.java` → `App.java`); empty with no `file` | the title bar text |
| `highlights` | Object | `{}` | `{ "<lines>[:<word>+++<word>]": <step> }` ([Highlights](../guide/code.md)) |
| `line-numbers` | Boolean | `true` | `:line-numbers="false"` hides them |
| `fit` | Boolean | `false` | the window hugs the code instead of the standard frame (small inline snippets) |
| `size` | Number | theme's `--ar-code-size` | font size in px (`:size="36"`); still shrinks to fit |
| `theme` | String | theme's `--ar-code-theme` (`github-light` by default) | a Shiki theme name for this snippet |

Frame, size and highlights: [Code](../guide/code.md).

## Notes

Speaker notes, anywhere inside a `Slide`: one per slide. Never drawn on the slide: no room, no
step, no title. The presenter view shows them in its notes panel; `npm run export -- --notes`
prints them. No props.

Slot: default, anything a slide holds (paragraphs, lists, tables, `Icon`, `Snippet`, your own
components). Sizes inside are canvas px: the panel draws the notes 1000 px wide, scaled to fit
it, with its own text size.

- **Steps**: `v-step`, `.only`, `.collapse` and `v-step-from` work inside, on the slide's step
  numbers. They follow the slide's steps but add none (nor does a `Snippet`'s highlights or
  `useSlide().requireSteps` there): the audience counts the same steps as the presenter. A note at
  a step the slide does not reach never shows.
- The presenter panel marks what the step on screen has just brought into the notes and scrolls
  to it. The export's notes pages print every step of the notes, each labelled ("From step 2",
  "At step 3" for `.only`, in [the interface language](../guide/presenting.md#interface-language)).
- Several `Notes` in one slide follow one another in the order written.
- Outside a `Slide` it warns and shows nowhere.

```pug
Slide
  h2 Pricing
  p(v-step="2") Three tiers
  Notes
    p Start with the story of the first customer.
    p(v-step="2") Tiers: say why there are exactly three.
```

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

Writing one of your own: [Extending](../guide/extending.md#writing-an-addon).
