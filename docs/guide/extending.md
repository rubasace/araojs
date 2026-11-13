# Extending

A slide is Vue: your own components, addons and composables plug into the deck like the built-in
ones.

## Your own components

A component written for one talk goes in `src/decks/<talk>/`; one that several decks share
(like a `Card`) goes in `src/slides/`. Neither is global: the deck imports it in
`<script setup>` (`import Card from '../slides/Card.vue'`). Number its steps from 1 and let the
deck place it with `v-step-from` ([Steps](steps.md#reusable-steps-v-step-from)).

Style it through tokens (`color: var(--ar-accent)`), in canvas px, so it follows the theme and
the canvas like the rest of the slide.

## Reading the deck: useDeck

`useDeck()` gives any component inside `Deck` where the deck is (slide, step, progress, theme,
timer…) and functions to move it. Every field: [useDeck()](../reference/composables.md#usedeck).

```js
import { useDeck } from 'araojs'
const deck = useDeck()
```

## Changing within a slide: useSlide

`useSlide()` is for components that change *within* their slide (highlight, count, dim) rather
than just appear: it reads the slide's step and can add steps to it
([useSlide()](../reference/composables.md#useslide)). A counter that adds its own steps:

```vue
<template lang="pug">
.counter {{ slide.step.value }} / {{ to }}
</template>

<script setup>
import { useSlide } from 'araojs'
const props = defineProps({ to: { type: Number, default: 3 } })
const slide = useSlide()
slide.requireSteps(() => props.to)
</script>
```

## Writing an addon

An addon is placed inside `Deck` but outside any `Slide`, and drawn over every slide
([Addons](../reference/components.md#addons)).

Write it as a component that calls `useDeck()`, positions itself absolutely in canvas px,
uses tokens for colours, and sets `pointer-events: none`. Skip side effects where they do not
belong with `role`.

```vue
<!-- src/decks/mytalk/SlideClock.vue: the wall clock, top right -->
<template lang="pug">
.slide-clock(v-if="deck.role !== 'preview'") {{ time }}
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useDeck } from 'araojs'

const deck = useDeck()
const time = ref('')
let timer
const tick = () => (time.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
onMounted(() => { tick(); timer = setInterval(tick, 10000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<style>
.slide-clock {
  position: absolute; top: 28px; right: 40px; z-index: 10;
  font-size: 24px; color: var(--ar-muted); pointer-events: none;
}
</style>
```

## Side effects and roles

The same deck is drawn in several places: the audience window, the presenter view (twice: the
current slide and the preview of the next step), the export, and the cover in the list of decks.
`useDeck().role` says which (`'audience'`, `'presenter'`, `'preview'`, `'export'`,
`'thumbnail'`). Anything that plays or fetches checks it:

```js
onMounted(() => deck.role === 'audience' && video.value.play())
```

The presenter window mounts every slide twice (current + preview): side effects in
slides and addons run twice there and element ids repeat. Use `useDeck().role` to skip them.

## Late content

A component that loads something before it can be printed marks itself with `data-ar-busy`, and
the export waits for it ([Late content](export.md#late-content)).
