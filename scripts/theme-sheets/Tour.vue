<!-- The deck scripts/theme-sheets.mjs draws in every built-in theme: one slide per thing a theme
     styles (a cover, a footer, bullets, a section, code, a table, a picture, columns, cards, two
     zones, a small code window). It
     lists no themes, so it offers every one there is. -->
<template lang="pug">
Deck
  ProgressBar
  template(#footer="{ number, total }")
    span ACME · DevConf 2026
    span {{ number }} / {{ total }}

  Slide(layout="cover")
    .bar
    h1 Building a framework
    p.muted Jane Doe · VigoJUG 2026

  Slide
    h2 What we wanted
    ul
      li Same defaults in every service
      li Logging and metrics #[strong for free]
      li Upgrades in one place
      li.muted(v-step="2") Nothing to copy and paste

  Slide(layout="section")
    h1 Why a framework?

  Slide
    h2 A debug filter
    Snippet(file="DebugFilter.java" :highlights='{ "6-8:isDebug+++MDC.put": 2 }')

  Slide
    h2 Pace
    table
      thead
        tr
          th Period
          th Merged
          th Services
      tbody
        tr(v-for="r in rows" :key="r[0]")
          td(v-for="c in r" :key="c") {{ c }}

  Slide(layout="image-right" ratio="3 2")
    template(#image)
      Img(file="cies.svg" alt="The Cíes islands at dusk")
    h2 One picture, one idea
    p The picture fills its side, edge to edge.
    p.muted The text side is padded like any slide.

  Slide
    h2 Three pillars
    Cols(gap="lg")
      div(v-for="p in pillars" :key="p.title")
        h3 #[Icon.accent(:name="p.icon")] {{ p.title }}
        p.muted {{ p.text }}

  Slide
    h2 What it brings
    Grid(cols="3" gap="md")
      .card(v-for="c in cards" :key="c")
        span {{ c }}

  Slide(layout="split")
    h2 Before and after
    template(#left)
      h3 Before
      p.muted Every team rolled its own.
    template(#right)
      h3 After
      p One starter, one version.

  Slide
    h2 Try it
    Cols(ratio="1 1" align="center" gap="lg")
      div
        p Three commands, and the deck is live.
        p.muted It reloads as you type.
      Snippet(code="npm install\nnpm run dev\nnpm run export" lang="bash" name="terminal" fit :line-numbers="false")

  Slide(layout="cover" :footer="true")
    h1 Thank you
    p.muted Questions? · #[code janedoe.dev]
</template>

<script setup>
import { ProgressBar } from 'araojs'

const rows = [
  ['2024 Q1', '41', '12'],
  ['2024 Q2', '58', '19'],
  ['2024 Q3', '73', '27'],
  ['2024 Q4', '96', '34'],
]
const pillars = [
  { icon: 'lucide:scroll-text', title: 'Logging', text: 'MDC, JSON, levels' },
  { icon: 'lucide:gauge', title: 'Metrics', text: 'Micrometer, tags' },
  { icon: 'lucide:plug', title: 'Clients', text: 'RestTemplate, WebClient' },
]
const cards = ['Logging', 'Metrics', 'Tracing', 'Clients', 'Errors', 'Security']
</script>

<style scoped>
.accent { color: var(--ar-accent); }
.card {
  display: grid; place-items: center;
  border-radius: var(--ar-radius);
  background: color-mix(in srgb, var(--ar-fg) 7%, var(--ar-bg));
  border-left: 8px solid var(--ar-accent);
  font-size: 40px;
}
code { font-family: var(--ar-font-mono); font-size: .9em; }
</style>
