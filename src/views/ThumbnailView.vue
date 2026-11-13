<!-- The thumbnail view (a deck inside something that called provideThumbnail, state/deck.js):
     the deck's cover, its first slide at step 1 in its first theme, on the canvas scaled to fit
     the box it is placed in (a positioned box: it fills it, letterboxed in the theme's
     --ar-letterbox, unless the place it is in paints .ar-thumb's background). A picture of the deck:
     no controls, no keys, no pointer, nothing in it is focused or read out (inert), nothing
     moves (no transitions or animations, as in the export), and it looks as the deck does in its
     own window, whatever the page around it.
     deck: createDeck() (state/deck.js): its stage. -->
<template>
  <div class="ar-thumb" :data-theme="theme" :lang="lang" inert aria-hidden="true">
    <Stage :stage="deck.stage" :width="width" :height="height">
      <slot />
    </Stage>
  </div>
</template>

<script setup>
import { useDeck } from '../state/deck'
import Stage from './parts/Stage.vue'

defineProps({
  deck: { type: Object, required: true }, // createDeck()
  width: { type: Number, required: true }, // of the canvas
  height: { type: Number, required: true },
})
const { theme } = useDeck()
// the page's language, not the one of whatever the thumbnail is placed in
const lang = document.documentElement.lang
</script>

<style>
.ar-thumb {
  position: absolute; inset: 0; overflow: hidden;
  background: var(--ar-letterbox);
  color-scheme: normal;
  pointer-events: none; user-select: none;
}
.ar-thumb *, .ar-thumb *::before, .ar-thumb *::after { transition: none !important; animation: none !important; }
</style>
