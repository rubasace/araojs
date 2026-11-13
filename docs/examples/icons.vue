<template lang="pug">
Deck
  Slide
    h2 #[Icon(name="lucide:rocket")] Built on
    Grid(cols="3" gap="md")
      Center(v-for="(t, i) in tech" :key="t.icon" v-step="i + 1")
        Icon(:name="t.icon" size="160" :label="t.label")
        p {{ t.label }}
</template>

<script setup>
const tech = [
  { icon: 'simple-icons:vuedotjs', label: 'Vue' },
  { icon: 'simple-icons:vite', label: 'Vite' },
  { icon: 'simple-icons:pug', label: 'Pug' },
]
</script>
