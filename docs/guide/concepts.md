# Concepts

The handful of ideas the rest of the docs builds on.

## A deck is a Vue file

A deck is one file, `src/decks/<Name>.vue`, opened at `/<name>`. Its template holds one `Deck`;
inside it go the slides, in the order they are written, and the addons (`ProgressBar`,
`SlideNumber`), which sit inside `Deck` but outside every slide and draw over all of them.
Slides are components: anything Vue can do, a slide can do, and a component of your own is a
slide piece like any other ([Extending](extending.md)).

```pug
Deck(duration="30m")      //- the deck: canvas, keys, URL, presenter view, export
  ProgressBar             //- an addon, drawn over every slide
  Slide(layout="cover")   //- slide 1
    h1 My talk
  Slide                   //- slide 2
    h2 One idea
    p Said once.
```

`Deck`, `Slide`, `Img`, `Icon`, `Snippet`, `Notes`, `Cols`, `Rows`, `Grid`, `Center`, `v-step`
and `v-step-from` are registered globally. Addons and composables are imported from `'araojs'`.

## One fixed canvas

Every slide is drawn on one canvas of a fixed size, **1920x1080 px** by default
(`Deck(:width="…" :height="…")` sets another), and the whole canvas is scaled to the window with
a CSS transform. Every size written in a slide is canvas px, so your laptop, the projector, the
presenter view and the PDF all show the same slide, with the same line breaks. No `vw`, `vh` or
media queries inside slides: the canvas keeps its size whatever the window, only its scale
changes.

## Three zones

A content slide is a header (the `h1`/`h2` it starts with), a body (everything else, centred
vertically by default) and the deck's footer. Nothing to declare: the slide finds them
([Zones](slides-and-layouts.md#zones-header-body-footer)).

## Steps are absolute

`v-step="3"` means "from step 3 of this slide", not "after the previous element". Step 1 is what
shows when the slide arrives, and a slide counts its own steps: the largest one inside it
([Steps](steps.md)).

## Themes are tokens

Slides say *what*, themes say *how it looks*. A theme is a block of `--ar-*` CSS variables over
the defaults, in a file of `src/themes`, found on its own. Same slides, another venue: only the
theme changes, even live while presenting ([Themes](themes.md)). Layouts are props, so a deck
needs little or no CSS of its own.

## Pug or HTML

A deck's template is a plain Vue template, in either syntax; each file picks its own. Pug
(`<template lang="pug">`) is the recommended one, for brevity, and the plugin brings it along.
HTML (`<template>`) is Vue's own and needs nothing. Components, props, slots, directives and the
attribute rules below are the same in both: `Slide(layout="split")` is `<Slide layout="split">`,
`p.muted Text` is `<p class="muted">Text</p>`, `template(#left)` is `<template #left>`, and a
component with no content may close itself. A split slide, in HTML:

```vue
<template>
  <Deck :themes="['default']">
    <Slide layout="split">
      <h2>Before and after</h2>
      <template #left>
        <h3>Before</h3>
        <p class="muted">Every team rolled its own.</p>
      </template>
      <template #right>
        <h3 v-step="2">After</h3>
        <Snippet file="Starter.java" :highlights='{ "2-3": 2 }' :line-numbers="false" />
      </template>
    </Slide>
  </Deck>
</template>
```

A plain attribute is a string (`gap="sm"`); a `:`-bound one is a JavaScript expression
(`:themes="['default']"`, `:size="36"`, `:line-numbers="false"`). Object props are written as
JSON in single quotes: `:highlights='{ "2-3": 2 }'`. The same rule holds in Pug and in HTML.
