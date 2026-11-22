# Recipes

Copy and adapt. Every recipe is Pug; translate to HTML tag by tag if the deck is HTML (see the
mental model in SKILL.md). Every prop and slot: `docs/reference/components.md`; `v-step`:
`docs/reference/directives.md`.

## Contents

- Skeleton (Pug and HTML)
- Title slide, section divider
- Bullet reveal, step variants, reusable steps
- Code walkthrough, inline code
- Image + text, background image, plain colour
- Two columns, three columns, grids; inside a block: utility classes
- Icons
- Speaker notes
- Body placement
- Footer with slide number
- Table
- A layout of your own

## Skeleton

```pug
<template lang="pug">
Deck(duration="30m")
  template(#footer="{ number, total }")
    span My talk · Conf 2026
    span {{ number }} / {{ total }}
  ProgressBar

  //- slides go here
</template>

<script setup>
import { ProgressBar } from 'araojs'
</script>
```

The same template in HTML (same `<script setup>`):

```vue
<template>
  <Deck duration="30m">
    <template #footer="{ number, total }">
      <span>My talk · Conf 2026</span>
      <span>{{ number }} / {{ total }}</span>
    </template>
    <ProgressBar />

    <!-- slides go here -->
  </Deck>
</template>
```

The slide number goes in the footer (`{{ number }} / {{ total }}`). The `SlideNumber` addon also
exists, for a deck without a footer; don't use both.

## Title slide
```pug
Slide(layout="cover")
  .bar
  h1 Building a framework
  p.muted Jane Doe · DevConf 2026
```

## Section divider
```pug
Slide(layout="section")
  h1 Why a framework?
```

## Bullet reveal (4 steps)
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

## Code walkthrough with highlights per step (3 steps: plain, line 2, then words on lines 8-10)
```pug
Slide
  h2 A debug filter
  Snippet(file="DebugFilter.java" :highlights='{ "2": 2, "8-10:isDebug+++MDC.put": 3 }')
```
Keys: `"4"`, `"4-7"`, `"1,10-14"`, optionally `:word+++word`. Inline code:
`Snippet(code="npm run dev" lang="bash" name="terminal" fit :line-numbers="false")`.

## Image + text
```pug
Slide(layout="image-right" columns="3fr 2fr")
  template(#image)
    Img(file="demo/landscape.svg" alt="A landscape")
  h2 One picture, one idea
  p The picture fills its side, full height, edge to edge.
  p(v-step="2") The text side is padded like any slide.
```
`image-left` mirrors it. The widths are a parameter, `columns` (`--ar-layout-image-right-columns`,
text then picture; `--ar-layout-image-left-columns`, picture then text; default `1fr 1fr`). The footer
shows over the picture: `.no-footer` hides it on one slide.

## Two sides with a header
```pug
Slide(layout="split")
  h2 Before and after
  div
    h3 Before
    p Every team rolled its own.
  div(v-step="2")
    h3 After
    p One starter, one version.
```
The body's two children are the sides. Uneven: `columns="2fr 1fr"`; `gap="96px"`; a line
between them: `divider="2px solid currentColor"`.

## Features, a quote, a figure, an agenda
The other library layouts read plain HTML; `npx arao layouts` shows each one's form and
parameters. The shapes, in short:
```pug
Slide(layout="grid")            //- each div a block; rows balanced by count
  h2 Ship a talk
  div
    Icon(name="lucide:monitor")
    h3 Any screen
    p One canvas, scaled
Slide(layout="quote")
  blockquote Simplicity is prerequisite for reliability.
  cite Edsger W. Dijkstra
Slide(layout="statement")
  h2 90 %
  p of our releases ship on a Friday
Slide(layout="overlay")
  Background(src="city.jpg")
  h2 Built for the city
Slide(layout="caption")
  figure
    Img(file="city.jpg" alt="The city")
    figcaption The city at night
Slide(layout="agenda")          //- the section slides' titles, done / current / upcoming
  h2 Agenda
  Agenda
```

## Three columns: the grid layout
When columns are the whole slide, that is a layout: `split` for two sides, `grid` for blocks.
```pug
Slide.top(layout="grid" align="start" text-size="1em")
  h2 Three pillars
  div
    h3 Logging
    p MDC, JSON, levels
  div(v-step="2")
    h3 Metrics
    p Micrometer, tags
  div(v-step="3")
    h3 Clients
    p RestTemplate, WebClient
```
Columns of text: `align="start"` (left-aligned), `text-size="1em"` (the slide's text size; a
block's `p` is a small muted caption by default) and `.top` (under the title; the rows are centred
otherwise). `grid` balances its rows by the number of blocks (5 → 3 + 2, the last row centred);
`columns="4"` fixes the count, `cards="color-mix(in srgb, var(--ar-fg) 6%, var(--ar-bg))"` gives
each block a background, `icon-size="96px"` sizes a block's leading icon. Two uneven sides:
`Slide(layout="split" columns="2fr 1fr")`.

## Inside a block: utility classes
```pug
Slide(layout="split")
  h2 Before and after
  div
    h3 Before
    .row
      Icon.accent(name="lucide:git-fork" size="96")
      p.grow Every team rolled its own
  div
    h3 After
    .cols.grow.middle(style="--ar-cols: 3fr 2fr")
      Snippet(file="App.java")
      ul.text-sm
        li One starter
        li.muted One version to bump
```
`.row` (side by side, centred on the line), `.stack` (one under another), `.cols` (a column per
child; uneven with `--ar-cols`), `.cols-2` / `-3` / `-4` (filled row by row), `.rows`; `.top`,
`.middle`, `.bottom`, `.center`; `.gap-sm`, `.gap`, `.gap-lg`; `.grow`; `.text-sm`, `.text-lg`,
`.text-xl`; `.accent`, `.muted`, `.highlight`, `.upper`. Each is as tall as its content: a
`Snippet` inside needs `.grow` on the columns. `npx arao layouts` describes every one.

## Icons (in text: as tall as the text; alone: `size` px)
```pug
Slide(layout="grid" icon-size="120px")
  h2 #[Icon(name="lucide:rocket")] Getting started
  div(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
    Icon(:name="t.icon" :label="t.label")
    h3 {{ t.label }}
```
with `const tech = [{ icon: 'simple-icons:vuedotjs', label: 'Vue' }, { icon: 'simple-icons:kubernetes', label: 'Kubernetes' }, { icon: 'simple-icons:openjdk', label: 'Java' }]`
in `<script setup>`. `grid` draws a block's leading icon at its `icon-size`, in the accent. Accent
colour elsewhere: `Icon.accent(name="lucide:flame")`.

## Background image with opacity
```pug
Slide
  Background(src="demo/city.svg" opacity="0.25")
  h2 Built for the city
  p A photo behind the text, faded into the theme's background.
```
`Background` goes anywhere in the slide and draws behind everything, edge to edge. `src` is a
file of `src/images/` or a URL. Also `position="center 30%"`, `blur="4"`, `fit="contain"`.
It replaces the theme's default background on that slide.

Layered: give it content instead of `src`; each element covers the slide, in order.
```pug
Slide
  Background
    Img(file="demo/city.svg" blur="6")
    .veil
  h2 A softened background
```
with `.veil { background: color-mix(in srgb, var(--ar-bg) 70%, transparent); }`. A video works the
same: `Background` → `video(src="/loop.mp4" autoplay muted loop)`.

## Plain colour or gradient (CSS on the slide, no component)
```pug
Slide(style="background: linear-gradient(135deg, #1d2b4a, #0f1115); --ar-slide-bg-image: none")
  h2 A gradient background
```
`--ar-slide-bg-image: none` drops the theme's own background picture, if any, which is drawn over
the slide's colour. For a colour used more than once, a class: `Slide.dark` with
`.dark { background: var(--ar-fg); color: var(--ar-bg); }`.

## Speaker notes
```pug
Slide
  h2 Pricing
  p(v-step="2") Three tiers
  Notes
    p Start with the story of the first customer.
    p(v-step="2") Tiers: say why there are exactly three.
```

## Body placement (from the top by default; the heading always stays on top)
```pug
Slide
  h2 A long list
  ul
    li Read from the top, right under the title…

Slide.center
  h2 One idea
  p.lead Centred both ways under the title, no CSS.
```
`.bottom` puts the body at the bottom, `.middle` centres it top to bottom (its text as it is),
`.top` back at the top (when a theme centres it with `--ar-body-align`). On a block inside the
slide (a side of `split`, a column of `.cols`) the same classes place its content within it;
`.center` also centres its text.

## Footer on every slide, with the slide number
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
Each layout decides whether it shows (covers and sections hide it, by a token:
`--ar-layout-cover-footer: flex` shows it on every cover); `.with-footer` and `.no-footer` win on
one slide. A theme moves and colours it with tokens: `--ar-footer-align: flex-end`,
`--ar-footer-color`, `--ar-footer-size`, `--ar-footer-height`.

## Table (styled by the theme's `--ar-table-*` tokens)
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

## A layout of your own (one CSS file, nothing to import)
`src/layouts/epigraph.css` styles `Slide(layout="epigraph")`: the plugin loads every file there, after
the library's layouts and before the themes; one named like a library layout (`cover.css`)
replaces it. Follow the library's convention (`node_modules/araojs/layouts/cover.css`): tokens
named `--ar-layout-<name>-<thing>`, each resolved with its default on the slide. Each token is
an attribute of the layout's slides, `<thing>` (below: `size`, `footer`); a `<thing>` a slide already
has as an attribute (`title`, `id`, `hidden`, `lang`, `class`, `style`, `key`, `layout`, `on-…`,
`data-…`, `aria-…`) is none and Vite warns: name it `title-size`, say. A file replacing a library
layout replaces its parameters too.
It starts with its doc block (always): the first line says what the layout is for, then
`@example` (a slide of it, in Pug), `@zone <name> <description>` per named template it places
(`.ar-zone-<name>`), `@param <thing> <description>` per token, its default said (`@param <thing>
{a|b|c} <description>` when it takes only those words: they become its type). `npx arao layouts`
prints it back, with any problem (a `@param` naming no token…); full rules:
`docs/guide/slides-and-layouts.md#its-doc-block`.
```css
/**
 * A slide that opens on an epigraph: a short quotation on the right, its source under it.
 * @example
 * Slide(layout="epigraph" size="48px")
 *   h2 Why we test
 *   blockquote Testing shows the presence of bugs, never their absence.
 *   p Edsger W. Dijkstra
 * @param size    the epigraph's size (default .45 x `--ar-title`)
 * @param footer  the deck's footer: `none` hides it, `flex` shows it (default `none`)
 */
:where(.layout-epigraph) {
  --_ar-epigraph-size: var(--ar-layout-epigraph-size, calc(var(--ar-title) * .45));
  --_ar-epigraph-footer: var(--ar-layout-epigraph-footer, none);
}
.layout-epigraph > .ar-body > blockquote {
  align-self: flex-end; max-width: 60%; margin: 0;
  font-size: var(--_ar-epigraph-size); font-style: italic;
}
.layout-epigraph > .ar-body > blockquote + p { align-self: flex-end; margin: .4em 0 1.2em; }
.layout-epigraph > .ar-footer { display: var(--_ar-epigraph-footer); }
```
```pug
Slide(layout="epigraph" size="48px")
  h2 Why we test
  blockquote Testing shows the presence of bugs, never their absence.
  p Edsger W. Dijkstra
```
The plugin also writes the project's layout names, parameters, zones and doc blocks into
`src/arao-layouts.d.ts`, so that in a TypeScript project the editor completes `layout` and that
layout's attributes and zones, shows their docs on hover, and `vue-tsc` rejects a name that is none,
a named template that is not one of the layout's zones (and, with `strictTemplates`, another
layout's attribute): it is generated (don't edit it), and committed like any source file.
What a slide renders, to style: `.ar-header` (its opening heading), `.ar-body` (the rest),
`.ar-zone-<name>` for each `template(#<name>)`, `.ar-footer`. Defaults that are other tokens go
in the `:where(.layout-<name>)` block, never at `:root` (there `var()` resolves once, and a
theme's `--ar-accent` would never reach it).
