<template lang="pug">
Deck
  Slide
    h2 #[Icon(name="lucide:rocket")] Our stack
    Grid(cols="3" gap="sm")
      Center(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
        Icon(:name="t.icon" size="140" :label="t.label")
        p {{ t.label }}
</template>

<script setup>
// Logos are icons like any other: they take the colour of the text, one ink for all of them.
const tech = [
  { icon: 'simple-icons:vuedotjs', label: 'Vue' },
  { icon: 'simple-icons:vite', label: 'Vite' },
  { icon: 'simple-icons:pug', label: 'Pug' },
  { icon: 'simple-icons:typescript', label: 'TypeScript' },
  { icon: 'simple-icons:kubernetes', label: 'Kubernetes' },
  { icon: 'simple-icons:docker', label: 'Docker' },
]
</script>
