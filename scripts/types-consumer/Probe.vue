<!-- the globally registered components and directives are typed in templates -->
<template>
  <Deck :width="1920" :themes="themes">
    <Slide>
      <p v-step="2">two</p>
      <Cols ratio="2 1"><div /><div /></Cols>
    </Slide>
    <!-- @vue-expect-error width is a number -->
    <Deck :width="'wide'" />
  </Deck>
</template>

<script setup lang="ts">
const themes = ['default'] as const
</script>
