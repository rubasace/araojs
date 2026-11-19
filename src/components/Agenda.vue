<!-- The talk's agenda: an ordered list of the titles of the deck's section slides
     (Slide(layout="section")), in their order, written once and kept up to date by the deck.
       Slide(layout="agenda")
         h2 Agenda
         Agenda
     Each item is marked with where the talk stands, seen from the slide the Agenda is on: its
     class ar-agenda-item, and one of
       ar-agenda-done       a section before that slide
       ar-agenda-current    the first section from that slide on (the slide itself, when it is a
                            section: an Agenda on each section shows that section as current);
                            it also carries aria-current="step"
       ar-agenda-upcoming   the sections after that one
     So the same Agenda written on several slides of the deck (after each section, say) shows the
     talk's progress on each. It has no look of its own: the agenda layout styles it
     (layouts/agenda.css: its rows, its numbers, a set of tokens per state, which a theme or a
     slide can make the same to show no state). On any other layout it is a plain ol.
     Its titles are the sections' (state/stage.ts titleIn: their first heading), as useDeck().slides
     lists them, in every drawing of the deck: the audience's, the presenter's (current and
     preview: each seen from its own copy of the slide), the export, a thumbnail. Outside a slide it
     warns and draws nothing. -->
<template>
  <ol class="ar-agenda" v-if="inSlide">
    <li
      v-for="s in sections"
      :key="s.index"
      :class="['ar-agenda-item', `ar-agenda-${s.state}`]"
      :aria-current="s.state === 'current' ? 'step' : undefined"
    >{{ s.title }}</li>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDeck } from '../state/deck'
import { useSlideIndex } from '../state/slide'

defineOptions({ name: 'Agenda' })

const deck = useDeck()
// the place of the slide it is on, in the drawing it is in
const here = useSlideIndex()
const inSlide = !!here
if (!inSlide) console.warn('[arao] Agenda used outside a <Slide>: it shows nowhere')

type State = 'done' | 'current' | 'upcoming'
// the section slides, each with its state as seen from this slide
const sections = computed(() => {
  const at = here?.value ?? -1
  const list = deck.slides.value.filter((s) => s.layout === 'section')
  const current = list.find((s) => s.index >= at)
  return list.map((s) => ({ ...s, state: (s.index < at ? 'done' : s === current ? 'current' : 'upcoming') as State }))
})
</script>
