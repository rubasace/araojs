# Slides and layouts

A slide is a `Slide` inside the `Deck`. Its one prop, `layout`, names a layout: CSS that
arranges the slide's parts (the header, the body, the zones of its named templates, the footer).
Every slide finds those parts the same way, whatever its layout. The layout's tokens are the
slide's attributes too ([Layout parameters](#layout-parameters)). Every prop and slot:
[Slide](../reference/components.md#slide).

## Layouts

`default` (a content slide), `cover`, `section`, `split` (a header over two named zones) and
`image-left` / `image-right` (a full-height, edge-to-edge picture beside the text). Each is one CSS
file of the library; the full table, and the tokens each one reads:
[Layouts](../reference/components.md#layouts). A name with no CSS behind it is the `default`
layout, its slides carrying the class `layout-<name>` for a theme or a deck to style. In a
TypeScript project the editor completes the names there are, and each layout's parameters, and
`vue-tsc` turns down any other ([Layouts in the editor](#layouts-in-the-editor)).

A cover:

<!-- example:cover -->

```vue
<template lang="pug">
Deck
  Slide(layout="cover")
    .bar
    h1 Building a framework
    p.muted Jane Doe · DevConf 2026
</template>
```

<!-- /example -->

![The cover example, drawn](../assets/shots/cover.png)

A split slide, its right side revealed at step 2:

<!-- example:split -->

```vue
<template lang="pug">
Deck
  Slide(layout="split")
    h2 Before and after
    template(#left)
      h3 #[Icon(name="lucide:git-fork")] Before
      ul
        li Every team rolled its own
        li Twelve ways to log
    template(#right)
      h3(v-step="2") #[Icon(name="lucide:package-check")] After
      ul(v-step="2")
        li One starter for all
        li One version to bump
</template>
```

<!-- /example -->

![The split example, at its last step](../assets/shots/split.png)

A picture beside the text, and a section divider:

```pug
Slide(layout="image-right")
  template(#image)
    Img(file="demo/landscape.svg" alt="A landscape")
  h2 One picture, one idea
  p The picture fills its side, top to bottom, edge to edge.

Slide(layout="section")
  h1 Why a framework?
```

### Layout parameters

A layout's tokens tune it ([Layout tokens](../reference/theme-tokens.md#layouts)): in a theme, for
every slide of that layout, or on one slide, where each token of its layout is an attribute of
`Slide` too, named as the token ends: `--ar-layout-<layout>-<thing>` is `<thing>`.

```pug
Slide(layout="image-right" columns="3fr 2fr")   //- text 3/5, picture 2/5
  …
Slide(layout="split" columns="2fr 1fr" gap="96px")
  …
Slide(layout="cover" bar="gold" title-size="160px")
  …
```

- The value is set as that token on the slide, as written: any value the token takes
  (`columns="3fr 2fr"` is `--ar-layout-image-right-columns: 3fr 2fr`). It is not an attribute of
  the slide's element. An empty one sets nothing: the layout's default stays.
- The attributes are the slide's layout's: `columns` on a `cover` is no parameter of it, and goes
  on the slide's element as a plain HTML attribute, doing nothing; in a type-checked template it
  is an error ([Layouts in the editor](#layouts-in-the-editor)).
- Written in kebab-case or in camelCase (`footer-bg`, `footerBg`), and bound like any attribute:
  `:bar="accent"` follows `accent`. In every view of the deck: the audience's, the presenter's,
  the list of decks' covers, the export.
- The token in `style` works too (`style="--ar-layout-image-right-columns: 3fr 2fr"`); given both
  ways, the attribute wins.
- A layout's parameters are the tokens its CSS file reads, nothing more to declare: the library's
  ([Layout tokens](../reference/theme-tokens.md#layouts)), and a project layout's
  ([A layout of your own](#a-layout-of-your-own)). A token whose name is an attribute a slide
  already has (any HTML global attribute: `title`, `id`, `hidden`, `lang`, `dir`, `class`,
  `style`, `slot`, `tabindex`…; Vue's `key`, `ref` and `is`; `Slide`'s `layout`; anything
  starting with `on`, `data-`, `aria-` or `v-`), or that is not in lower-case kebab-case, is no
  attribute: set it in `style`.

## Zones: header, body, footer

Every slide is laid out from the same parts; the `default` layout stacks them in a column inside
the slide's padding (`--ar-pad-y`, `--ar-pad-x`). Nothing to declare: the slide finds them.

```pug
Slide
  h2 Three pillars        //- header: the heading the slide starts with
  Cols(gap="lg")          //- body: everything else
    div …
```

- **Header**: when the default slot starts with an `h1` or `h2`, that heading is the slide's title
  and goes into the header; headings right after it go there too (a subtitle, or one title per
  step: `h2(v-step.only.collapse="1") …`, `h2(v-step.only.collapse="2") …`). Comments, `v-if`s
  that render nothing, `Notes` and `Background` before it do not count. A `#title` slot, when
  given, is the header instead, for headers with more than a heading (a kicker line, a logo); its
  first `h1`/`h2` is the title. A slide that starts with anything else has no header: the body
  takes the slide. The title carries the class `ar-title` and follows the `--ar-title-*` tokens;
  with `--ar-header-height` the header is a band of that height with the title centred in it
  ([Theme tokens](../reference/theme-tokens.md#slide-zones-and-content)). The slide's first
  heading is also its name in the jump menu, the presenter view and the notes pages.
- **Body**: everything else, in a column that fills the space under the header. It starts at the
  top, right under the header, so content begins at the same height on every slide. What does not
  fit overflows at the bottom, never at the top. What fills the body fills it: `Img`, `Snippet`,
  an element with `flex: 1`, the `1fr` rows of `Grid` and `Rows`. `Cols`, `Rows` and `Grid` placed
  directly in it shrink their auto rows to their content and move with the body, unless they hold
  something that needs the full height (a `Snippet`, an `Img`, another piece);
  `Cols(align="stretch")`, written out, keeps full-height columns.
- **Zones**: each named template (`template(#image)`, `template(#left)`…) is a zone of its own, a
  column with the class `ar-zone-<name>` (`#title` is the header's). The layout's CSS places it:
  `#image` beside the text in `image-*`, `#left` and `#right` under the header in `split`. In the
  page the zones always come after the header and the body, in the order written, whatever side
  the layout draws them on: in `image-left` a screen reader, the tab order and a copied text read
  the text first, then the picture.
- **Footer**: the `Deck`'s `#footer` slot, in a band `--ar-footer-height` tall (88 px) over the
  bottom of the slide, with the slide's side padding and its text in `--ar-footer-size` and
  `--ar-footer-color`. Its children sit in a row, spread by `--ar-footer-align` (`space-between`:
  one at the start, two at both ends). It sits in the slide's bottom padding, above the content;
  that padding is always at least as tall as the band (the larger of `--ar-pad-y` and
  `--ar-footer-height`), footer or not, so the content never sits under it and every slide's body
  ends at the same place. Shown on `default`, `split` and `image-*`
  (over the picture), hidden on `cover` and `section`: each layout says so with a token
  (`--ar-layout-cover-footer: flex` shows it on every cover). On a section it takes the section's
  text colour.
- `SlideNumber` keeps its corner (bottom right, on the footer band's line with the default
  height), outside the footer's content box. To have the number inside the footer, use the slot
  props (`{{ number }} / {{ total }}`) instead of `SlideNumber`.

### Placing the body

Where the body sits is the token `--ar-body-align` (`start`, the default; `center`; `end`): a theme
can change it for the whole deck, a layout for its slides. On one slide, a class does it:

| Class on a `Slide` | Its body |
|---|---|
| `.top` | from the top (the default, unless the theme says otherwise) |
| `.center` | centred both ways: in the space under the header, and its text (the title's too) |
| `.bottom` | at the bottom |

On a block inside a slide (a column of `Cols`, a cell of `Grid`, a block with a height), the same
classes place its content within it, when the block is taller than its content; `.center` centres
its text too.

```pug
Slide.center              //- one statement, in the middle
  h2 One thing to remember
  p Nothing ships without a test.

Slide.bottom
  h2 Fine print
  p.small.muted At the bottom of the slide.
```

### The footer on one slide

`no-footer` hides the deck's footer on a slide, `with-footer` shows it, whatever the layout says:

```pug
Deck
  template(#footer="{ number, total }")
    span ACME · DevConf 2026
    span {{ number }} / {{ total }}

  Slide.with-footer(layout="cover")
    h1 Shown on this cover too
  Slide.no-footer
    h2 Not on this one
```

## A layout of your own

A layout is one CSS file in the project's `src/layouts` folder, named as the layout:
`src/layouts/quote.css` styles every `Slide(layout="quote")`. The Vite plugin loads every file of
the folder, after the library's layouts and before the themes, with nothing to import
([Vite plugin](../reference/vite-plugin.md)). A file named like a library layout
(`src/layouts/cover.css`) replaces it: the library's is not loaded.

The slide is already in its parts (`.ar-header`, `.ar-body`, an `.ar-zone-<name>` per named
template, `.ar-footer`); the layout's CSS arranges them, under `.layout-<name>`. Its tokens follow
the library's convention, `--ar-layout-<name>-<thing>`, each with its default, so that a theme
can change them. A default that is another token (`--ar-accent`, `--ar-title`) must be resolved on
the slide, not at `:root` (`var()` is resolved where it is declared: a theme's `--ar-accent` would
never reach it), so the file resolves each public token into a private one in a
`:where(.layout-<name>)` block, and its rules read the private ones. A layout that moves the
slide's padding onto its zones (as `image-*` do) keeps them clear of the footer the same way:
`padding-bottom: max(var(--ar-pad-y), var(--ar-footer-height))`.

```css
/* src/layouts/quote.css: one big quote, centred on the slide, its author under it
     --ar-layout-quote-size     the quote's size             .8 x --ar-title
     --ar-layout-quote-mark     the opening mark's colour    --ar-accent
     --ar-layout-quote-footer   the deck's footer            none */
:where(.layout-quote) {
  --_ar-quote-size: var(--ar-layout-quote-size, calc(var(--ar-title) * .8));
  --_ar-quote-mark: var(--ar-layout-quote-mark, var(--ar-accent));
  --_ar-quote-footer: var(--ar-layout-quote-footer, none);
}
.layout-quote { justify-content: safe center; }       /* the slide is a column: centre it */
.layout-quote > .ar-body { flex: none; }              /* the body as tall as its content */
.layout-quote blockquote { margin: 0 0 .6em; font-size: var(--_ar-quote-size); line-height: 1.15; }
.layout-quote blockquote::before { content: '“'; color: var(--_ar-quote-mark); }
.layout-quote > .ar-footer { display: var(--_ar-quote-footer); }
```

```pug
Slide(layout="quote")
  blockquote Simplicity is prerequisite for reliability.
  p.muted Edsger W. Dijkstra
```

Its tokens are its slides' attributes ([Layout parameters](#layout-parameters)): the Vite plugin
finds them in the file, every `--ar-layout-quote-<thing>` it declares or reads (comments and the
private `--_ar-…` aside), so `quote.css` gives `Slide(layout="quote" size="64px" mark="gold")`,
typed for the editor ([Layouts in the editor](#layouts-in-the-editor)). Name a token's last part
as an attribute: lower-case kebab-case, and none a slide already has. `--ar-layout-quote-title`
is no attribute (`title` is HTML's): the plugin warns, once, naming the file, and the token works
in `style` and in themes only; `--ar-layout-quote-title-size` is one. A file that replaces a
library layout replaces its parameters too: the slide's attributes are the new file's tokens.
Adding, removing or renaming a token while the dev server runs reloads the page.

The library's own files, in the package's `layouts/` folder, are worked examples: `cover.css`
and `section.css` centre their content, `split.css` and `image-right.css` lay the slide out as a
grid and place its zones.

### Layouts in the editor

`Slide` is typed with the layouts there are and their parameters: in a TypeScript project the
editor (Volar) completes the names in `layout`, and, once one is given, that layout's parameters
among the slide's attributes (`columns` on `layout="image-right"`, not on `layout="cover"`).
`vue-tsc` turns down a name that is none (`layout="covr"`: `Type '"covr"' is not assignable to
type 'keyof LibraryLayouts | keyof ProjectLayouts | undefined'`), and a parameter of another layout (`Slide(layout="cover"
columns="2fr 1fr")`: `'columns' does not exist in type …`) or a value that is not a string. The
library's come with the package; the project's are added by the Vite plugin, which writes them
into `src/arao-layouts.d.ts`, where the `tsconfig` of a Vite project already looks (`src/**`):

```ts
// src/arao-layouts.d.ts: Generated by araojs/vite … Do not edit …
export {}
declare module 'araojs' {
  interface ProjectLayouts {
    'quote': {
      /** --ar-layout-quote-footer */
      footer?: string
      /** --ar-layout-quote-mark */
      mark?: string
      /** --ar-layout-quote-size */
      size?: string
    }
  }
}
```

- A parameter of another layout is an error only where unknown attributes are: with
  `"vueCompilerOptions": { "strictTemplates": true }` (or `"checkUnknownProps": true`) in the
  `tsconfig`. Without it Vue's type check lets any attribute through, on `Slide` as on any
  component; the editor still completes only the layout's own.
- Parameters are typed in camelCase (`footerBg`): Volar checks an attribute written `footer-bg`
  as `footerBg`, as it does any prop, and completes it in the case your editor's settings say
  (kebab-case in templates, by default).
- `SlideLayouts`, exported by `araojs`, is every layout (its keys, `keyof SlideLayouts`) with its
  parameters (`SlideLayouts['cover']`): the library's, with the project's over them.
  `ProjectLayouts`, also exported, is the project's, which the file adds to; a project layout
  named like a library one replaces it there, its parameters with it.
- It is written when Vite starts (`npm run dev`, `npm run build`) and again when a layout file
  changes during development, only if its text changes, once the project has a layout of its own.
  Commit it, so that a type check (`vue-tsc --noEmit`, in CI) knows the project's layouts without
  running Vite first. A file written by an earlier Arao (with `interface SlideLayouts` in it) is
  rewritten the next time Vite starts.
- A `tsconfig` that does not include `src/**` needs the file in its `include`, or the file moved
  where it looks: `arao({ dts: 'types/arao-layouts.d.ts' })`. `arao({ dts: false })` writes none
  ([Vite plugin](../reference/vite-plugin.md)).
- A layout chosen from data (`:layout="s.layout"`, with `s.layout` a `string`) fails the type check:
  type the data with the names, `keyof SlideLayouts` (`import type { SlideLayouts } from 'araojs'`), or
  cast it: `:layout="s.layout as keyof SlideLayouts"`. A slide whose layout may be any of
  several takes the parameters of any of them.
- Turning `dts` off or moving it leaves the old file behind, still accepting its names: delete it.
- A name with no file of its own (a class a theme styles, `layout="wide"`) still works at
  runtime; for the type check to take it, declare it the same way in a `.d.ts` of the project,
  with no parameters: `declare module 'araojs' { interface ProjectLayouts { wide: {} } }`.
- Pug templates are type-checked only with Volar's Pug plugin
  ([Components](../reference/components.md), "In TypeScript").

## Lists and tables

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
