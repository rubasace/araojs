<template lang="pug">
Deck
  Slide(layout="grid" icon-size="140px")
    h2 #[Icon(name="lucide:rocket")] Our stack
    div(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
      Icon(:name="t.icon" :label="t.label")
      h3 {{ t.label }}
</template>

<script setup>
// Logos are icons like any other, one ink for all of them: the grid layout draws a block's
// leading icon in the accent, at its icon-size.
const tech = [
  { icon: 'simple-icons:vuedotjs', label: 'Vue' },
  { icon: 'simple-icons:vite', label: 'Vite' },
  { icon: 'simple-icons:pug', label: 'Pug' },
  { icon: 'simple-icons:typescript', label: 'TypeScript' },
  { icon: 'simple-icons:kubernetes', label: 'Kubernetes' },
  { icon: 'simple-icons:docker', label: 'Docker' },
]
</script>
