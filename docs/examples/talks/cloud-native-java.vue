<template lang="pug">
Deck
  Slide(layout="cover")
    .bar
    h1 Cloud-native Java
    p.muted From a JAR to a cluster, in forty minutes

  Slide(layout="grid" icon-size="140px")
    h2 The path
    div(v-for="t in tech" :key="t.icon")
      Icon(:name="t.icon" :label="t.label")
      h3 {{ t.label }}
</template>

<script setup>
const tech = [
  { icon: 'simple-icons:springboot', label: 'Spring Boot' },
  { icon: 'simple-icons:docker', label: 'Docker' },
  { icon: 'simple-icons:kubernetes', label: 'Kubernetes' },
]
</script>
