<!-- Port of the old TextWithIcon: an icon (here a placeholder box) with an optional label,
     stacked (default) or side by side. -->
<template lang="pug">
.fw-it(:class="{ side }")
  Placeholder(:file="icon" :w="size" :h="size")
  p.fw-it-text(v-if="text" :class="{ upper }" :style="{ fontSize: textSize }") {{ text }}
</template>

<script setup>
import Placeholder from './Placeholder.vue'

defineProps({
  icon: { type: String, required: true },
  text: String,
  size: { type: String, default: '7em' }, // icon box side
  textSize: { type: String, default: '1.4em' },
  upper: { type: Boolean, default: true },
  side: Boolean, // icon on the left, text on the right
})
</script>

<style scoped>
.fw-it { display: flex; flex-direction: column; align-items: center; gap: .5em; min-width: 0; }
.fw-it.side { flex-direction: row; gap: .7em; text-align: left; }
.fw-it-text { margin: 0 !important; font-weight: 700; line-height: 1.15; text-align: center; }
.fw-it.side .fw-it-text { text-align: left; }
.fw-it-text.upper { text-transform: uppercase; }
</style>
