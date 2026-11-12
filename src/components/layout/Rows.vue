<!-- Rows, top to bottom. A composition piece: a box laid out by props, so the usual arrangements
     need no custom CSS. Like Cols, Grid and Center, it fills the free space of its container (the
     rest of the slide under its title, a zone, a cell of another piece) and takes v-step like any
     element. Sizes are canvas px.
       Rows(ratio="auto 1" gap="md")
     ratio: one entry per row, a share, auto or a px size (core/layout.js); an invalid ratio warns
            in development and is ignored. Without ratio: equal rows, one per child. Children
            beyond the ratio's entries get equal rows.
     gap:   sm | md | lg, a number of px or a length in px, em or rem (core/layout.js). Default md;
            an invalid gap warns and keeps md.
     Overflow: widths hold, heights grow. A child is never wider than the piece and what is wider
     inside it is clipped at its edge; rows grow to fit their content, so rows never overlap; if
     they do not fit, the piece overflows its container at the bottom.
     .collapse: rows are positional, so a child collapsed by v-step.collapse frees its row and the
     children after it shift back one until it shows again. -->
<template>
  <div class="ar-rows" :style="style"><slot /></div>
</template>

<script setup>
import { computed } from 'vue'
import { gapValue, isGap, isRatio, tracks } from '../../core/layout'

defineOptions({ name: 'Rows' })

const props = defineProps({
  ratio: { type: String, validator: (v) => isRatio(v) },
  gap: { type: [String, Number], validator: isGap },
})

const style = computed(() => ({
  gridTemplateRows: props.ratio ? tracks(props.ratio, 'auto') : undefined,
  gap: gapValue(props.gap),
}))
</script>
