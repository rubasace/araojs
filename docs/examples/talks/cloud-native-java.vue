<template lang="pug">
Deck(:themes="['ocean']")
  Slide(layout="cover")
    .bar
    h1 Cloud-native Java
    p.muted From a JAR to a cluster, in forty minutes

  Slide
    h2 The path
    Cols(gap="lg")
      Center(v-for="t in tech" :key="t.icon")
        Icon(:name="t.icon" size="140" :label="t.label" :style="{ color: t.color }")
        p {{ t.label }}
</template>

<script setup>
// brand colours for logos (simpleicons.org): see docs/examples/icons.vue
const tech = [
  { icon: 'simple-icons:springboot', label: 'Spring Boot', color: '#6DB33F' },
  { icon: 'simple-icons:docker', label: 'Docker', color: '#2496ED' },
  { icon: 'simple-icons:kubernetes', label: 'Kubernetes', color: '#326CE5' },
]
</script>
