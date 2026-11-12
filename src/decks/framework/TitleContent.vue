<!-- Content of the talk's title slide (old FrameworkTitle). Place it inside Slide(layout="cover"),
     whose #background holds the photo; `credits` adds the links image shown on the closing slide. -->
<template lang="pug">
.fw-title
  Img.fw-title-logo(file="travix.png")
  .fw-title-text
    h1 Building a Framework #[span.second on top of Spring Boot]
    .fw-title-line
    .fw-title-author
      p Rubén Pahíno
      Social.social(icon="linkedin.svg") rubenpahino
      Social.social(icon="github.svg") rubasace
  Img.fw-title-links(v-if="credits" file="links.svg")
</template>

<script setup>
import Social from './Social.vue'

defineProps({ credits: Boolean })
</script>

<style scoped>
.fw-title-logo { position: absolute; top: 56px; left: 48px; width: 7em; height: 3.4em; }
.fw-title-text { position: relative; z-index: 1; width: 52%; margin-top: 1.5em; }
.fw-title-text h1 { font-size: calc(var(--ph-title) * .85); text-transform: uppercase; margin-bottom: .5em; }
.fw-title-text .second { font-size: .96em; }
.fw-title-line { width: 14em; height: 6px; border-radius: 3px; background: var(--ph-accent); margin: 0 0 1.2em 2em; }
.fw-title-author { font-size: 1.3em; }
.fw-title-author p { margin: 0 0 .3em; }
.fw-title-author .social { margin-left: 1em; font-size: .9em; }
.fw-title-links {
  position: absolute; right: 4.2%; top: 50%; transform: translateY(-50%); z-index: 1;
  width: auto; height: 16em; aspect-ratio: 1072.5 / 1340.625; background: var(--ph-bg);
}
.fw-title-links.ph-img-missing { align-items: flex-start; justify-content: flex-end; }
</style>
