<!-- Columns, left to right. A composition piece: a box laid out by props, so the usual
     arrangements need no custom CSS. Like Rows, Grid and Center, it fills the free space of its
     container (the rest of the slide under its title, a zone, a cell of another piece) and takes
     v-step like any element. Sizes are canvas px.
       Cols(ratio="1 2" gap="md" align="center")
     ratio: one entry per column, a share, auto or a px size (layout.js); an invalid ratio
            warns in development and is ignored. Without ratio: equal columns, one per child.
            Children beyond the ratio's entries start a new row.
     gap:   sm | md | lg, a number of px or a length in px, em or rem (layout.js). Default md;
            an invalid gap warns and keeps md.
     align: start | center | end | stretch, vertical placement in each column. Default stretch.
            In a centred (or end-aligned) slide body the row is only as tall as its content and
            sits centred (Slide.vue); align="stretch", written out, keeps it full height there too.
     Overflow: widths hold, heights grow. A child is never wider than its column and what is wider
     inside it is clipped at the column's edge, so it never paints over its neighbour (wrap the
     text, shrink the code). Wrapped rows grow to fit their content, so rows never overlap; if they
     do not fit, the piece overflows its container at the bottom.
     .collapse: columns are positional, so a child collapsed by v-step.collapse frees its column and
     the children after it shift back one until it shows again.
     CSS: what every piece shares is in layout.css; its props reach its own rules (below) as
     custom properties. -->
<template>
  <div class="ar-cols" :style="style"><slot /></div>
</template>

<script setup>
import { computed } from 'vue'
import { gapValue, isGap, isRatio, tracks } from './layout'

defineOptions({ name: 'Cols' })

const props = defineProps({
  ratio: { type: String, validator: (v) => isRatio(v) },
  gap: { type: [String, Number], validator: isGap },
  align: { type: String, validator: (v) => ['start', 'center', 'end', 'stretch'].includes(v) },
})

// the props as the custom properties its CSS reads (below); an unset one keeps the CSS default
const style = computed(() => {
  // with a ratio the columns are explicit and extra children wrap; without, one column per child
  const columns = props.ratio ? tracks(props.ratio, 0) : undefined
  return {
    '--_ar-tracks': columns,
    '--_ar-flow': columns ? 'row' : undefined,
    '--_ar-gap': gapValue(props.gap),
    '--_ar-align': props.align,
    // an explicit stretch keeps the columns full height in a centred body (Slide.vue)
    '--_ar-align-content': props.align === 'stretch' ? 'stretch' : undefined,
  }
})
</script>

<style src="./layout.css"></style>
<style>
/* one column per child; with a ratio, its columns (--_ar-tracks), and the children beyond them
   start a new row (--_ar-flow); align: each child's place in its column (--_ar-align) */
.ar-cols {
  --_ar-tracks: none; --_ar-flow: column; --_ar-align: normal;
  display: grid;
  grid-template-columns: var(--_ar-tracks); grid-auto-flow: var(--_ar-flow); grid-auto-columns: minmax(0, 1fr);
  align-items: var(--_ar-align);
}
</style>
