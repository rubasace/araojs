<!-- Addon: slide number in a corner. -->
<template>
  <div class="ar-slide-number">{{ deck.index.value + 1 }} / {{ deck.total.value }}</div>
</template>

<script setup>
import { useDeck } from '../state/deck'
const deck = useDeck()
</script>

<style>
.ar-slide-number {
  position: absolute; right: 40px; bottom: 28px; z-index: 10;
  font-size: var(--ar-slide-number-size); color: var(--ar-muted); pointer-events: none;
}
</style>
