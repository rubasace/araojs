<template lang="pug">
Deck
  Slide
    h2 #[Icon(name="lucide:rocket")] Our stack
    Grid(cols="3" gap="sm")
      Center(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
        Icon(:name="t.icon" size="140" :label="t.label" :style="{ color: t.color }")
        p {{ t.label }}
</template>

<script setup>
// Logos wear their brand's colour, the official hex that simpleicons.org publishes: a logo names
// a technology, so it keeps the colour it is known by. Anything else takes the theme's tokens.
const tech = [
  { icon: 'simple-icons:vuedotjs', label: 'Vue', color: '#4FC08D' },
  { icon: 'simple-icons:vite', label: 'Vite', color: '#9135FF' },
  { icon: 'simple-icons:pug', label: 'Pug', color: '#A86454' },
  { icon: 'simple-icons:typescript', label: 'TypeScript', color: '#3178C6' },
  { icon: 'simple-icons:kubernetes', label: 'Kubernetes', color: '#326CE5' },
  { icon: 'simple-icons:docker', label: 'Docker', color: '#2496ED' },
]
</script>
