<!-- For developing the library (npm run dev): one slide per moving part. The real decks live in
     the slides projects that use the library. -->
<template lang="pug">
Deck(:themes="['default', 'vigojug']")
  ProgressBar
  SlideNumber

  Slide(layout="cover" title="Playground")
    .bar
    h1 Phoenyx playground
    p.muted The library's source, served as a slides project

  Slide
    h2 Steps
    ul
      li From the start
      li(v-step="2") From step 2
      li(v-step="3") From step 3
    Notes
      p Notes show in the presenter view.

  Slide(title="A snippet")
    h2 A snippet
    Snippet(file="Hello.java" :highlights='{ "4": 2, "5:println": 3 }')

  Slide(layout="image-right" ratio="3 2")
    template(#image)
      Img(file="shapes.svg" alt="Shapes")
    h2 A picture
    p It fills its side edge to edge.

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
    h2 #[Icon(name="lucide:shapes")] Icons
    Grid(cols="3" gap="lg")
      Center(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
        Icon(:name="t.icon" size="120" :label="t.label")
        p {{ t.label }}

  Slide(layout="section")
    h1 The end
</template>

<script setup>
import { ProgressBar, SlideNumber } from 'phoenyxjs'

// written out here, so the Vite plugin finds and builds in these icons
const tech = [
  { icon: 'simple-icons:vuedotjs', label: 'Vue' },
  { icon: 'simple-icons:vite', label: 'Vite' },
  { icon: 'lucide:rocket', label: 'Launch' },
]
</script>
