<!-- Content of the talk's title slide (old FrameworkTitle). Place it inside Slide(layout="cover");
     `credits` adds the links image shown on the closing slide. -->
<template lang="pug">
.fw-title
  Placeholder.fw-title-bg(:file="background" fill)
  Placeholder.fw-title-logo(file="travix.png" w="7em" h="3.4em")
  .fw-title-text
    h1 Building a Framework #[span.second on top of Spring Boot]
    .fw-title-line
    .fw-title-author
      p Rubén Pahíno
      p.social #[Placeholder(file="linkedin.svg" h="1em" inline)] rubenpahino
      p.social #[Placeholder(file="github.svg" h="1em" inline)] rubasace
  Placeholder.fw-title-links(v-if="credits" file="links.svg" h="16em" ratio="1072.5 / 1340.625" corner)
</template>

<script setup>
import Placeholder from './Placeholder.vue'

defineProps({
  credits: Boolean,
  background: { type: String, default: 'kelly-sikkema--BwtFJgaUho-unsplash.jpg' },
})
</script>

<style scoped>
/* background photo was clipped to a diagonal band on the right */
.fw-title-bg { clip-path: polygon(66% 0, 100% 0, 100% 100%, 33% 100%); }
.fw-title-logo { position: absolute; top: 56px; left: 48px; }
.fw-title-text { position: relative; z-index: 1; width: 52%; margin-top: 1.5em; }
.fw-title-text h1 { font-size: calc(var(--ph-title) * .85); text-transform: uppercase; margin-bottom: .5em; }
.fw-title-text .second { font-size: .96em; }
.fw-title-line { width: 14em; height: 6px; border-radius: 3px; background: var(--ph-accent); margin: 0 0 1.2em 2em; }
.fw-title-author { font-size: 1.3em; }
.fw-title-author p { margin: 0 0 .3em; }
.fw-title-author .social { margin-left: 1em; font-size: .9em; }
.fw-title-links { position: absolute; right: 4.2%; top: 50%; transform: translateY(-50%); z-index: 1; background: var(--ph-bg); }
</style>
