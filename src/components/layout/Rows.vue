<!-- Rows, top to bottom. A composition piece: a box laid out by props, so the usual arrangements
     need no custom CSS. Like Cols, Grid and Center, it fills the free space of its container (the
     rest of the slide under its title, a zone, a cell of another piece) and takes v-step like any
     element. Sizes are canvas px.
       Rows(ratio="auto 1" gap="md")
     ratio: one entry per row, a share, auto or a px size (layout.ts); an invalid ratio warns
            in development and is ignored. Without ratio: equal rows, one per child. Children
            beyond the ratio's entries get equal rows.
     gap:   sm | md | lg, a number of px or a length in px, em or rem (layout.ts). Default md;
            an invalid gap warns and keeps md.
     Overflow: widths hold, heights grow. A child is never wider than the piece and what is wider
     inside it is clipped at its edge; rows grow to fit their content, so rows never overlap; if
     they do not fit, the piece overflows its container at the bottom.
     .collapse: rows are positional, so a child collapsed by v-step.collapse frees its row and the
     children after it shift back one until it shows again.
     CSS: what every piece shares is in layout.css; its props reach its own rules (below) as
     custom properties. -->
<template>
  <div class="ar-rows" :style="style"><slot /></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { gapValue, isGap, isRatio, tracks } from './layout'

defineOptions({ name: 'Rows' })

const props = defineProps({
  ratio: { type: String, validator: (v: string) => isRatio(v) },
  gap: { type: [String, Number], validator: isGap },
})

// the props as the custom properties its CSS reads (below); an unset one keeps the CSS default
const style = computed(() => ({
  '--_ar-tracks': props.ratio ? tracks(props.ratio, 'auto') : undefined,
  '--_ar-gap': gapValue(props.gap),
}))
</script>

<style src="./layout.css"></style>
<style>
/* equal rows, one per child; with a ratio, its rows (--_ar-tracks), and equal rows for the
   children beyond them */
.ar-rows {
  --_ar-tracks: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr); grid-template-rows: var(--_ar-tracks); grid-auto-rows: 1fr;
}
</style>
