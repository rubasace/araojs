<!-- Stand-in for an image or icon that is not ported: a dashed box showing the file name.
     Colours derive from currentColor, so it adapts to whatever theme/layout it sits on. -->
<template lang="pug">
.fw-ph(:class="{ fill, round, inline, corner: corner || fill }" :style="style" :title="file")
  span.fw-ph-name {{ stem }}#[wbr]{{ ext }}
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  file: { type: String, required: true },
  w: String, // CSS width
  h: String, // CSS height
  ratio: String, // CSS aspect-ratio, e.g. "526 / 440"
  fill: Boolean, // full-bleed background behind the slide content (label in a corner)
  round: Boolean,
  inline: Boolean, // tiny inline icon: fixed height, grows to fit its label
  corner: Boolean, // label in the top-right corner instead of centred
})

// break long names before the extension rather than mid-word
const dot = computed(() => props.file.lastIndexOf('.'))
const stem = computed(() => (dot.value > 0 ? props.file.slice(0, dot.value) : props.file))
const ext = computed(() => (dot.value > 0 ? props.file.slice(dot.value) : ''))

const style = computed(() => ({
  width: props.inline ? undefined : props.w,
  height: props.h,
  minWidth: props.inline ? props.h : undefined,
  aspectRatio: props.ratio,
}))
</script>

<style scoped>
.fw-ph {
  box-sizing: border-box;
  display: flex; align-items: center; justify-content: center;
  flex: none;
  max-width: 100%; max-height: 100%;
  border: 3px dashed color-mix(in srgb, currentColor 40%, transparent);
  border-radius: var(--ph-radius);
  background: color-mix(in srgb, currentColor 5%, transparent);
  overflow: hidden;
}
.fw-ph.round { border-radius: 50%; }
/* top-right: the bottom corners belong to the deck addons (slide number, progress) */
.fw-ph.corner { align-items: flex-start; justify-content: flex-end; }
.fw-ph.fill { position: absolute; inset: 24px; z-index: 0; max-width: none; max-height: none; }
.fw-ph.inline {
  display: inline-flex; vertical-align: middle;
  border-width: 2px; border-radius: calc(var(--ph-radius) / 2);
}
.fw-ph-name {
  padding: 8px 12px;
  font: calc(var(--ph-text-base) * .5) / 1.2 var(--ph-font-mono);
  color: color-mix(in srgb, currentColor 65%, transparent);
  text-align: center; text-transform: none; font-weight: normal;
  overflow-wrap: anywhere;
}
.fw-ph.inline .fw-ph-name { padding: 0 .6em; font-size: calc(var(--ph-text-base) * .4); white-space: nowrap; }
</style>
