<!-- Addon: slide number in a corner. -->
<template>
  <div class="ph-slide-number">{{ deck.index.value + 1 }} / {{ deck.total.value }}</div>
</template>

<script setup>
import { useDeck } from '../composables/useDeck'
const deck = useDeck()
</script>

<style>
.ph-slide-number {
  position: absolute; right: 40px; bottom: 28px; z-index: 10;
  font-size: 24px; color: var(--ph-muted); pointer-events: none;
}
</style>
