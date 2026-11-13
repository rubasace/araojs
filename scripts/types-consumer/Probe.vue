<!-- the globally registered components and directives are typed in templates -->
<template>
  <Deck :width="1920" :themes="themes">
    <Slide align="start" :footer="false">
      <p v-step="2">two</p>
      <Cols ratio="2 1"><div /><div /></Cols>
      <Snippet file="App.java" :size="30" />
      <Img file="team.jpg" fit="cover" />
      <Icon name="lucide:rocket" />
    </Slide>
    <!-- @vue-expect-error width is a number -->
    <Deck :width="'wide'" />
    <!-- @vue-expect-error footer is a boolean -->
    <Slide :footer="'yes'" />
    <!-- @vue-expect-error size is a number -->
    <Snippet :size="'big'" />
    <!-- @vue-expect-error fit is 'cover' or 'contain' -->
    <Img fit="fill" />
    <!-- @vue-expect-error an icon needs its name -->
    <Icon />
  </Deck>
</template>

<script setup lang="ts">
const themes = ['default'] as const
</script>
