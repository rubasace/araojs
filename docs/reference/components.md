# Components

Every component a deck writes: their props, slots and rules. Sizes are canvas px (the canvas is
1920x1080 unless `Deck` says otherwise). Examples are Pug, the recommended form; the same props,
slots and directives work in an HTML template ([Pug or HTML](../guide/concepts.md#pug-or-html)).

Globally registered: `Deck`, `Slide`, `Background`, `Img`, `Icon`, `Snippet`, `Notes`, `Cols`,
`Rows`, `Grid`, `Center`, and the directives `v-step` and `v-step-from` ([Directives](directives.md)). Imported
by hand from `'araojs'`: the [addons](#addons) (`ProgressBar`, `SlideNumber`) and the
[composables](composables.md) (`useDeck`, `useSlide`).

**In TypeScript.** The package's types declare these global components and directives for Vue
(`GlobalComponents`, `GlobalDirectives`), so `vue-tsc` and the editor check their props in any
template of a project that imports `'araojs'`. That declaration claims the names: a project that
also declares a global component of its own under one of them (its own global `Icon`, say) gets
`TS2717: Subsequent property declarations must have the same type`. Give yours another name
(`AppIcon`), or import it where it is used instead of registering it globally.

Contents: [Deck](#deck) · [Slide](#slide) · [Background](#background) · [Cols, Rows, Grid, Center](#cols-rows-grid-center) ·
[Utility classes](#utility-classes) · [Img](#img) · [Icon](../guide/icons.md) · [Snippet](#snippet) ·
[Notes](#notes) · [Addons](#addons)

## Deck

The root of a deck: the canvas, the slides, the controls, the keyboard, the URL, the presenter
view and export mode. One per deck file (`src/decks/<Name>.vue`).

| Prop | Type | Default | Notes |
|---|---|---|---|
| `themes` | Array of strings | every theme there is: `default`, then the project's theme sources' themes, source by source, then the [built-in ones](../guide/built-in-themes.md), alphabetical within each | the themes this deck can wear, in this order; the first is the one it opens in. Each is the name of a theme a theme source gives: `default` (the defaults) or another [built-in theme](../guide/built-in-themes.md), or a `[data-theme="<name>"]` rule in a CSS file of `src/themes` or of another folder or package in the plugin's `themes` option ([Themes](../guide/themes.md)); any other name warns once (`[arao]`) and is skipped (a list left empty is `['default']`). |
| `duration` | String or Number | none | the talk's length, for the presenter's countdown. `90` / `"90"` / `"7.5"` (minutes), `"45m"`, `"45min"`, `"1h30m"`, `"1h 30m"`, `"1h30"`, `"90s"`, `"45:00"` (m:ss), `"1:30:00"` (h:mm:ss). Anything else warns and shows no countdown; a length under 1 minute or over 24 hours warns and still counts. It is the default: the presenter can change it live, without editing the deck, and that change wins until it is reset ([Presenter view](../guide/presenting.md#presenter-view)). |
| `width` | Number | `1920` | canvas width in px |
| `height` | Number | `1080` | canvas height in px |
| `hideCursorAfter` | Number (ms) | `5000` | hide the mouse cursor after this long without movement; `0` never hides it |

Slots:
- default: the slides and the addons, in any order. Slide order is the order in the template
  (document order), even for slides mounted later by `v-if` or moved by a keyed `v-for`.
- `#footer`: the deck's footer, drawn at the bottom of every slide whose layout shows it (all but
  `cover` and `section`; the classes `no-footer` and `with-footer` decide on one slide:
  [Zones](../guide/slides-and-layouts.md#zones-header-body-footer)). Slot props: `{ number, total }`, the slide's number
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

One slide. Its one prop names its layout; the rest is CSS: its section carries the class
`layout-<name>`, and the layout's CSS arranges the slide's parts, which every slide finds the
same way: the header (its title), the body (the rest of the default slot), a zone per named
template and the deck's footer ([Zones](../guide/slides-and-layouts.md#zones-header-body-footer)).

| Prop | Type | Default | Accepted values |
|---|---|---|---|
| `layout` | String | `default` | a layout's name: the library's (below) or the project's (`src/layouts/<name>.css`: [A layout of your own](../guide/slides-and-layouts.md#a-layout-of-your-own)). Any other name works as `default`, with the class `layout-<name>` for a theme or a deck to style |

Slots, all with `{ step }` (the slide's current step) as slot props:
- default: the header (the `h1`/`h2` it starts with, and the headings right after it) and the
  body (the rest).
- `#title`: the header instead, for a header with more than a heading (a kicker line, a logo);
  the whole default slot is then the body.
- any other name (`#image`, `#left`, `#right`, your own): a zone, a column with the class
  `ar-zone-<name>`, which the layout's CSS places.

The slide's name in the jump menu, the presenter bar and the notes pages is the text of its first
`h1`/`h2`/`h3` (outside its background and the footer).

A class or a style on a `Slide` goes on its section, so CSS sets anything for one slide: a colour
or a gradient (`style="background: …"`: [Backgrounds](../guide/images-and-backgrounds.md#a-colour-or-a-gradient-css)),
any token (`style="--ar-layout-image-right-columns: 3fr 2fr"`), and the classes the engine knows:

| Class | Effect |
|---|---|
| `.top` | the body from the top (the default, unless the theme's `--ar-body-align` says otherwise) |
| `.center` | the body centred both ways, its text (the title's too) centred |
| `.bottom` | the body at the bottom |
| `.no-footer` | no deck footer on this slide, whatever its layout says |
| `.with-footer` | the deck footer on this slide, whatever its layout says |

### Layouts

Each is one CSS file of the library (its `layouts/` folder), whose comment says what it does; its
tokens, with their defaults, are in [Theme tokens](theme-tokens.md#layouts). A project file of the
same name replaces it.

| Layout | What it does | Slots |
|---|---|---|
| `default` | the header, then the body filling the rest, inside the slide's padding; the body from the top (`--ar-body-align`); the footer shown | default, `#title` |
| `cover` | the header and the body as one group, centred vertically, left-aligned; `h1` at 1.25x `--ar-title`; a `.bar` element draws a short bar in the accent; no footer | default, `#title` |
| `section` | everything centred both ways, on `--ar-accent` in `--ar-accent-fg` (the title and the footer too); `h1` at 1.4x `--ar-title`; no footer | default, `#title` |
| `split` | the header (and the body, as a lead line) across the top, then `#left` and `#right` side by side, filling the rest (`--ar-layout-split-columns`, default `1fr 1fr`) | default, `#title`, `#left`, `#right` |
| `image-left` / `image-right` | `#image` fills its side, full height and edge to edge (no padding); the other side is the text, padded like any slide: the header at the height of every other slide's title, then the body. The footer stays, over the picture. Widths: `--ar-layout-image-left-columns` / `--ar-layout-image-right-columns`, left to right (default `1fr 1fr`) | default (the text side), `#title`, `#image` |

- A zone keeps its width: wider content is clipped at the zone's edge. Heights do not clip.
- In the page, zones come after the header and the body, in the order written, whatever side the
  layout draws them on: in `image-left` the text is read before the picture.
- In `#image`, an `Img` (and an `img` or a `video`) covers the zone (`fit="contain"` still
  wins); any other element fills it.
- Content styles from `Slide.vue`'s CSS: `h1` is `--ar-title`; `h2` is 0.6x `--ar-title` in
  `--ar-accent`; `p` has a bottom margin of 0.6em; lists and tables: [Lists and tables](../guide/slides-and-layouts.md#lists-and-tables).

How the zones, lists and tables of a slide work, and how to write a layout: [Slides and layouts](../guide/slides-and-layouts.md).

## Background

A slide's background: anywhere inside a `Slide`, it draws behind all of the slide's content,
edge to edge, instead of the theme's default background, and never catches the pointer. Its
content, without `src`, is the background instead (a video, an `svg`, a gradient `div`): each
element of it covers the slide, stacked in order.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `src` | String | — | a URL (it starts with a scheme or `/`: `https://…`, `/from-public.jpg`, served under Vite's `base`), else a file of the images folder (`city.jpg`, `team/ana.png`); a missing file shows its name in a dashed box and warns |
| `opacity` | Number or String | `1` | `0`..`1`, of all of it, over the slide's colour |
| `blur` | Number or String | `0` | px (`4` or `"4px"`), of all of it |
| `position` | String | `center` | CSS `object-position` of its pictures and videos, e.g. `"center 30%"` |
| `fit` | String | `cover` | `cover` or `contain`, for its pictures and videos |

- Slot: default, the background when there is no `src`.
- `v-step` works on it (`Background(v-step="2")`), around it and inside it.
- A class or a style on it goes on what it draws (scoped styles of the deck included). Several stack in the order they are drawn.
  Headings in it are not the slide's title. Outside a `Slide` it warns and draws nothing.

```pug
Slide
  Background(src="city.jpg" opacity="0.25" position="center 30%")
  h2 Built for the city
```

How backgrounds work, and a colour or a gradient on one slide: [Images and backgrounds](../guide/images-and-backgrounds.md#backgrounds).

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
  Placed directly in a slide's body, the row is as tall as its content; `align="stretch"`, written
  out, keeps the columns as tall as the body.
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
| `.center` | its text centred, and its content centred vertically when the block is taller than it (a column of `Cols`, a cell of `Grid`, a block with a height) |
| `.top` / `.bottom` | its content at the top / the bottom of the block, when the block is taller than it |
| `.upper` | uppercase |
| `.small` | font size `--ar-text-small` (default `.75em`) |

On a `Slide` itself, `.top`, `.center` and `.bottom` place its body, and `.no-footer` and
`.with-footer` decide its footer ([Slide](#slide)). `.bar` inside a `cover` slide draws the
accent bar.

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
| `fit` | String | `contain` (`cover` in the `#image` zone of `image-left` and `image-right`, and in a `Background`) | `contain` or `cover` |
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
