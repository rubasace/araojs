# Components

Every component a deck writes: their props, slots and rules. Sizes are canvas px (the canvas is
1920x1080 unless `Deck` says otherwise). Examples are Pug, the recommended form; the same props,
slots and directives work in an HTML template ([Pug or HTML](../guide/concepts.md#pug-or-html)).

Globally registered: `Deck`, `Slide`, `Background`, `Img`, `Icon`, `Snippet`, `Notes`, `Agenda`,
and the directives `v-step` and `v-step-from` ([Directives](directives.md)). Imported
by hand from `'araojs'`: the [addons](#addons) (`ProgressBar`, `SlideNumber`) and the
[composables](composables.md) (`useDeck`, `useSlide`).

**In TypeScript.** The package's types declare these global components and directives for Vue
(`GlobalComponents`, `GlobalDirectives`), so `vue-tsc` and the editor check their props in any
template of a project that imports `'araojs'`. That declaration claims the names: a project that
also declares a global component of its own under one of them (its own global `Icon`, say) gets
`TS2717: Subsequent property declarations must have the same type`. Give yours another name
(`AppIcon`), or import it where it is used instead of registering it globally. A Pug template
is type-checked only with Volar's Pug plugin: `npm install -D @vue/language-plugin-pug`, and
`"vueCompilerOptions": { "plugins": ["@vue/language-plugin-pug"] }` in the `tsconfig`; without
it, `vue-tsc` and the editor skip Pug templates.

Contents: [Deck](#deck) · [Slide](#slide) · [Background](#background) ·
[Utility classes](#utility-classes) · [Img](#img) · [Icon](../guide/icons.md) · [Snippet](#snippet) ·
[Notes](#notes) · [Agenda](#agenda) · [Addons](#addons)

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
The layout's tokens are attributes of the slide (below).

| Prop | Type | Default | Accepted values |
|---|---|---|---|
| `layout` | String (typed: `keyof SlideLayouts`) | `default` | a layout's name: the library's (below) or the project's (`src/layouts/<name>.css`: [A layout of your own](../guide/slides-and-layouts.md#a-layout-of-your-own)). Any other name works as `default`, with the class `layout-<name>` for a theme or a deck to style. In a type-checked template only the layouts there are pass: the library's, and the project's, which the Vite plugin declares ([Layouts in the editor](../guide/slides-and-layouts.md#layouts-in-the-editor)) |

The layout's parameters: each token of its own the layout's CSS reads, `--ar-layout-<layout>-<thing>`,
is an attribute `<thing>` of its slides (kebab-case or camelCase), a string set as that token on
the slide, verbatim, instead of an attribute of its section: `Slide(layout="image-right"
columns="3fr 2fr")` is `--ar-layout-image-right-columns: 3fr 2fr`. The library's are in
[Theme tokens](theme-tokens.md#layouts) (`columns`, `gap`, `divider`, `cards`, `size`, `align`,
`title-size`…: `npx arao layouts` lists them by layout); a project layout's are its own file's. In a type-checked template a
slide takes its layout's, no other's ([Layout parameters](../guide/slides-and-layouts.md#layout-parameters)).

Slots, all with `{ step }` (the slide's current step) as slot props:
- default: the header (the `h1`/`h2` it starts with, the title, and the headings right after it:
  its subtitle, or more titles of the same tag, one per step) and the body (the rest). The title
  looks the same whatever its tag ([Titles](../guide/slides-and-layouts.md#titles)).
- `#title`: the header instead, for a header with more than a heading (a kicker line, a logo);
  the whole default slot is then the body.
- the layout's zones (`#image` on `image-*`, a project layout's own): each a column with the
  class `ar-zone-<name>`, which the layout's CSS places. Which zones a layout has, it says (its
  `@zone` tags and the `.ar-zone-<name>` its CSS styles: `npx arao layouts`); in a type-checked
  template a slide takes its layout's zones only, an error otherwise, `strictTemplates` or not
  ([Layouts in the editor](../guide/slides-and-layouts.md#layouts-in-the-editor)). At runtime any
  other name renders too, where the layout's CSS leaves it.

The slide's name in the jump menu, the presenter bar and the notes pages is the text of its first
`h1`/`h2`/`h3` (outside its background and the footer).

A class or a style on a `Slide` goes on its section, so CSS sets anything for one slide: a colour
or a gradient (`style="background: …"`: [Backgrounds](../guide/images-and-backgrounds.md#a-colour-or-a-gradient-css)),
any token (`style="--ar-title-size: 80px"`; a layout's parameter, given as an attribute too,
wins over the same token there), and the classes the engine knows:

| Class | Effect |
|---|---|
| `.top` | the body from the top (the default, unless the theme's `--ar-body-align` says otherwise) |
| `.center` | the body centred both ways, its text (the title's too) centred |
| `.bottom` | the body at the bottom |
| `.no-footer` | no deck footer on this slide, whatever its layout says |
| `.with-footer` | the deck footer on this slide, whatever its layout says |
| `.fit` | its body shrunk just enough to fit when it overflows, down to 60% of its size: its text and everything inside with it ([When it does not fit](../guide/composition.md#when-it-does-not-fit)) |
| `.scale-90`, `.scale-80`, `.scale-70` | its body at 90, 80, 70% of its size, everything inside with its text |

What a slide shows is measured: in development, a slide on screen whose content does not fit (cut
off at the bottom, under the footer, wider than its box) gets a console warning, and `arao export`
lists the slides that overflow at the end of its run
([When it does not fit](../guide/composition.md#when-it-does-not-fit)). `.fit` and the scales set
the body's font-size from the slide's: a font-size a layout of your own sets on `.ar-body` gives
way to them (set it on the slide instead).

Attributes the engine reads on any element inside a slide:

| Attribute | Effect |
|---|---|
| `data-ar-bleed` | the element is meant to reach past its box (a picture pulled out to the slide's edge with negative margins): the overflow check skips it and what is inside it |
| `data-ar-busy` | the element is still loading: the export waits for it before taking the page, and the overflow check before measuring ([Late content](../guide/export.md#late-content)) |

### Layouts

Each is one CSS file of the library (its `layouts/` folder), whose doc block says what it is for,
how to use it, its zones and its parameters (`npx arao layouts` prints it, the editor shows it on
hover); its tokens, with their defaults, are in [Theme tokens](theme-tokens.md#layouts). A project
file of the same name replaces it.

| Layout | What it does | Slots |
|---|---|---|
| `default` | the header, then the body filling the rest, inside the slide's padding; the body from the top (`--ar-body-align`); the footer shown | default, `#title` |
| `cover` | the header and the body as one group, centred vertically, left-aligned; its title (an `h1`) at 1.25x `--ar-title`, in the text colour; a `.bar` element draws a short bar in the accent; no footer | default, `#title` |
| `section` | everything centred both ways, on `--ar-accent` in `--ar-accent-fg` (the title, its subtitle, the footer and an [`Agenda`](#agenda) too); its title (an `h1`) at 1.4x `--ar-title`; no footer | default, `#title` |
| `split` | the header across the top, then the body's two children side by side, its two sides, filling the rest; a side may start with an `h3`, its heading (`columns="2fr 1fr"`, `gap`, `divider="2px solid …"`; default `1fr 1fr`, no divider) | default, `#title` |
| `grid` | each child of the body a block (a leading `Icon`/`Img`/`img`/`svg` at one size, an `h3`, a muted `p`), in rows balanced by their count (1-3 in a row, 4: 2+2, 5: 3+2, 6: 3+3, 7: 4+3, 8: 4+4, 9: 3+3+3, 10: 5+5, 11: 4+4+3, 12: 4x3, 13 and more at `max-columns`), the last one centred; the more blocks, the smaller their pictures, padding, gap and text (from 9, 11, 12 and 16 blocks), so that up to 20 fit, each a title and a one-line description; a block's parts found at any depth in it (`columns`, `rows`, `max-columns`, `gap`, `align`, `cards`, `icon-size`, `text-size`) | default, `#title` |
| `quote` | a `blockquote` opened by a big mark, and its `cite` (small, muted), in the middle; also two `p` (`size`, `mark`, `mark-color`, `align`); the footer shown | default, `#title` |
| `statement` | its title (an `h2`) huge in the accent, the rest small under it, in the middle; also a `p` first (`size`, `color`, `align`) | default, `#title` |
| `overlay` | for a slide with a `Background`: the title and the text, in `--ar-on-image` (white by default), in one of nine places (`position`: `top-left`, `top`, `top-right`, `left`, `center`, `right`, `bottom-left` by default, `bottom`, `bottom-right`), their lines aligned to that side, over a scrim (`--ar-scrim`, black by default) that darkens the picture from there (`scrim`: `0` to `1`, default `.6`; `color`); on Firefox < 151 and Safari < 18 every position falls back to the bottom left | default, `#title` |
| `caption` | a `figure`: its `Img` as big as the space allows, whole, its `figcaption` small and centred under it; also an `Img` followed by a `p` (`caption-size`, `caption-align`) | default, `#title` |
| `image-left` / `image-right` | `#image` fills its side, full height and edge to edge (no padding); the other side is the text, padded like any slide: the header at the height of every other slide's title, then the body. The footer stays, over the picture. Widths: `columns="3fr 2fr"` (`--ar-layout-image-left-columns` / `--ar-layout-image-right-columns`), left to right (default `1fr 1fr`) | default (the text side), `#title`, `#image` |

- A zone keeps its width: wider content is clipped at the zone's edge. Heights do not clip.
- In the page, zones come after the header and the body, in the order written, whatever side the
  layout draws them on: in `image-left` the text is read before the picture.
- In `#image`, an `Img` (and an `img` or a `video`) covers the zone (`fit="contain"` still
  wins); any other element fills it.
- Content styles from `Slide.vue`'s CSS: the title (`.ar-title`), whatever its tag, is 0.6x
  `--ar-title` in `--ar-accent` and its subtitle (`.ar-subtitle`) 0.45x in `--ar-muted`, unless
  the `--ar-title-*` / `--ar-subtitle-*` tokens or the layout say otherwise; in the body, `h1` is
  `--ar-title`, `h2` 0.6x `--ar-title` in `--ar-accent`; `p` has a bottom margin of 0.6em; lists and tables: [Lists and tables](../guide/slides-and-layouts.md#lists-and-tables).

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

## Utility classes

A small set of classes a deck writes on an element of a slide, every value a theme token, so a
theme restyles them. They arrange and mark what is inside a block (the body, a side of `split`,
a block of `grid`, a zone); a slide's structure is its layout's: when columns or rows are the
whole slide, write `split` or `grid` ([Composition](../guide/composition.md)). `npx arao layouts`
lists them, after the layouts, from their stylesheet's own docs (`src/styles/utilities.css` in the
package).

**Placement**: arrange a block's children. Each is as tall as its content (`grow` fills), its
children `--ar-gap-md` apart.

| Class | Effect |
|---|---|
| `.cols` | columns side by side, one per child, of equal width; set them with `--ar-cols` in its style, as CSS grid columns: `.cols(style="--ar-cols: 2fr 1fr")`, `auto 1fr` (whole `fr`: see below) |
| `.cols-2`, `.cols-3`, `.cols-4` | that many equal columns, filled row by row, every row as tall as the tallest |
| `.rows` | rows one under another, of equal height, sharing its height (give it one: `.grow`, or a zone's); `--ar-rows` sets them (`auto 1fr`) |
| `.stack` | its children one under another, the gap between them instead of their own margins |
| `.row` | its children side by side, as wide as their content, centred on one line, the gap between them: an icon or a picture and its text, with `.grow` on the text |

**Alignment**: where a block's content sits, when the block is taller than its content. In
`.cols`, `.cols-*`, `.rows` and `.row`, each child in its track (columns stretch each child by
default); in a `.stack`, its children.

| Class | Effect |
|---|---|
| `.top` | at the top |
| `.middle` | centred top to bottom, the text as it is |
| `.bottom` | at the bottom |
| `.center` | centred both ways: top to bottom, and across (its text centred) |

**Spacing**, **size** and **colour**:

| Class | Effect |
|---|---|
| `.gap-sm`, `.gap`, `.gap-lg` | the gap between the children of a block that lays them out: `--ar-gap-sm`, `--ar-gap-md` (the placement classes' own), `--ar-gap-lg` |
| `.grow` | fills the space left in its container, which lays out in a column or a row (the body, a side of `split`, a zone, a `.stack`, a `.row`) |
| `.text-sm`, `.text-lg`, `.text-xl` | smaller, larger, much larger text: `--ar-text-small` (`.75em`), `--ar-text-large` (`1.25em`), `--ar-text-xlarge` (`1.6em`) |
| `.scale-90`, `.scale-80`, `.scale-70` | everything in it at 90, 80, 70%: its text of the size it inherits, what is in em with it, and what the theme sizes in px (the headings from `--ar-title`, the gaps, an `Agenda`, a layout's own sizes, an `Icon` given a size): on a block (a side of `split`, a block of `grid`, a card), that block; on a `Slide`, its body. With a `.text-*` on the same element, both: `p.text-sm.scale-80` is 80% of a small text. A size in px written by hand does not follow ([When it does not fit](../guide/composition.md#when-it-does-not-fit)) |
| `.accent`, `.muted` | text (an `Icon` too) in `--ar-accent`, in `--ar-muted` |
| `.highlight` | a marker behind inline text: `--ar-highlight` (default the accent, light) |
| `.upper` | text in capitals |

**On a `Slide`** itself:

| Class | Effect |
|---|---|
| `.top`, `.middle`, `.bottom` | its body from the top (the default), centred top to bottom, at the bottom ([Placing the body](../guide/slides-and-layouts.md#placing-the-body)) |
| `.center` | its body centred both ways, its text too (the title's) |
| `.no-footer`, `.with-footer` | the deck's footer hidden, shown on it, whatever its layout says |
| `.fit` | its body shrunk just enough to fit, when it overflows, down to 60% of its size: its text, and everything inside by the same factor (what is in em, the headings, the gaps, an `Agenda`, a layout's own sizes, an `Icon` given a size); a warning when even that does not fit ([When it does not fit](../guide/composition.md#when-it-does-not-fit)) |
| `.scale-90`, `.scale-80`, `.scale-70` | its body at 90, 80, 70%, everything in it as `.fit` shrinks it (the title stays) |

`.bar` inside a `cover` slide draws the accent bar (the cover's own class).

```pug
Slide(layout="split")
  h2 Before and after
  div.middle
    p Three commands, and the deck is #[span.highlight live].
    p.text-sm.muted It reloads as you type.
  div
    .row
      Icon.accent(name="lucide:rocket" size="96")
      p.grow An icon beside its text
```

- Placement classes go on an element of yours: a layout lays out its own blocks (a `.row` written
  on a side of `split` stays a column), so put it on an element inside. Gaps and the look work on
  a layout's blocks too, and alignment on a side of `split` or a zone; a block of `grid` takes
  `.top`, `.middle` and `.bottom`, but across it follows grid's `align` (`.center` on it centres
  top to bottom only).
- A `Snippet`, or an `Img` that should fill, needs a box with a height: `.grow` on the columns
  around it.
- In columns and rows, a child is never wider than its track: what is wider inside it is clipped
  at the track's edge, never painted over its neighbour; rows grow to fit their content. A child
  collapsed by `v-step.collapse` frees its track.
- `--ar-cols` and `--ar-rows` are CSS grid tracks, taken as written, and apply to the element whose
  style sets them, never inherited (columns inside columns start equal again). Write whole `fr`:
  `fr` that add up to less than 1 fill only that part (`.3fr .2fr` fills half the width).
- Sizes, colours, the marker and `.upper` are `!important`: they win over what a layout or a
  theme sets on the same element (`p.accent` in a block of `grid`, whose text is muted, is the
  accent) and over an inline `style="color: …"` on it; children get them by inheritance, so a
  child's own colour still shows. So a `.scale-*` sets its element's size from the one it
  inherits, whatever a layout gave that element: put it on the block, not on text a layout sizes
  (a block of `grid`'s `p` is a caption, `.75em`; `.scale-80` on it would be `.8em`). A theme restyles them through their tokens (`--ar-accent`,
  `--ar-muted`, `--ar-text-small`/`-large`/`-xlarge`, `--ar-highlight`). Placement, alignment
  and spacing are not `!important`, so a layout keeps its own blocks and `v-step.collapse` still
  hides.
- The names are short and common, and apply to any element inside a slide: a class of the same
  name from elsewhere (`.row`, `.stack` of Bootstrap or daisyUI, Tailwind's `text-*`, Pygments'
  `.highlight` around code pasted as HTML) gets their style there too. An accepted trade-off;
  outside the slides (the presenter view, the list of decks) they touch nothing.

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

## Agenda

The talk's agenda, inside a `Slide` of any layout (typically the default one): an `ol`
(`.ar-agenda`) of the titles of the deck's `section` slides, in their order, kept up to date by
the deck (a section added, moved or renamed is in it), in big rows numbered in the accent. No
props, no slot.

Each item (`li.ar-agenda-item`) carries one state, as seen from the slide the `Agenda` is on:

| Class | Which sections |
|---|---|
| `ar-agenda-done` | those before the slide |
| `ar-agenda-current` | the first one from the slide on (the slide itself, when it is a section); it also has `aria-current="step"` |
| `ar-agenda-upcoming` | those after the current one |

- Its look is its own, whatever the layout: big numbered rows; done dimmed, number and all,
  current in the accent and bold, upcoming as it is. The rows' size and gap, the numbers' colour,
  and a colour, a number colour, an opacity and a weight per state are tokens
  (`--ar-agenda-size`, `--ar-agenda-done-color`…: [Agenda tokens](theme-tokens.md#agenda)), set
  in a theme or on one slide (`Slide(style="--ar-agenda-done-opacity: 1")`). The same values for
  the three states show no state.
- On a `section` slide, whose background is the accent, it takes the section's text colour, as
  the title does: the numbers and the current part in it (the current one bold), the parts
  already given that colour made lighter (at least 3:1 on every built-in theme). The section
  sets those tokens on its slides: a theme changes them for `.layout-section`
  (`[data-theme="x"] .layout-section { --ar-agenda-current-color: … }`), one slide in its
  `style`.
- Its size is a token (a part of `--ar-title`), not the body's text; `Slide.fit` and the scales
  shrink it all the same, with the rest of the body: an agenda too long for its slide fits with
  `Slide.fit`, down to 60%. A size you give it (`--ar-agenda-size`: px, `em`, the slide's text,
  or from the title's tokens, `calc(var(--ar-title) * .5)`) shrinks with them too. It is read
  from the slide, at full size: set it in a theme, at `:root` or on the `Slide`
  (`Slide(style="--ar-agenda-size: 48px")`); on the `Agenda` itself, or on a block inside the
  body, it is not read. Put a scale on the slide or a block around it, not on the `Agenda` itself
  (there, its size would be the text's). Past 60%: a smaller `--ar-agenda-size` (or
  `--ar-agenda-gap`), or fewer sections.
- A hand-written `ol` with the class `agenda` (`ol.agenda`) gets the same rows and numbers, with
  no state.
- The titles are the sections' first headings (their name in the jump menu), the same in the
  audience view, the presenter view (its slide and its preview, each seen from its own copy of
  the slide), the export and a deck's thumbnail.
- Written on several slides (after each section, or on each section slide), each copy shows where
  the talk stands there. `useDeck().slides` is the list it reads ([Composables](composables.md#usedeck)).
- Outside a `Slide` it warns and draws nothing.

```pug
Slide
  h2 Agenda
  Agenda
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
