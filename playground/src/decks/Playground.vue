<!-- For developing the library (npm run dev): one slide per moving part, every library layout
     among them. The real decks live in the slides projects that use the library. -->
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

  //- the deck's sections, from the slides of layout section, each marked from here
  Slide(layout="agenda")
    h2 Agenda
    Agenda

  Slide(layout="section")
    h1 Layouts

  Slide.center
    h2 A centred body
    h3 A subtitle: the h3 right after the title
    p The body starts under the title on every slide; .center centres it both ways.
    p.muted .bottom puts it at the bottom, .top back at the top.

  Slide(layout="grid")
    h2 A grid of blocks
    div(v-for="(f, i) in features" :key="f.icon" v-step="i + 1")
      Icon(:name="f.icon")
      h3 {{ f.name }}
      p {{ f.what }}

  Slide(layout="split" divider="2px solid color-mix(in srgb, currentColor 20%, transparent)")
    h2 Two sides
    div
      h3 #[Icon(name="lucide:git-fork")] Before
      ul
        li Every team rolled its own
        li Twelve ways to log
    div(v-step="2")
      h3 #[Icon(name="lucide:package-check")] After
      ul
        li One starter for all
        li One version to bump

  Slide(layout="quote")
    blockquote Simplicity is prerequisite for reliability.
    cite Edsger W. Dijkstra

  Slide(layout="statement")
    h2 90 %
    p of the slides of a talk are a title and three points

  Slide(layout="overlay")
    Background(src="cies.svg")
    h2 Text over a picture
    p The overlay layout: a Background, a scrim, the text in a corner.

  Slide(layout="caption")
    h2 A picture and its caption
    figure
      Img(file="cies.svg" alt="The Cíes islands at dusk")
      figcaption The Cíes islands, drawn in flat bands

  Slide(layout="image-right" columns="3fr 2fr")
    template(#image)
      Img(file="shapes.svg" alt="Shapes")
    h2 A picture
    p It fills its side edge to edge, top to bottom; the footer stays, over it.

  Slide(layout="agenda")
    h2 Where we are
    Agenda

  Slide(layout="section")
    h1 Building blocks

  Slide
    h2 A snippet
    Snippet(file="Hello.java" :highlights='{ "4": 2, "5:println": 3 }')

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

  //- a slide of the project's own: a component that wraps Slide (src/slides/WrappedSlide.vue)
  WrappedSlide
    h2 A slide in a component
    p(v-step="2") It counts as a slide: its place, its title, its steps, its page.

  Slide.no-footer
    h2 #[Icon(name="lucide:shapes")] Icons
    Grid(cols="3" gap="lg")
      Center(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
        Icon(:name="t.icon" size="120" :label="t.label")
        p {{ t.label }}

  Slide(layout="epigraph" size="48px")
    h2 A layout of the project's own
    blockquote A layout is a CSS file: this one is src/layouts/epigraph.css.
    p The playground
    p Its doc block, its tokens and its parameters work as the library's do.

  Slide.with-footer(layout="section")
    h1 The end
</template>

<script setup>
import { ProgressBar, SlideNumber } from 'araojs'
import WrappedSlide from '../slides/WrappedSlide.vue'

// written out here, so the Vite plugin finds and builds in these icons
const tech = [
  { icon: 'simple-icons:vuedotjs', label: 'Vue' },
  { icon: 'simple-icons:vite', label: 'Vite' },
  { icon: 'lucide:rocket', label: 'Launch' },
]

const features = [
  { icon: 'lucide:file-code', name: 'One Vue file', what: 'Slides as components' },
  { icon: 'lucide:monitor', name: 'Any screen', what: 'One canvas, scaled' },
  { icon: 'lucide:printer', name: 'And a PDF', what: 'Every step a page' },
  { icon: 'lucide:palette', name: 'Themes', what: 'Tokens, not stylesheets' },
  { icon: 'lucide:presentation', name: 'Presenter view', what: 'Notes, timer, next step' },
]

const zones = [
  { name: 'Header', what: 'The heading the slide starts with, and its subtitle' },
  { name: 'Body', what: 'Everything else, from the top unless the slide or the theme says otherwise' },
  { name: 'Footer', what: 'The deck’s #footer, on every slide but covers and sections' },
]
</script>

<style scoped>
/* classes on a Background go on what it draws, scoped styles included */
.tint { background: rgb(0 0 0 / .08); }
.wash { background: linear-gradient(transparent 60%, color-mix(in srgb, var(--ar-accent) 25%, transparent)); }
</style>
