<!-- A social handle with its network's icon in front, inline with the text (title and About me). -->
<template lang="pug">
p.fw-social #[Img.fw-social-icon(:file="icon")] #[slot]
</template>

<script setup>
defineProps({ icon: { type: String, required: true } }) // file in the images folder: linkedin.svg
</script>

<style scoped>
/* an Img has no size of its own: here it is as tall as the text, square when the file is there;
   a missing one grows to fit its name */
.fw-social-icon { display: inline-flex; vertical-align: middle; width: auto; height: 1em; min-width: 1em; }
.fw-social-icon.ph-img-missing { border-width: 2px; border-radius: calc(var(--ph-radius) / 2); }
.fw-social-icon :deep(.ph-img-name) { padding: 0 .6em; font-size: calc(var(--ph-text-base) * .4); white-space: nowrap; }
</style>
