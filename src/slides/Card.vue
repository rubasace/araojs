<!-- An ordinary component: it knows nothing about decks; v-step works inside it anyway. -->
<template lang="pug">
.card
  h3 {{ title }}
  ul
    li(v-for="(item, i) in items" :key="item" v-step="from + i") {{ item }}
</template>

<script setup>
defineProps({
  title: String,
  items: { type: Array, default: () => [] },
  from: { type: Number, default: 2 },
})
</script>

<style scoped>
.card { background: color-mix(in srgb, var(--ph-fg) 6%, transparent);
  border-left: 8px solid var(--ph-accent); border-radius: var(--ph-radius); padding: 40px 48px; }
h3 { margin: 0 0 24px; font-size: 52px; }
ul { margin: 0; padding-left: 1.1em; }
li { margin: .3em 0; }
</style>
