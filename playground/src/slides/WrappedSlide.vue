<!-- A slide of the project's own: a component that renders a Slide, its content passed on through
     its slot, used in a deck as any slide is (WrappedSlide, imported). It is a slide of the deck
     like the others: its place, its title (the heading its content starts with), its steps, its
     page in the export. -->
<template lang="pug">
Slide.wrapped(layout="default")
  slot
  p.muted.text-sm A slide of the project's own: src/slides/WrappedSlide.vue wraps Slide.
</template>
