# Composition

Two levels, and no CSS at either. A slide's **structure** is its layout: two sides, a grid of
blocks, a picture beside the text ([Slides and layouts](slides-and-layouts.md)). **Inside a block**
(the body, a side of `split`, a block of `grid`, a zone) a few utility classes arrange and mark
things: an icon beside its text, a code block beside a list, a word marked. They read the theme's
tokens, so a theme restyles them.

The rule: when columns or rows are the whole slide, that is a layout. The classes are for what
goes inside one block. `npx arao layouts` lists both: every layout, then every class, each
described.

## The slide's structure: a layout

<!-- example:grid -->

```vue
<template lang="pug">
Deck
  Slide(layout="grid" cards="color-mix(in srgb, var(--ar-fg) 6%, var(--ar-bg))" icon-size="88px")
    h2 Five pillars
    div(v-for="(p, i) in pillars" :key="p.icon" v-step="i + 1")
      Icon(:name="p.icon")
      h3 {{ p.name }}
</template>

<script setup>
const pillars = [
  { icon: 'lucide:scroll-text', name: 'Logging' },
  { icon: 'lucide:gauge', name: 'Metrics' },
  { icon: 'lucide:waypoints', name: 'Tracing' },
  { icon: 'lucide:plug', name: 'Clients' },
  { icon: 'lucide:shield-check', name: 'Security' },
]
</script>
```

<!-- /example -->

![The grid example, at its last step](../assets/shots/grid.png)

`grid` balances its rows by the number of blocks: 5 are 3 + 2, the last row centred.

| The slide is | Its layout |
|---|---|
| two sides, side by side (before and after, text and code) | `split`; uneven: `columns="2fr 1fr"` |
| blocks in rows: features, pillars, a team, logos, cards | `grid`; `columns`, `rows`, `cards`, `icon-size`, `align` |
| a picture beside the text | `image-left`, `image-right` |
| a picture and its caption | `caption` |
| text over a picture | `overlay` |
| a quote; one phrase or figure | `quote`; `statement` |
| one thing in the middle | `Slide.center`, or `statement` |

## Inside a block: utility classes

<!-- example:utilities -->

```vue
<template lang="pug">
Deck
  Slide(layout="split")
    h2 Inside a block
    div
      h3 A row, a stack
      .stack
        .row
          Icon.accent(name="lucide:ruler" size="120")
          .stack.gap-sm.grow
            p.text-lg An icon or a picture beside its text
            p.text-sm.muted .row around them, .grow on the text
        p Mark a #[span.highlight word], or say it in #[span.accent the accent].
    div(v-step="2")
      h3 Code beside a list
      .cols.grow.middle(style="--ar-cols: 3fr 2fr")
        Snippet(code="npm install\nnpm run dev" lang="bash" name="terminal" fit :line-numbers="false")
        ul.text-sm
          li Each in its column
          li.muted Centred top to bottom
</template>
```

<!-- /example -->

![The utilities example, at its last step](../assets/shots/utilities.png)

| Group | Classes |
|---|---|
| Placement | `cols` (one column per child; uneven: `style="--ar-cols: 2fr 1fr"`), `cols-2`, `cols-3`, `cols-4` (filled row by row), `rows` (`--ar-rows`), `stack`, `row` |
| Alignment | `top`, `middle`, `bottom`, `center` (both ways, its text too) |
| Spacing | `gap-sm`, `gap`, `gap-lg` |
| Size | `grow`, `text-sm`, `text-lg`, `text-xl` |
| Colour and marks | `accent`, `muted`, `highlight`, `upper` |

Each one, and the classes of a `Slide` itself (`top`, `middle`, `center`, `bottom`,
`no-footer`, `with-footer`): [Utility classes](../reference/components.md#utility-classes).

- A placement class is as tall as its content; `grow` makes it fill the rest of its container. A
  `Snippet`, or an `Img` that should fill, needs that box: `.cols.grow` around them.
- Put the placement classes on an element of yours inside the block: a layout lays out its own
  blocks (a `.row` written on a side of `split` stays a column). Alignment, gaps, sizes and
  colours work on a layout's blocks too (`div.middle` as a side of `split`).
- In columns and rows a child is never wider than its track: what is wider is clipped at its edge,
  never painted over its neighbour. A child collapsed by `v-step.collapse` frees its track.
- The sizes, colours and the marker win over what a layout or a theme sets on the same element:
  `p.accent` in a block of `grid` is the accent, though the block's text is muted.

## From Cols, Rows, Grid and Center

These four components are gone: a slide's columns are a layout, and what was inside a block is a
class.

| Before | Now |
|---|---|
| `Cols` of two sides, the whole slide | `Slide(layout="split")`, a `div` per side; `ratio="2 1"` → `columns="2fr 1fr"`; `gap` → `gap="…"` |
| `Cols` of three or more blocks, the whole slide | `Slide(layout="grid")`, a `div` per block; `align="start"` for text columns |
| `Grid(cols="3")` / `Grid(ratio="2:1")` of cards or icons, the whole slide | `Slide(layout="grid")` (rows balanced by count, last one centred); `columns="3"`; `cards="…"` for a background |
| `Cols` inside a block | `.cols`; `ratio="2 1"` → `style="--ar-cols: 2fr 1fr"` |
| `Grid(cols="3")` inside a block | `.cols-3` (`cols-2`, `cols-4`) |
| `Rows(ratio="auto 1")` | `.stack` with `.grow` on what fills, or `.rows(style="--ar-rows: auto 1fr")` with a height (`.grow`) |
| `Center` | `.center`; around a picture with a size, `.stack.center`; around a `Snippet`, nothing (it centres its window) |
| `align="start"` / `"center"` / `"end"` | `.top` / `.middle` / `.bottom` on the columns (or on a side of `split`) |
| `gap="sm"` / `"md"` / `"lg"` | `.gap-sm` / `.gap` / `.gap-lg` (the classes' gap is `md`) |
| `.small` | `.text-sm` |
