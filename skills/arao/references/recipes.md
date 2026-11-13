# Recipes

Copy and adapt. Every recipe is Pug; translate to HTML tag by tag if the deck is HTML (see the
mental model in SKILL.md). Every prop and slot: `docs/reference/components.md`; `v-step`:
`docs/reference/directives.md`.

## Contents

- Skeleton (Pug and HTML)
- Title slide, section divider
- Bullet reveal, step variants, reusable steps
- Code walkthrough, inline code
- Image + text, background image
- Two columns, three columns, grids, centring
- Icons
- Speaker notes
- Body placement
- Footer with slide number
- Table

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
Slide(layout="cover" title="Opening")
  .bar
  h1 Building a framework
  p.muted Rubén Pahíno · VigoJUG 2026
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
Slide(title="A debug filter")
  h2 A debug filter
  Snippet(file="DebugFilter.java" :highlights='{ "2": 2, "8-10:isDebug+++MDC.put": 3 }')
```
Keys: `"4"`, `"4-7"`, `"1,10-14"`, optionally `:word+++word`. Inline code:
`Snippet(code="npm run dev" lang="bash" name="terminal" fit :line-numbers="false")`.

## Image + text
```pug
Slide(layout="image-right" ratio="3 2")
  template(#image)
    Img(file="demo/landscape.svg" alt="A landscape")
  h2 One picture, one idea
  p The picture fills its side edge to edge.
  p(v-step="2") The text side is padded like any slide.
```

## Two columns with a header
```pug
Slide(layout="split")
  h2 Before and after
  template(#left)
    h3 Before
    p Every team rolled its own.
  template(#right)
    h3(v-step="2") After
    p(v-step="2") One starter, one version.
```

## Three columns
```pug
Slide
  h2 Three pillars
  Cols(gap="lg")
    div
      h3 Logging
      p.muted MDC, JSON, levels
    div(v-step="2")
      h3 Metrics
      p.muted Micrometer, tags
    div(v-step="3")
      h3 Clients
      p.muted RestTemplate, WebClient
```
Uneven: `Cols(ratio="2 1")`. Grid of cards: `Grid(cols="3" gap="sm")`, or let the count decide:
`Grid(ratio="2:1")` (columns : rows; 5 cards → 3 + 2, last row centred). Centre something: `Center`.

## Icons (in text: as tall as the text; alone: `size` px)
```pug
Slide
  h2 #[Icon(name="lucide:rocket")] Getting started
  Grid(cols="3" gap="md")
    Center(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
      Icon(:name="t.icon" size="120" :label="t.label")
      p {{ t.label }}
```
with `const tech = [{ icon: 'simple-icons:vuedotjs', label: 'Vue' }, { icon: 'simple-icons:kubernetes', label: 'Kubernetes' }, { icon: 'simple-icons:openjdk', label: 'Java' }]`
in `<script setup>`. Accent colour: a class, `Icon.hot(name="lucide:flame")` and `.hot { color: var(--ar-accent); }`.

## Background image with opacity
```pug
Slide(bg="demo/city.svg" bg-opacity="0.25")
  h2 Built for the city
  p A photo behind the text, faded into the theme's background.
```
Also `bg-position="center 30%"`, `bg-blur="4"`, `bg-fit="contain"`; `bg` also takes a colour or a
gradient. Layered backgrounds: `template(#background)` with an `Img` and a tint element.

## Speaker notes
```pug
Slide
  h2 Pricing
  p(v-step="2") Three tiers
  Notes
    p Start with the story of the first customer.
    p(v-step="2") Tiers: say why there are exactly three.
```

## Body placement (centred by default; the heading always stays on top)
```pug
Slide
  h2 One idea
  p.lead Centred under the title, no CSS.

Slide(align="start")
  h2 A long list
  ul
    li Read from the top…
```

## Footer on every slide, with the slide number
```pug
Deck
  template(#footer="{ number, total }")
    span ACME · DevConf 2026
    span {{ number }} / {{ total }}

  Slide(layout="cover" :footer="true")
    h1 Shown on this cover too
  Slide(:footer="false")
    h2 Not on this one
```
A theme moves and colours it with tokens: `--ar-footer-align: flex-end`, `--ar-footer-color`,
`--ar-footer-size`, `--ar-footer-height`.

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

