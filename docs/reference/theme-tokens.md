# Theme tokens

Every token, with its default (the `default` theme). Themes set tokens only; the engine's CSS
(each component's styles, and `styles/base.css`) reads them. Sizes on the canvas are canvas px;
the interface's are window px.

How themes are written, found and applied: [Themes](../guide/themes.md).

## Colours and type

| Token | Default | Meaning |
|---|---|---|
| `--ar-bg` | `#f6f3ec` | slide background colour |
| `--ar-fg` | `#1b2a3a` | text colour |
| `--ar-muted` | `#5b6b7b` | secondary text (`.muted`, slide number, footer) |
| `--ar-accent` | `#2a7de1` | `h2`, cover bar, section background, progress, highlights |
| `--ar-accent-fg` | `#fff` | text on accent (section slides) |
| `--ar-letterbox` | `#1b2a3a` | around the canvas when the window shape differs |
| `--ar-font-sans` | `Georgia, "Times New Roman", serif` | text font; a web font named here is fetched at build time ([Fonts](../guide/themes.md#fonts)) |
| `--ar-font-mono` | `ui-monospace, Menlo, monospace` | code font; a web font named here is fetched at build time |
| `--ar-font-heading` | none: the font around the heading (the text font) | the headings' font (`h1`–`h6` in a slide, the cover's and the section's titles included); a web font named here is fetched at build time |
| `--ar-text-base` | `42px` | base font size of a slide |
| `--ar-title` | `96px` | the type scale: `h1` size; `h2` is 0.6x, cover `h1` 1.25x, section `h1` 1.4x (the slide title's own size is `--ar-title-size`) |
| `--ar-text-small` | `.75em` | `.small` |
| `--ar-placeholder` | `currentColor` (the text colour where drawn) | colour of the missing-picture and missing-icon boxes |

## Spacing and shape

| Token | Default | Meaning |
|---|---|---|
| `--ar-pad` | `110px 140px` | slide padding, the safe margin (and the text side of `image-*`); the footer band, when shown, takes the place of its bottom |
| `--ar-radius` | `4px` | corner radius (`Img rounded`, placeholders) |
| `--ar-gap-sm` / `-md` / `-lg` | `24px` / `48px` / `80px` | `gap="sm\|md\|lg"`; `md` is the default gap of `Cols`/`Rows`/`Grid`; `lg` between zones; `sm` between the footer's children |
| `--ar-image-inset` | `0` | padding around the picture in an `image-*` zone |

## Background, motion, addons

| Token | Default | Meaning |
|---|---|---|
| `--ar-slide-bg-image` | `none` | default slide background: a gradient, or `url(…)` relative to the theme file |
| `--ar-slide-bg-position` | `center` | its position |
| `--ar-slide-bg-opacity` | `1` | its opacity |
| `--ar-step-duration` | `.35s` | fade time of `v-step` (and of the glide of `.collapse` steps) |
| `--ar-slide-duration` | `.4s` | fade from one slide to the next |
| `--ar-progress-height` | `8px` | `ProgressBar` height |
| `--ar-progress-duration` | `.35s` | `ProgressBar`'s move to the new position |
| `--ar-slide-number-size` | `24px` | `SlideNumber`'s text size |

A theme can leave a layout without its default background:
`[data-theme="x"] .layout-section { --ar-slide-bg-image: none; }`.

## Slide zones and content

The title tokens style the slide's title (`.ar-title`: the header's heading, the heading of
`split`'s header and of `image-*`'s text side), not every `h1`/`h2`; cover and section headings
keep `--ar-title`. Without them the title looks as any `h2` (or `h1`) does.

| Token | Default | Meaning |
|---|---|---|
| `--ar-title-size` | an `h2`: 0.6x `--ar-title`; an `h1`: `--ar-title` | the title's font size |
| `--ar-title-color` | an `h2`: `--ar-accent`; an `h1`: the text colour | the title's colour |
| `--ar-title-align` | `match-parent` (as the slide's text) | `start`, `center`, `end` |
| `--ar-title-gap` | `.6em` under an `h2`, `.4em` under an `h1` | space between the title and the body (em: the title's size; under a header band, give px) |
| `--ar-header-height` | `auto` (as tall as the title) | a length: a header band, at least this tall, the title centred in it, `--ar-title-gap` under the band |
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
| `--ar-code-light-1` / `-2` / `-3` | `#ff5f57` / `#febc2e` / `#28c840` | the title bar's three lights, left to right |
| `--ar-code-duration` | `.3s` | lines and words dimming and lighting up between steps |

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
