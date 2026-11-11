<!-- Port of the old Quote: big uppercase quotation with an optional author. -->
<template lang="pug">
figure.fw-quote
  blockquote
    slot
  figcaption(v-if="author") {{ author }}
</template>

<script setup>
defineProps({ author: String })
</script>

<style scoped>
.fw-quote { flex: 1; margin: 0; display: flex; flex-direction: column; justify-content: center; }
blockquote {
  margin: 0 0 .4em; padding-left: .4em;
  font-size: 2.4em; font-weight: 300; line-height: 1.15; text-transform: uppercase;
}
blockquote::before, blockquote::after { color: var(--ph-accent); font-weight: 700; }
blockquote::before { content: '\201C'; }
blockquote::after { content: '\201D'; }
figcaption {
  align-self: flex-end; margin-right: 5%;
  font-size: 1.6em; font-weight: 300; color: var(--ph-muted); text-transform: capitalize;
}
figcaption::before { content: '-\00a0'; }
</style>
