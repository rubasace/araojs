<!-- For developing the library (npm run dev): one slide per moving part. The real decks live in
     the slides projects that use the library. -->
<template lang="pug">
Deck
  ProgressBar
  SlideNumber
  //- on every slide but the cover and the sections (the last one asks for it)
  template(#footer)
    span Arao · playground

  Slide(layout="cover" title="Playground")
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

  Slide(align="start")
    h2 Body from the top
    p The body is centred by default; align="start" reads it from the top.
    p.muted align="end" puts it at the bottom, over the footer.

  Slide(title="A snippet")
    h2 A snippet
    Snippet(file="Hello.java" :highlights='{ "4": 2, "5:println": 3 }')

  Slide(layout="image-right" ratio="3 2")
    template(#image)
      Img(file="shapes.svg" alt="Shapes")
    h2 A picture
    p It fills its side edge to edge, down to the footer.

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

  Slide
    h2 #[Icon(name="lucide:shapes")] Icons
    Grid(cols="3" gap="lg")
      Center(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
        Icon(:name="t.icon" size="120" :label="t.label")
        p {{ t.label }}

  Slide(layout="section" :footer="true")
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
  { name: 'Body', what: 'Everything else, centred unless align says otherwise' },
  { name: 'Footer', what: 'The deck’s #footer, on every slide but covers and sections' },
]
</script>
