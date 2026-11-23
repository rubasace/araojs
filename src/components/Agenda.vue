<!-- The talk's agenda: an ordered list of the titles of the deck's section slides
     (Slide(layout="section")), in their order, written once and kept up to date by the deck, in
     big numbered rows. It goes in any slide, typically one of the default layout:
       Slide
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
     talk's progress on each. Its look is its own, whatever the layout (the style below: its rows,
     its numbers in the accent, a set of --ar-agenda-* tokens per state, which a theme or a slide
     can make the same to show no state). A hand-written ol with the class agenda gets the same
     rows and numbers, with no state.
     Its titles are the sections' (state/stage.ts titleIn: their first heading), as useDeck().slides
     lists them, in every drawing of the deck: the audience's, the presenter's (current and
     preview: each seen from its own copy of the slide), the export, a thumbnail. Outside a slide it
     warns and draws nothing; in development, a deck with no section slide warns too (the list is
     empty), once the deck has mounted, from the audience's or the presenter's copy only. -->
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
import { computed, onMounted } from 'vue'
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
// no section to list: said once mounted (every slide of the deck has registered by then), in one
// copy of the deck (not the presenter's preview, nor a thumbnail)
onMounted(() => {
  if (import.meta.env.DEV && inSlide && !sections.value.length && deck.role !== 'preview' && deck.role !== 'thumbnail')
    console.warn('[arao] Agenda lists the deck\'s section slides, Slide(layout="section"), and the deck has none: it is empty')
})
</script>

<style>
/* Its look, in any slide: big rows, numbered in the accent, each state its own. Tokens,
   --ar-agenda-<thing>, each with its default (a theme sets them, the project's :root, one slide in
   its style: Slide(style="--ar-agenda-done-opacity: 1"), or the Agenda itself):
     --ar-agenda-size                  the rows' size (0.65 x --ar-title)
     --ar-agenda-gap                   the space between rows (.35em)
     --ar-agenda-number-color          the numbers' colour (--ar-accent)
     --ar-agenda-done-color            a part already given: its colour (--ar-muted at 80 %)
     --ar-agenda-done-number-color     its number's colour (its colour)
     --ar-agenda-done-opacity          its opacity (1)
     --ar-agenda-done-weight           its font weight (400)
     --ar-agenda-current-color         the next part, the one this slide leads to (--ar-accent)
     --ar-agenda-current-number-color  its number's colour (--ar-agenda-number-color)
     --ar-agenda-current-opacity       its opacity (1)
     --ar-agenda-current-weight        its font weight (700)
     --ar-agenda-upcoming-color        the parts after it (currentColor)
     --ar-agenda-upcoming-number-color their numbers' colour (--ar-agenda-number-color)
     --ar-agenda-upcoming-opacity      their opacity (1)
     --ar-agenda-upcoming-weight       their font weight (400)
   Each is read here, never declared: one set anywhere above the list (a theme, a slide) reaches
   it; their defaults are other tokens, resolved on the list (--_ar-agenda-…), so they follow the
   theme it is drawn in. A done part is dimmed by its colour, the muted one made lighter (not by
   its opacity: the default keeps 3:1 on every built-in theme, its number too). The same values for
   the three states show no state at all:
     --ar-agenda-done-color: currentColor;
     --ar-agenda-done-number-color: var(--ar-accent);
     --ar-agenda-current-color: currentColor;
     --ar-agenda-current-weight: 400;
   A section (layouts/section.css) sets them for its slides: there the accent is the background.
   A hand-written ol.agenda shares the rows and the numbers (its items have no state). The rules
   are under .ar-slide, (0,2,1) for the list: a rule for every list of a slide (.ar-slide ol,
   (0,1,1)) leaves the agenda as it is, but one as specific loaded after this file wins over it,
   a layout's, a theme's or the project's (.layout-x .ar-body ol, .ar-slide .ar-agenda).
   Its size is a token, a part of --ar-title, not of the body's text: Slide.fit does not shrink
   it (an agenda that does not fit is said to be one Slide.fit cannot shrink: a smaller
   --ar-agenda-size, or fewer sections). */
:where(.ar-agenda, ol.agenda) {
  --_ar-agenda-size: var(--ar-agenda-size, calc(var(--ar-title) * .65));
  --_ar-agenda-gap: var(--ar-agenda-gap, .35em);
  --_ar-agenda-number: var(--ar-agenda-number-color, var(--ar-accent));
  --_ar-agenda-done-color: var(--ar-agenda-done-color, color-mix(in srgb, var(--ar-muted) 80%, transparent));
  --_ar-agenda-done-number: var(--ar-agenda-done-number-color, var(--_ar-agenda-done-color));
  --_ar-agenda-done-opacity: var(--ar-agenda-done-opacity, 1);
  --_ar-agenda-done-weight: var(--ar-agenda-done-weight, 400);
  --_ar-agenda-current-color: var(--ar-agenda-current-color, var(--ar-accent));
  --_ar-agenda-current-number: var(--ar-agenda-current-number-color, var(--_ar-agenda-number));
  --_ar-agenda-current-opacity: var(--ar-agenda-current-opacity, 1);
  --_ar-agenda-current-weight: var(--ar-agenda-current-weight, 700);
  --_ar-agenda-upcoming-color: var(--ar-agenda-upcoming-color, currentColor);
  --_ar-agenda-upcoming-number: var(--ar-agenda-upcoming-number-color, var(--_ar-agenda-number));
  --_ar-agenda-upcoming-opacity: var(--ar-agenda-upcoming-opacity, 1);
  --_ar-agenda-upcoming-weight: var(--ar-agenda-upcoming-weight, 400);
}

/* the list: big rows, one after the other */
.ar-slide :is(.ar-agenda, ol.agenda) {
  list-style: none;
  margin: 0; padding: 0;
  counter-reset: ar-agenda;
  display: flex; flex-direction: column; gap: var(--_ar-agenda-gap);
  font-size: var(--_ar-agenda-size);
  line-height: 1.2;
}
.ar-slide :is(.ar-agenda, ol.agenda) > li {
  counter-increment: ar-agenda;
  display: flex; align-items: baseline; gap: .6em;
  margin: 0;
}
/* its numbers, in the accent */
.ar-slide :is(.ar-agenda, ol.agenda) > li::before {
  content: counter(ar-agenda, decimal-leading-zero);
  flex: none;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--_ar-agenda-number);
}
/* each state its own look (Agenda's items only) */
.ar-slide .ar-agenda > .ar-agenda-done {
  color: var(--_ar-agenda-done-color); opacity: var(--_ar-agenda-done-opacity); font-weight: var(--_ar-agenda-done-weight);
}
.ar-slide .ar-agenda > .ar-agenda-current {
  color: var(--_ar-agenda-current-color); opacity: var(--_ar-agenda-current-opacity); font-weight: var(--_ar-agenda-current-weight);
}
.ar-slide .ar-agenda > .ar-agenda-upcoming {
  color: var(--_ar-agenda-upcoming-color); opacity: var(--_ar-agenda-upcoming-opacity); font-weight: var(--_ar-agenda-upcoming-weight);
}
/* and its number (more specific than the numbers' rule above) */
.ar-slide .ar-agenda > li.ar-agenda-done::before { color: var(--_ar-agenda-done-number); }
.ar-slide .ar-agenda > li.ar-agenda-current::before { color: var(--_ar-agenda-current-number); }
.ar-slide .ar-agenda > li.ar-agenda-upcoming::before { color: var(--_ar-agenda-upcoming-number); }
</style>
