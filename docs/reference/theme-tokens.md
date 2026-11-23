# Theme tokens

Every token, with its default (the `default` theme). Themes set tokens only; the engine's CSS
(each component's styles, and `styles/base.css`) reads them. Sizes on the canvas are canvas px;
the interface's are window px.

How themes are written, found and applied: [Themes](../guide/themes.md).

To override a token from the project's own CSS ([Overriding tokens](../guide/themes.md#overriding-tokens)):

- `:root, [data-theme] { --ar-accent: … }` in every theme. A plain `:root` reaches only `default`
  (and the tokens a theme leaves alone): each theme declares its tokens on the deck's element
  (`[data-theme="x"]`), and an element's own declaration beats what it inherits from `:root`.
- `[data-theme="aurora"] { … }` in one theme.
- `[data-theme] .layout-section { … }` for a token a theme sets inside a layout.
- The project's CSS loads after araojs's, as it does from `src/main.js` (imported after `araojs`)
  or a deck's `<style>`: at equal specificity, the later rule wins.

The layouts' colours and sizes default to the tokens below, so `--ar-accent` restyles every
layout at once.

## Colours and type

| Token | Default | Meaning |
|---|---|---|
| `--ar-bg` | `#f6f3ec` | slide background colour |
| `--ar-fg` | `#1b2a3a` | text colour |
| `--ar-muted` | `#5b6b7b` | secondary text (`.muted`, slide number, footer) |
| `--ar-accent` | `#2a7de1` | `h2`, cover bar, section background (their layouts' defaults), progress, highlights |
| `--ar-accent-fg` | `#fff` | text on accent (section slides) |
| `--ar-letterbox` | `#1b2a3a` | around the canvas when the window shape differs |
| `--ar-font-sans` | `"Gelasio", Georgia, serif` | text font; a web font named here is fetched at build time ([Fonts](../guide/themes.md#fonts)), as `default`'s Gelasio is (Georgia's metrics; Georgia where it cannot be fetched) |
| `--ar-font-mono` | `ui-monospace, Menlo, monospace` | code font; a web font named here is fetched at build time |
| `--ar-font-heading` | none: the font around the heading (the text font) | the headings' font (`h1`–`h6` in a slide, the cover's and the section's titles included); a web font named here is fetched at build time |
| `--ar-text-base` | `42px` | base font size of a slide |
| `--ar-title` | `96px` | the type scale: `h1` size; `h2` is 0.6x; the slide title 0.6x and its subtitle 0.45x by default (`--ar-title-size`, `--ar-subtitle-size`); the cover's title 1.25x and the section's 1.4x by default ([Layouts](#layouts)) |
| `--ar-text-small` | `.75em` | `.text-sm` ([utility classes](components.md#utility-classes)) |
| `--ar-text-large` | `1.25em` | `.text-lg` |
| `--ar-text-xlarge` | `1.6em` | `.text-xl` |
| `--ar-highlight` | `--ar-accent` at 25 % over transparent | the marker behind `.highlight` text: a CSS background (a colour or a gradient) |
| `--ar-placeholder` | `currentColor` (the text colour where drawn) | colour of the missing-picture and missing-icon boxes |

## Spacing and shape

| Token | Default | Meaning |
|---|---|---|
| `--ar-pad-y` | `110px` | slide padding, the safe margin: top and bottom (and the text side of `image-*`); the bottom is always at least `--ar-footer-height`, so the content never sits under the footer |
| `--ar-pad-x` | `140px` | slide padding, the safe margin: both sides (and the footer's sides) |
| `--ar-radius` | `4px` | corner radius (`Img rounded`, placeholders) |
| `--ar-gap-sm` / `-md` / `-lg` | `24px` / `48px` / `80px` | `.gap-sm`, `.gap`, `.gap-lg`; `md` is the gap of `.cols`, `.rows`, `.stack` and `.row`; `lg` between `split`'s sides; `sm` between `grid`'s blocks and the footer's children |

## Background, motion, addons

| Token | Default | Meaning |
|---|---|---|
| `--ar-slide-bg-image` | `none` | default slide background: a gradient, or `url(…)` relative to the theme file; drawn over the slide's own colour (a section's accent, `style="background: …"`), not on a slide with a `Background` |
| `--ar-slide-bg-position` | `center` | its position |
| `--ar-slide-bg-opacity` | `1` | its opacity |
| `--ar-step-duration` | `.35s` | fade time of `v-step` (and of the glide of `.collapse` steps) |
| `--ar-slide-duration` | `.4s` | fade from one slide to the next |
| `--ar-progress-height` | `8px` | `ProgressBar` height |
| `--ar-progress-duration` | `.35s` | `ProgressBar`'s move to the new position |
| `--ar-slide-number-size` | `24px` | `SlideNumber`'s text size |

A theme can leave a layout without its default background, and a slide can too:
`[data-theme="x"] .layout-section { --ar-slide-bg-image: none; }`, `Slide(style="--ar-slide-bg-image: none")`.

## Slide zones and content

The title tokens style the slide's title (`.ar-title`: the heading its header starts with, in
every layout), not every `h1`/`h2`; the subtitle tokens its subtitle (`.ar-subtitle`: the
headings right after it, of another tag). The title looks the same whatever its tag, `h1` or
`h2` ([Titles](../guide/slides-and-layouts.md#titles)). A layout may set them for its slides or
style its own title: the cover's and the section's take their size from their layout
([Layouts](#layouts)), the cover's is in the text colour, a section's title and subtitle in its
text colour, a statement's is the statement.

| Token | Default | Meaning |
|---|---|---|
| `--ar-title-size` | 0.6x `--ar-title` | the title's font size, whatever its tag |
| `--ar-title-color` | `--ar-accent` | the title's colour |
| `--ar-title-align` | `match-parent` (as the slide's text) | `start`, `center`, `end`: the title's and its subtitle's |
| `--ar-title-gap` | 0.6x the title's size | space under the header (the title and its subtitle), before the body; a length (em there is the slide's text size) |
| `--ar-subtitle-size` | 0.45x `--ar-title` | the subtitle's font size |
| `--ar-subtitle-color` | `--ar-muted` (on a section: its text colour) | the subtitle's colour |
| `--ar-subtitle-gap` | `.2em` (of the subtitle) | space above the subtitle, under the title |
| `--ar-header-height` | `auto` (as tall as the title) | a length: a header band, at least this tall, the title centred in it, `--ar-title-gap` under the band |
| `--ar-body-align` | `start` | `start`, `center` or `end`: where the body sits (on one slide, the classes `.top`, `.center`, `.bottom` set it); anything else is `start` |
| `--ar-list-gap` | `0` | space between list items |
| `--ar-footer-height` | `88px` | the footer band, at the bottom of the slide, in its bottom padding (made at least this tall where the footer shows) |
| `--ar-footer-size` | `24px` | footer text size |
| `--ar-footer-color` | `--ar-muted` (on a section: its text colour) | footer text colour |
| `--ar-footer-align` | `space-between` | how the footer's children spread: `flex-start`, `center`, `flex-end`, `space-between` |

| Token | Default | Meaning |
|---|---|---|
| `--ar-table-pad` | `.4em .8em` | cell padding |
| `--ar-table-border` | `2px solid` the text colour at 15 % | the line under every row (a CSS `border`) |
| `--ar-table-head-bg` | `none` | header cells' background |
| `--ar-table-head-color` | `--ar-muted` | header cells' text colour |
| `--ar-table-stripe` | `none` | background of every other body row |

Tokens may be set per layout, or on any element, like every token:

```css
[data-theme="venue"] .layout-default { --ar-title-color: #fff; --ar-title-gap: 120px; } /* content slides */
[data-theme="venue"] .layout-section { --ar-footer-color: #fff; }
```

```pug
table.dense(style="--ar-table-pad: 12px 20px")
```

## Layouts

Each layout's CSS file (the library's `layouts/`, the project's `src/layouts`) reads tokens of its
own, `--ar-layout-<layout>-<thing>`. Set them in a theme, in the project's CSS (as any token:
`:root, [data-theme]`, above), or on one slide, where each is also an attribute of `Slide`, its
`<thing>` (`Slide(layout="image-right" columns="3fr 2fr")`: [Layout parameters](../guide/slides-and-layouts.md#layout-parameters)).
A `*-footer` token is the footer's CSS `display`: `none` hides it, `flex` shows it; a slide's
`.no-footer` or `.with-footer` wins over it.

| Token | Attribute | Default | Meaning |
|---|---|---|---|
| `--ar-layout-cover-title-size` | `title-size` | 1.25x `--ar-title` | the cover's title size (its `h1`) |
| `--ar-layout-cover-bar` | `bar` | `--ar-accent` | the colour of its `.bar` |
| `--ar-layout-cover-footer` | `footer` | `none` | the deck's footer on covers |
| `--ar-layout-section-bg` | `bg` | `--ar-accent` | a section's background (the theme's `--ar-slide-bg-image` is drawn over it) |
| `--ar-layout-section-fg` | `fg` | `--ar-accent-fg` | its text, its title and its footer |
| `--ar-layout-section-title-size` | `title-size` | 1.4x `--ar-title` | its title size (its `h1`) |
| `--ar-layout-section-footer` | `footer` | `none` | the deck's footer on sections |
| `--ar-layout-split-columns` | `columns` | `1fr 1fr` | the two sides' widths (the body's two children), left to right, as CSS grid columns |
| `--ar-layout-split-gap` | `gap` | `--ar-gap-lg` | the space between them |
| `--ar-layout-split-divider` | `divider` | `none` | a line between them, as a CSS border (`2px solid currentColor`) |
| `--ar-layout-grid-columns` | `columns` | balanced by the count | blocks per row, whatever their count |
| `--ar-layout-grid-rows` | `rows` | none | how many rows, whatever the count: a row holds the count divided by it, rounded up (up to 24 blocks; `columns` wins) |
| `--ar-layout-grid-max-columns` | `max-columns` | `5` | the most blocks in a row: 13 and more wrap there, no balanced row is wider |
| `--ar-layout-grid-gap` | `gap` | `--ar-gap-sm` (x .75 from 11 blocks, x .5 from 12, x .4 from 16) | the space between the blocks (the cards) |
| `--ar-layout-grid-align` | `align` | `center` | a block's content: `center` or `start` |
| `--ar-layout-grid-cards` | `cards` | `none` | each block's background, making it a card (a colour, a gradient) |
| `--ar-layout-grid-icon-size` | `icon-size` | `3em` (`2em` from 9 blocks, `1.75em` from 11, `1.5em` from 12, `1.2em` from 16) | the size of a block's leading picture or icon |
| `--ar-layout-grid-text-size` | `text-size` | `--ar-text-small` (x .9 from 11 blocks, x .82 from 12, x .72 from 16, the `h3` too) | the size of a block's text, its `p`; `1em` keeps the slide's (columns of text); given, it stays as given |
| `--ar-layout-quote-size` | `size` | 0.8x `--ar-title` | the quote's size |
| `--ar-layout-quote-mark` | `mark` | `'“'` | the decorative mark, a CSS string (quotes written: `mark="'«'"`) |
| `--ar-layout-quote-mark-color` | `mark-color` | `--ar-accent` | its colour |
| `--ar-layout-quote-align` | `align` | `center` | `center` or `start` |
| `--ar-layout-statement-size` | `size` | 1.5x `--ar-title` | the statement's size |
| `--ar-layout-statement-color` | `color` | `--ar-accent` | its colour |
| `--ar-layout-statement-align` | `align` | `center` | `center` or `start` |
| `--ar-layout-overlay-position` | `position` | `bottom-left` | where the text sits, its lines aligned to that side: `top-left`, `top`, `top-right`, `left`, `center`, `right`, `bottom-left`, `bottom` or `bottom-right` (any other value is the default) |
| `--ar-layout-overlay-scrim` | `scrim` | `.6` | how dark the scrim between the picture and the text is, `0` (none; `none` too) to `1`: darkest at the corner or side the text is at and fading away from it, an even veil for `center` |
| `--ar-layout-overlay-color` | `color` | `#fff` | the text's colour, its title's and its footer's |
| `--ar-layout-caption-caption-size` | `caption-size` | `--ar-text-small` | the caption's size |
| `--ar-layout-caption-caption-align` | `caption-align` | `center` | the caption's alignment |
| `--ar-layout-image-left-columns` / `--ar-layout-image-right-columns` | `columns` | `1fr 1fr` | the two sides' widths, left to right, as CSS grid columns (`3fr 2fr`, `1fr 720px`) |
| `--ar-layout-image-left-inset` / `--ar-layout-image-right-inset` | `inset` | `0px` | padding around the picture in its zone |
| `--ar-layout-image-left-footer` / `--ar-layout-image-right-footer` | `footer` | `flex` | the deck's footer on those slides, over the picture |
| `--ar-layout-image-left-footer-bg` / `--ar-layout-image-right-footer-bg` | `footer-bg` | `none` | a backdrop under that footer (a colour, a gradient), to keep it legible over a photo |

```css
[data-theme="venue"] {
  --ar-layout-section-bg: #0b3d2e;
  --ar-layout-image-right-footer-bg: linear-gradient(transparent, rgb(0 0 0 / .45));
}
```

## Code (Snippet)

| Token | Default | Meaning |
|---|---|---|
| `--ar-code-theme` | `github-light` | Shiki theme; set to nothing, the code shows without colours |
| `--ar-code-size` | `42px` | standard code font size |
| `--ar-code-width` | `1520px` | standard window width |
| `--ar-code-aspect` | `16 / 9` | window shape (width / height); the window is as large as fits with this shape |
| `--ar-code-bg` | `#ffffff` | window background |
| `--ar-code-bar` | `#e9e6df` | title bar |
| `--ar-code-fg` | `#24292e` | text before colours load |
| `--ar-code-muted` | `#8b95a1` | line numbers |
| `--ar-code-title` | `#3b4048` | title bar text |
| `--ar-code-title-size` | `34px` | title bar text size |
| `--ar-code-hl` | `--ar-accent` | highlight colour: the line numbers of highlighted lines, and the highlight background unless `--ar-code-hl-bg` says |
| `--ar-code-hl-bg` | `--ar-code-hl` at 14 % (a line) or 22 % (a word) | background of highlighted lines and words; a pale colour keeps the code's colours legible on a light window (the tint of a dark highlight colour lowers their contrast) |
| `--ar-code-radius` | `14px` | window corner radius |
| `--ar-code-shadow` | `0 30px 70px rgba(0,0,0,.35), 0 8px 20px rgba(0,0,0,.2), inset 0 0 0 1px rgba(255,255,255,.06)` | the window's shadow |
| `--ar-code-shadow-room` | `70px` | room kept on each side of the window in a column of `.cols`, `.cols-*` or `.rows`, a side of `split` or a zone (they clip what is wider than them), so its shadow is not cut: keep it at least the shadow's sideways reach, its blur + spread + x offset (the widest of its shadows; `aurora` sets `90px`, `carbon` `80px`). Only sideways: they clip no height |
| `--ar-code-light-1` / `-2` / `-3` | `#ff5f57` / `#febc2e` / `#28c840` | the title bar's three lights, left to right |
| `--ar-code-duration` | `.3s` | lines and words dimming and lighting up between steps |

## Agenda

[`Agenda`](components.md#agenda)'s look, in any slide (and a hand-written `ol.agenda`'s: its rows
and numbers). Set them in a theme, at the project's `:root`, or on one slide, in its `style`
(`Slide(style="--ar-agenda-done-opacity: 1")`). On a `section` slide, whose background is the
accent, the section sets the colours to its text colour (`currentColor`; done at 80 % of it):
change them for `.layout-section`, as `--ar-title-color`.

| Token | Default | Meaning |
|---|---|---|
| `--ar-agenda-size` | 0.65x `--ar-title` | the rows' size |
| `--ar-agenda-gap` | `.35em` | the space between rows |
| `--ar-agenda-number-color` | `--ar-accent` | the numbers' colour |
| `--ar-agenda-done-color` / `-number-color` / `-opacity` / `-weight` | `--ar-muted` at 80 % / its colour / `1` / `400` | a part already given (`ar-agenda-done`): dimmed by its colour, at least 3:1 on every built-in theme |
| `--ar-agenda-current-color` / `-number-color` / `-opacity` / `-weight` | `--ar-accent` / `--ar-agenda-number-color` / `1` / `700` | the next part (`ar-agenda-current`) |
| `--ar-agenda-upcoming-color` / `-number-color` / `-opacity` / `-weight` | `currentColor` / `--ar-agenda-number-color` / `1` / `400` | the parts after it (`ar-agenda-upcoming`) |

```css
[data-theme="venue"] {
  /* an agenda that shows no state: the three states alike */
  --ar-agenda-done-color: currentColor;
  --ar-agenda-done-number-color: var(--ar-accent);
  --ar-agenda-current-color: currentColor;
  --ar-agenda-current-weight: 400;
}
```

## Interface

The deck's own interface, outside the canvas (window px): the controls, the notice above them,
the presenter view, the list of decks, the export. The controls and the export's notes pages sit
inside the theme the deck wears; the presenter view and the list of decks sit outside every theme
(set their tokens at `:root`).

| Token | Default | Meaning |
|---|---|---|
| `--ar-ui-font` | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | the interface's font (and the notes pages'); not fetched: a system font, or `arao({ fonts: { families: [{ name, global: true }] } })` |
| `--ar-ui-mono` | `ui-monospace, "SFMono-Regular", Menlo, monospace` | code in the presenter's notes |
| `--ar-ui-text` | `16px` | the interface's base text size; its other sizes are multiples of it |
| `--ar-ui-duration` | `.2s` | panels, notices and step dots coming and going |
| `--ar-ui-duration-fast` | `.15s` | hover and press feedback |
| `--ar-ui-duration-slow` | `.25s` | the floating controls showing and hiding |

Controls (frosted glass) and the notice above them (the presenter window was blocked):

| Token | Default | Meaning |
|---|---|---|
| `--ar-controls-bg` | `rgba(28, 28, 34, .84)` | the bar's tint |
| `--ar-controls-panel-bg` | `rgba(28, 28, 34, .92)` | the jump menu's and theme picker's tint |
| `--ar-controls-sheen` | a white top-down gradient, `.16` → `.02` | the glass's sheen, over the tint |
| `--ar-controls-blur` | `blur(28px) saturate(180%) brightness(1.05)` | the backdrop filter |
| `--ar-controls-shadow` | a drop shadow and a specular edge | the bar's and panels' `box-shadow` |
| `--ar-controls-border` | `rgba(255, 255, 255, .16)` | the bar's and panels' border |
| `--ar-controls-fg` | `rgba(255, 255, 255, .94)` | text and icons |
| `--ar-controls-dim` | `rgba(255, 255, 255, .5)` | secondary text, step dots |
| `--ar-controls-line` | `rgba(255, 255, 255, .14)` | dividers, the search field's border, swatch edges |
| `--ar-controls-hover` / `--ar-controls-hover-shadow` | `rgba(255, 255, 255, .1)` / `inset 0 1px 0 rgba(255, 255, 255, .1)` | a button or item under the pointer |
| `--ar-controls-active` | `rgba(255, 255, 255, .16)` | the button of the open panel |
| `--ar-controls-field-bg` / `--ar-controls-field-shadow` | `rgba(255, 255, 255, .08)` / `inset 0 1px 2px rgba(0, 0, 0, .25)` | the search field |
| `--ar-controls-scrollbar` | `rgba(255, 255, 255, .2)` | the jump menu's scrollbar |
| `--ar-controls-accent` | `--ar-accent` (docked in the presenter view: `--ar-controls-fg`) | the current step dot, the current slide's number, the focused field |
| `--ar-controls-radius` | `8px` | items; buttons and the field 1.125x, the bar and panels 2x, the notice 1.5x, swatches .625x |
| `--ar-toast-bg` / `--ar-toast-shadow` / `--ar-toast-link` | `#1c1c22` / `0 12px 32px rgba(0, 0, 0, .35)` / `#8ab4ff` | the notice (its text and border are the controls') |

Presenter view (its own dark look, whatever the deck theme):

| Token | Default | Meaning |
|---|---|---|
| `--ar-presenter-bg` | `#14161b` | the page |
| `--ar-presenter-bar` | `#101216` | the top bar |
| `--ar-presenter-panel` | `#1c1f26` | the next step's and the notes' panels, buttons, the length editor |
| `--ar-presenter-hover` | `#272b34` | a button under the pointer |
| `--ar-presenter-frame` | `#0d0f13` | where the next step would be, after the last one |
| `--ar-presenter-line` | `#2b2f39` | borders |
| `--ar-presenter-edge` | `rgba(255, 255, 255, .16)` | the slides' own edge |
| `--ar-presenter-fg` / `-dim` / `-strong` | `#eceef2` / `#949bab` / `#fff` | text, secondary text, bold text in the notes |
| `--ar-presenter-accent` | `#5b9dff` | the notes of the step just reached, a changed length, focus rings |
| `--ar-presenter-low` / `-over` | `#f5b13d` / `#ff5a4f` | the countdown's last minutes / past the end (and an invalid length) |
| `--ar-presenter-code-bg` | `#2a2e38` | inline code in the notes |
| `--ar-presenter-scrollbar` | `#3a3f4b` | the notes' scrollbar |
| `--ar-presenter-shadow` | `0 16px 40px color-mix(in srgb, var(--ar-presenter-bg) 85%, transparent)` | the length editor's shadow (it follows `--ar-presenter-bg` set at `:root`) |
| `--ar-presenter-radius` | `10px` | buttons, the slides' corners; panels 1.4x, the length editor 1.2x, its fields .8x, inline code .5x |
| `--ar-presenter-notes-size` | `clamp(18px, .85vw + 9px, 28px)` | the notes' text size |

List of decks (`/`, its own dark look, whatever the decks' themes; its text sizes are multiples of
`--ar-ui-text`, and each cover wears its deck's theme):

| Token | Default | Meaning |
|---|---|---|
| `--ar-selector-bg` | `#14161b` | the page |
| `--ar-selector-panel` / `-raised` | `#1c1f26` / `#222631` | a card (and the notice of a missing deck) / a card under the pointer |
| `--ar-selector-frame` | `#0d0f13` | a cover's frame: around a cover of another shape, and until it is drawn |
| `--ar-selector-line` / `-line-hover` | `#2b2f39` / `#3c4252` | borders / a card's border under the pointer |
| `--ar-selector-edge` | `rgba(255, 255, 255, .08)` | a cover frame's own edge |
| `--ar-selector-sheen` / `-still` | `rgba(255, 255, 255, .11)` / `rgba(255, 255, 255, .05)` | going by in a frame until its cover is drawn / its still tint (reduced motion) |
| `--ar-selector-fg` / `-dim` | `#eceef2` / `#949bab` | text / the count, a cover's heading, a path, the arrow |
| `--ar-selector-accent` | `#5b9dff` | the heading's bar, the notice's edge, focus rings, the arrow under the pointer |
| `--ar-selector-shadow` | `0 18px 40px rgba(0, 0, 0, .38), 0 2px 8px rgba(0, 0, 0, .24)` | a card under the pointer |
| `--ar-selector-radius` | `14px` | a card; a cover's frame .5x, the notice 5/7 |

Export (`?export`; canvas px for the notes pages):

| Token | Default | Meaning |
|---|---|---|
| `--ar-export-bg` | `#2a2a2e` | behind the pages, on screen |
| `--ar-notes-page-bg` / `-fg` | `#fff` / `#1c1c22` | a notes page (`&notes`) |
| `--ar-notes-page-muted` / `-line` | `#5c5c66` / `#d4d4da` | its head (the slide's number and title) and the rule under it |
| `--ar-notes-page-step` | `#8a5a00` | "From step n" over a step's notes |
| `--ar-notes-page-text` / `-head-size` / `-step-size` | `34px` / `28px` / `24px` | its text sizes |

Set by the engine, read-only: `--ar-scale` (the stage's current scale factor; `1` in export).
