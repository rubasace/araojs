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
        Icon(:name="t.icon" size="140" :label="t.label")
        p {{ t.label }}
</template>

<script setup>
const tech = [
  { icon: 'simple-icons:springboot', label: 'Spring Boot' },
  { icon: 'simple-icons:docker', label: 'Docker' },
  { icon: 'simple-icons:kubernetes', label: 'Kubernetes' },
]
</script>
