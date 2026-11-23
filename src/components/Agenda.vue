<!-- The talk's agenda: an ordered list of the titles of the deck's section slides
     (Slide(layout="section")), in their order, written once and kept up to date by the deck, in
     big numbered rows. It goes in any slide, typically one of the default layout:
       Slide
         h2 Agenda
         Agenda
     Each item is marked with where the talk stands, seen from the slide the Agenda is on: its
     class ar-agenda-item, and one of
       ar-agenda-done       a section before the current one
       ar-agenda-current    the section the talk is in: the last section slide at or before the
                            Agenda's slide (the slide itself, when it is a section: an Agenda on
                            each section shows that section as current); it also carries
                            aria-current="step"
       ar-agenda-upcoming   the sections after the current one
     Before the first section (an Agenda on the opening slides) the talk is in none: no section is
     current, and every one is upcoming. So the same Agenda written on several slides of the deck
     (after each section slide, say) shows the talk's progress on each. Its props:
       highlight   false (:highlight="false") draws the plain list: no state class, no
                   aria-current (default true)
       current     the section shown as current, whatever the slide: its place among the
                   sections, 1-based (:current="2", or current="2" as Pug and HTML write it), or
                   its title (current="How it works", as useDeck().slides gives it: whitespace
                   collapsed); done and upcoming follow from it. One that names no section warns,
                   in development, and the slide's own rule applies. false (:current="false", or
                   current="false") marks the parts already given and highlights none as current:
                   the part the talk is in looks like those to come
     Its look is its own, whatever the layout (the style below: its rows, its numbers in the
     accent, a set of --ar-agenda-* tokens per state, which a theme or a slide can make the same to
     show no state). A hand-written ol with the class agenda gets the same rows and numbers, with
     no state, as does an Agenda with :highlight="false".
     Its titles are the sections' (state/stage.ts titleIn: their first heading), as useDeck().slides
     lists them, in every drawing of the deck: the audience's, the presenter's (current and
     preview: each seen from its own copy of the slide), the export, a thumbnail. Outside a slide it
     warns and draws nothing; in development, a deck with no section slide warns too (the list is
     empty), once the deck has mounted, from the audience's or the presenter's copy only, and so
     does a current that names no section. -->
<template>
  <ol class="ar-agenda" v-if="inSlide">
    <li
      v-for="s in sections"
      :key="s.index"
      :class="s.state ? ['ar-agenda-item', `ar-agenda-${s.state}`] : 'ar-agenda-item'"
      :aria-current="s.state === 'current' ? 'step' : undefined"
    >{{ s.title }}</li>
  </ol>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, type PropType } from 'vue'
import { useDeck } from '../state/deck'
import { useSlideIndex } from '../state/slide'
import type { DeckSlide } from '../state/stage'

defineOptions({ name: 'Agenda' })

const props = defineProps({
  // false: the plain list, no state class and no aria-current on its items
  highlight: { type: Boolean, default: true },
  // the section shown as current, whatever the slide: its place among the sections (1-based) or
  // its title
  // false (:current="false", or current="false"): the parts already given are marked, and no part
  // is highlighted as current (the one the talk is in looks like those to come)
  current: { type: [Number, String, Boolean] as PropType<number | string | false>, default: undefined },
})

const deck = useDeck()
// the place of the slide it is on, in the drawing it is in
const here = useSlideIndex()
const inSlide = !!here
if (!inSlide) console.warn('[arao] Agenda used outside a <Slide>: it shows nowhere')

// The section current names, by its place in the list: a number is its place, 1-based; a string
// is a title first (whitespace collapsed, as titles are), else, when it is a whole number, its
// place (current="2", as Pug and HTML write it). -1 for none: no prop, or one that names no
// section (which warns, below)
const named = (list: readonly DeckSlide[], current: number | string | undefined) => {
  if (current == null || current === '') return -1
  let place: number
  if (typeof current === 'string') {
    const title = current.replace(/\s+/g, ' ').trim()
    const k = list.findIndex((s) => s.title === title)
    if (k >= 0) return k
    if (!/^\d+$/.test(title)) return -1
    place = Number(title)
  } else place = current
  return Number.isInteger(place) && place >= 1 && place <= list.length ? place - 1 : -1
}

type State = 'done' | 'current' | 'upcoming'
const list = computed(() => deck.slides.value.filter((s) => s.layout === 'section'))
// current="false" / :current="false": no part highlighted as current
const noCurrent = computed(() => props.current === false || props.current === 'false')
const forced = computed(() => (noCurrent.value ? -1 : named(list.value, props.current as number | string | undefined)))
// the section slides, each with its state as seen from this slide (none with highlight off): the
// current one is the one current names, else the last section at or before this slide (none
// before the first section: every one upcoming); those before it done, those after it upcoming
const sections = computed(() => {
  const all = list.value
  if (!props.highlight) return all.map((s) => ({ ...s, state: null }))
  const at = here?.value ?? -1
  const k = forced.value >= 0 ? forced.value : all.findLastIndex((s) => s.index <= at)
  return all.map((s, i) => ({ ...s, state: (i < k ? 'done' : i === k && !noCurrent.value ? 'current' : 'upcoming') as State }))
})
// said once mounted (every slide of the deck has registered by then), in one copy of the deck
// (not the presenter's preview, nor a thumbnail): no section to list; and, once every slide has
// read its title (each does when it mounts, after this), a current that names none of them
onMounted(async () => {
  if (!import.meta.env.DEV || !inSlide || deck.role === 'preview' || deck.role === 'thumbnail') return
  if (!list.value.length) {
    console.warn('[arao] Agenda lists the deck\'s section slides, Slide(layout="section"), and the deck has none: it is empty')
    return
  }
  await nextTick()
  if (props.highlight && props.current != null && props.current !== '' && typeof props.current !== 'boolean' && !noCurrent.value && forced.value < 0)
    console.warn(`[arao] Agenda's current="${props.current}" names no section: a place from 1 to ${list.value.length}, or the title of one (${list.value.map((s) => `"${s.title}"`).join(', ')}); it marks them as seen from its slide`)
})
</script>

<style>
/* Its look, in any slide: big rows, numbered in the accent, each state its own. Tokens,
   --ar-agenda-<thing>, each with its default (a theme sets them, the project's :root, one slide in
   its style: Slide(style="--ar-agenda-done-opacity: 1"), or the Agenda itself, but its size):
     --ar-agenda-size                  the rows' size (0.65 x --ar-title): a length (px, em: the
                                       slide's text, or from the title's tokens), set in a theme,
                                       at :root or on the slide (not on the Agenda: below)
     --ar-agenda-gap                   the space between rows (.35em)
     --ar-agenda-number-color          the numbers' colour (--ar-accent)
     --ar-agenda-done-color            a part already given: its colour (--ar-muted at 80 %)
     --ar-agenda-done-number-color     its number's colour (its colour)
     --ar-agenda-done-opacity          its opacity (1)
     --ar-agenda-done-weight           its font weight (400)
     --ar-agenda-current-color         the part the talk is in (--ar-accent)
     --ar-agenda-current-number-color  its number's colour (--ar-agenda-number-color)
     --ar-agenda-current-opacity       its opacity (1)
     --ar-agenda-current-weight        its font weight (700)
     --ar-agenda-upcoming-color        the parts still to come (currentColor)
     --ar-agenda-upcoming-number-color their numbers' colour (--ar-agenda-number-color)
     --ar-agenda-upcoming-opacity      their opacity (1)
     --ar-agenda-upcoming-weight       their font weight (400)
   Each is read here, never declared: one set anywhere above the list (a theme, a slide) reaches
   it; their defaults are other tokens, resolved on the list (--_ar-agenda-…), so they follow the
   theme it is drawn in. A done part is dimmed by its colour, the muted one made lighter (not by
   its opacity: the default keeps 3:1 on every built-in theme, its number too). The same values for
   the three states show no state at all, on every agenda they reach (a theme's, a slide's; for
   one Agenda, :highlight="false" draws no state):
     --ar-agenda-done-color: currentColor;
     --ar-agenda-done-number-color: var(--ar-accent);
     --ar-agenda-current-color: currentColor;
     --ar-agenda-current-weight: 400;
   A section (layouts/section.css) sets them for its slides: there the accent is the background.
   A hand-written ol.agenda shares the rows and the numbers (its items have no state, as an
   Agenda's with :highlight="false" have none). The rules
   are under .ar-slide, (0,2,1) for the list: a rule for every list of a slide (.ar-slide ol,
   (0,1,1)) leaves the agenda as it is, but one as specific loaded after this file wins over it,
   a layout's, a theme's or the project's (.layout-x .ar-body ol, .ar-slide .ar-agenda).
   Its size is a token, a part of --ar-title, not of the body's text; Slide.fit and the scales
   shrink it all the same, as they shrink everything inside (styles/utilities.css): it is worked
   out on the slide, at full size, as the slide has --ar-title (--_ar-agenda-size, registered, so
   em is the slide's text too), and drawn times their factor, --_ar-zoom. Worked out inside the
   body, where they have shrunk --ar-title already, it would shrink twice: so it is read from the
   slide, and one set on the Agenda itself, or on a block inside the body, is not. */
@property --_ar-agenda-size { syntax: '<length-percentage>'; inherits: true; initial-value: 0; }
:where(.ar-slide) { --_ar-agenda-size: var(--ar-agenda-size, calc(var(--ar-title) * .65)); }
:where(.ar-agenda, ol.agenda) {
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
  font-size: calc(var(--_ar-agenda-size) * var(--_ar-zoom, 1));
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
