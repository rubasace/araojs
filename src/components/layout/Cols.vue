<!-- Columns, left to right. A composition piece: a box laid out by props, so the usual
     arrangements need no custom CSS. Like Rows, Grid and Center, it fills the free space of its
     container (the rest of the slide under its title, a zone, a cell of another piece) and takes
     v-step like any element. Sizes are canvas px.
       Cols(ratio="1 2" gap="md" align="center")
     ratio: one entry per column, a share, auto or a px size (core/layout.js); an invalid ratio
            warns in development and is ignored. Without ratio: equal columns, one per child.
            Children beyond the ratio's entries start a new row.
     gap:   sm | md | lg, a number of px or a length in px, em or rem (core/layout.js). Default md;
            an invalid gap warns and keeps md.
     align: start | center | end | stretch, vertical placement in each column. Default stretch.
            In a centred (or end-aligned) slide body the row is only as tall as its content and
            sits centred (Slide.vue); align="stretch", written out, keeps it full height there too.
     Overflow: widths hold, heights grow. A child is never wider than its column and what is wider
     inside it is clipped at the column's edge, so it never paints over its neighbour (wrap the
     text, shrink the code). Wrapped rows grow to fit their content, so rows never overlap; if they
     do not fit, the piece overflows its container at the bottom.
     .collapse: columns are positional, so a child collapsed by v-step.collapse frees its column and
     the children after it shift back one until it shows again. -->
<template>
  <div class="ar-cols" :style="style"><slot /></div>
</template>

<script setup>
import { computed } from 'vue'
import { gapValue, isGap, isRatio, tracks } from '../../core/layout'

defineOptions({ name: 'Cols' })

const props = defineProps({
  ratio: { type: String, validator: (v) => isRatio(v) },
  gap: { type: [String, Number], validator: isGap },
  align: { type: String, validator: (v) => ['start', 'center', 'end', 'stretch'].includes(v) },
})

const style = computed(() => {
  // with a ratio the columns are explicit and extra children wrap; without, one column per child
  const columns = props.ratio ? tracks(props.ratio, 0) : undefined
  return {
    gridTemplateColumns: columns,
    gridAutoFlow: columns ? 'row' : undefined,
    gap: gapValue(props.gap),
    alignItems: props.align,
    // an explicit stretch keeps the columns full height in a centred body (engine.css)
    alignContent: props.align === 'stretch' ? 'stretch' : undefined,
  }
})
</script>
