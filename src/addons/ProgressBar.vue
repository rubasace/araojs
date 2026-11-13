<!-- Addon: put it anywhere inside <Deck>. It draws over the slides, in canvas space. -->
<template>
  <div class="ar-progress" :class="position">
    <div class="ar-progress-fill" :style="{ width: deck.progress.value * 100 + '%' }"></div>
  </div>
</template>

<script setup>
import { useDeck } from '../state/deck'

defineProps({
  position: { type: String, default: 'bottom' }, // 'top' | 'bottom'
})
const deck = useDeck()
</script>

<style>
.ar-progress {
  position: absolute; left: 0; right: 0; z-index: 10;
  height: var(--ar-progress-height);
  background: color-mix(in srgb, var(--ar-fg) 12%, transparent);
  pointer-events: none;
}
.ar-progress.top { top: 0; }
.ar-progress.bottom { bottom: 0; }
.ar-progress-fill {
  height: 100%; background: var(--ar-accent);
  transition: width var(--ar-progress-duration) ease;
}
</style>
