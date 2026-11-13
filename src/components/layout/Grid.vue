<!-- Equal cells, filled in order row by row. A composition piece: a box laid out by props, so the
     usual arrangements need no custom CSS. Like Cols, Rows and Center, it fills the free space of
     its container (the rest of the slide under its title, a zone, a cell of another piece) and
     takes v-step like any element. Sizes are canvas px.
       Grid(cols="4" gap="md")      4 columns
       Grid(ratio="2:1")            columns and rows chosen from the number of children
     cols:  a whole number of columns. Default 3.
     ratio: the grid's shape, columns : rows ("2:1", "3/2", "1.5"; layout.js): 2:1 puts 6
            children in 3 + 3, 5 in 3 + 2, 8 in 4 + 4, 3 in one row. An incomplete last row is
            centred under the others. Overrides cols. Not the track ratio of Cols/Rows ("2 1").
     gap:   sm | md | lg, a number of px or a length in px, em or rem (layout.js). Default md;
            an invalid gap warns and keeps md.
     Overflow: widths hold, heights grow. A child is never wider than its cell and what is wider
     inside it is clipped at the cell's edge, so it never paints over its neighbour; rows grow to
     fit their content, so rows never overlap; if they do not fit, the piece overflows its
     container at the bottom.
     .collapse: cells are positional, so a child collapsed by v-step.collapse frees its cell and the
     children after it shift back one until it shows again (an incomplete last row is centred for
     every child, shown or not, but leaves no empty row when its last child is collapsed).
     CSS: what every piece shares is in layout.css; its props reach its own rules (below) as
     custom properties. A render function: with ratio, the number of columns depends on the number
     of children. -->
<script>
import { Comment, Fragment, Text, h } from 'vue'
import { gapValue, gridShape, isGap, shapeValue } from './layout'

// the element children a slot renders (v-for fragments flattened; v-if comments, blank text out)
const elements = (nodes = []) => nodes.flatMap((n) =>
  n.type === Fragment ? elements(n.children)
    : n.type === Comment || (n.type === Text && !String(n.children).trim()) ? [] : [n])

export default {
  name: 'Grid',
  props: {
    cols: { type: [String, Number], default: 3, validator: (v) => Number.isInteger(Number(v)) && Number(v) >= 1 },
    ratio: { type: [String, Number], validator: (v) => shapeValue(v) !== null },
    gap: { type: [String, Number], validator: isGap },
  },
  setup(p, { slots }) {
    return () => {
      const children = elements(slots.default?.())
      const shape = shapeValue(p.ratio)
      // the props as the custom properties its CSS reads (below): the number of columns (with a
      // shape, columns and rows from the number of children) and the gap (unset: the CSS default)
      const n = children.length
      const { cols, rows } = shape ? gridShape(n || 1, shape) : { cols: Math.max(1, Math.floor(Number(p.cols)) || 1) }
      // an incomplete last row: half a cell of spacer per missing cell before it (CSS, below)
      const missing = shape && n % cols ? cols - (n % cols) : 0
      return h('div', {
        class: shape ? 'ar-grid ar-grid-shaped' : 'ar-grid',
        style: {
          '--_ar-cols': cols, '--_ar-gap': gapValue(p.gap),
          ...(missing ? { '--_ar-rows': rows, '--_ar-pad': missing, '--_ar-spacer': 'block' } : {}),
        },
      }, children)
    }
  },
}
</script>

<style src="./layout.css"></style>
<style>
/* --_ar-cols equal columns, and rows as tall as each other (1fr), filled in order */
.ar-grid {
  --_ar-cols: 3; --_ar-pad: 1; --_ar-spacer: none;
  display: grid;
  grid-template-columns: repeat(var(--_ar-cols), minmax(0, 1fr)); grid-auto-rows: 1fr;
}
/* With a shape: twice as many half-columns, every cell two of them wide, so an incomplete last row
   can start half a cell in per missing cell and sit centred under the full ones. The empty
   half-columns before it are an ::after spacer --_ar-pad half-columns wide on the last row
   (--_ar-rows); the cells skip it as they fill in order. No incomplete row, no spacer
   (--_ar-spacer: none; a span of 0 is invalid). */
.ar-grid-shaped { grid-template-columns: repeat(calc(var(--_ar-cols) * 2), minmax(0, 1fr)); }
.ar-grid-shaped > * { grid-column: span 2; }
.ar-grid-shaped::after {
  content: ''; display: var(--_ar-spacer);
  grid-row: var(--_ar-rows); grid-column: 1 / span var(--_ar-pad);
}
/* the last child collapsed (v-step.collapse): the last row is leaving, and the spacer alone must
   not keep an empty row */
.ar-grid-shaped:has(> .ar-step-collapsed:last-child)::after { display: none; }
</style>
