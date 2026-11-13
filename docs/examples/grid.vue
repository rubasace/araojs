<template lang="pug">
Deck
  Slide
    h2 Five pillars
    Grid(ratio="2:1" gap="sm")
      Center.card(v-for="(p, i) in pillars" :key="p.icon" v-step="i + 1")
        Icon(:name="p.icon" size="88")
        p {{ p.name }}
</template>

<script setup>
const pillars = [
  { icon: 'lucide:scroll-text', name: 'Logging' },
  { icon: 'lucide:gauge', name: 'Metrics' },
  { icon: 'lucide:waypoints', name: 'Tracing' },
  { icon: 'lucide:plug', name: 'Clients' },
  { icon: 'lucide:shield-check', name: 'Security' },
]
</script>

<style scoped>
.card { background: color-mix(in srgb, var(--ar-fg) 6%, var(--ar-bg)); border-radius: var(--ar-radius); }
.card .ar-icon { color: var(--ar-accent); }
</style>
