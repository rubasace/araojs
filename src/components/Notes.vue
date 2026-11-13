<!-- Speaker notes, written inside a Slide like anything else. They draw nothing on the slide: their
     content goes to whoever offers an outlet for notes (state/notes.ts: the presenter view's
     panel, the export's notes pages) while their slide is the one on screen. What shows at each
     step is said with v-step inside them, as on the slide. One Notes per slide is the rule; more
     follow one another in template order. The content stays in the slide's component tree. -->
<template>
  <Teleport v-if="drawn" :to="target">
    <!-- data-ar-slide: v-step inside the note finds its slide from here, outside the slide;
         data-ar-notes: those v-steps follow the slide's steps and add none (directives/step.ts) -->
    <div class="ar-note" :data-ar-slide="slideId" data-ar-notes><slot /></div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotesTarget } from '../state/notes'

const { target, drawn, inSlide, slideId } = useNotesTarget()
if (!inSlide) console.warn('[arao] Notes used outside a <Slide>: they show nowhere')
</script>
