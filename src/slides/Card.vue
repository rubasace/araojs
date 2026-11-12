<!-- An ordinary component: it numbers its steps from 1 and knows nothing about where it sits.
     The deck places it with v-step-from:  Card(v-step-from="5")  → its first item shows at step 5. -->
<template lang="pug">
.card
  h3 {{ title }}
  ul
    li(v-for="(item, i) in items" :key="item" v-step="i + 1") {{ item }}
</template>

<script setup>
defineProps({
  title: String,
  items: { type: Array, default: () => [] },
})
</script>

<style scoped>
.card { background: color-mix(in srgb, var(--ph-fg) 6%, transparent);
  border-left: 8px solid var(--ph-accent); border-radius: var(--ph-radius); padding: 40px 48px; }
h3 { margin: 0 0 24px; font-size: 52px; }
ul { margin: 0; padding-left: 1.1em; }
li { margin: .3em 0; }
</style>
