<!-- For developing the library (npm run dev): one slide per moving part. The real decks live in
     the slides projects that use the library. -->
<template lang="pug">
Deck
  ProgressBar
  SlideNumber
  //- on every slide but the cover and the sections (the last one asks for it)
  template(#footer)
    span Arao · playground

  Slide(layout="cover")
    .bar
    h1 Arao playground
    p.muted The library's source, served as a slides project

  Slide
    h2 Steps
    ul
      li From the start
      li(v-step="2") From step 2
      li(v-step="3") From step 3
    Notes
      p Notes show in the presenter view.

  Slide.center
    h2 A centred body
    p The body starts under the title on every slide; .center centres it both ways.
    p.muted .bottom puts it at the bottom, .top back at the top.

  Slide
    h2 A snippet
    Snippet(file="Hello.java" :highlights='{ "4": 2, "5:println": 3 }')

  Slide(layout="image-right" style="--ar-layout-image-right-columns: 3fr 2fr")
    template(#image)
      Img(file="shapes.svg" alt="Shapes")
    h2 A picture
    p It fills its side edge to edge, top to bottom; the footer stays, over it.

  Slide
    Background(src="shapes.svg" opacity="0.15")
    h2 A background
    p Behind everything, edge to edge, wherever it is written in the slide.
    //- a tint from step 2 (v-step on it), a wash from step 3 (v-step around it)
    Background.tint(v-step="2")
    div(v-step="3")
      Background.wash

  Slide
    h2 Composition
    Cols(gap="lg")
      div
        h3 One
        p.muted First column
      div(v-step="2")
        h3 Two
        p.muted Second column

  Slide
    h2 A table
    table
      thead
        tr
          th Zone
          th What goes there
      tbody
        tr(v-for="(z, i) in zones" :key="z.name" v-step="i + 1")
          td {{ z.name }}
          td {{ z.what }}

  Slide.no-footer
    h2 #[Icon(name="lucide:shapes")] Icons
    Grid(cols="3" gap="lg")
      Center(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
        Icon(:name="t.icon" size="120" :label="t.label")
        p {{ t.label }}

  Slide(layout="quote")
    blockquote A layout is a CSS file: this one is the project's, src/layouts/quote.css.
    p.muted The playground

  Slide.with-footer(layout="section")
    h1 The end
</template>

<script setup>
import { ProgressBar, SlideNumber } from 'araojs'

// written out here, so the Vite plugin finds and builds in these icons
const tech = [
  { icon: 'simple-icons:vuedotjs', label: 'Vue' },
  { icon: 'simple-icons:vite', label: 'Vite' },
  { icon: 'lucide:rocket', label: 'Launch' },
]

const zones = [
  { name: 'Header', what: 'The heading the slide starts with' },
  { name: 'Body', what: 'Everything else, from the top unless the slide or the theme says otherwise' },
  { name: 'Footer', what: 'The deck’s #footer, on every slide but covers and sections' },
]
</script>

<style scoped>
/* classes on a Background go on what it draws, scoped styles included */
.tint { background: rgb(0 0 0 / .08); }
.wash { background: linear-gradient(transparent 60%, color-mix(in srgb, var(--ar-accent) 25%, transparent)); }
</style>
