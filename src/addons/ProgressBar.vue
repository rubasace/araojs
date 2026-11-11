<!-- Addon: put it anywhere inside <Deck>. It draws over the slides, in canvas space. -->
<template lang="pug">
.ph-progress(:class="position")
  .ph-progress-fill(:style="{ width: deck.progress.value * 100 + '%' }")
</template>

<script setup>
import { useDeck } from '../engine'

defineProps({
  position: { type: String, default: 'bottom' }, // 'top' | 'bottom'
})
const deck = useDeck()
</script>

<style>
.ph-progress {
  position: absolute; left: 0; right: 0; z-index: 10;
  height: var(--ph-progress-height, 8px);
  background: color-mix(in srgb, var(--ph-fg) 12%, transparent);
  pointer-events: none;
}
.ph-progress.top { top: 0; }
.ph-progress.bottom { bottom: 0; }
.ph-progress-fill {
  height: 100%; background: var(--ph-accent);
  transition: width .35s ease;
}
</style>
