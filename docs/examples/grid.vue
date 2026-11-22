<template lang="pug">
Deck
  Slide(layout="grid" cards="color-mix(in srgb, var(--ar-fg) 6%, var(--ar-bg))" icon-size="88px")
    h2 Five pillars
    div(v-for="(p, i) in pillars" :key="p.icon" v-step="i + 1")
      Icon(:name="p.icon")
      h3 {{ p.name }}
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
