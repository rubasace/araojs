<!-- Equal cells, filled in order row by row. A composition piece: a box laid out by props, so the
     usual arrangements need no custom CSS. Like Cols, Rows and Center, it fills the free space of
     its container (the rest of the slide under its title, a zone, a cell of another piece) and
     takes v-step like any element. Sizes are canvas px.
       Grid(cols="4" gap="md")      4 columns
       Grid(ratio="2:1")            columns and rows chosen from the number of children
     cols:  a whole number of columns. Default 3.
     ratio: the grid's shape, columns : rows ("2:1", "3/2", "1.5"; core/layout.js): 2:1 puts 6
            children in 3 + 3, 5 in 3 + 2, 8 in 4 + 4, 3 in one row. An incomplete last row is
            centred under the others. Overrides cols. Not the track ratio of Cols/Rows ("2 1").
     gap:   sm | md | lg, a number of px or a length in px, em or rem (core/layout.js). Default md;
            an invalid gap warns and keeps md.
     Overflow: widths hold, heights grow. A child is never wider than its cell and what is wider
     inside it is clipped at the cell's edge, so it never paints over its neighbour; rows grow to
     fit their content, so rows never overlap; if they do not fit, the piece overflows its
     container at the bottom.
     .collapse: cells are positional, so a child collapsed by v-step.collapse frees its cell and the
     children after it shift back one until it shows again.
     A render function: the shaped grid places each child itself (a style on a copy of its vnode). -->
<script>
import { Comment, Fragment, Text, cloneVNode, h } from 'vue'
import { gapValue, gridShape, isGap, shapeValue } from '../../core/layout'

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
      if (!shape) {
        return h('div', { class: 'ar-grid', style: {
          gridTemplateColumns: `repeat(${Math.max(1, Math.floor(Number(p.cols)) || 1)}, minmax(0, 1fr))`,
          gap: gapValue(p.gap),
        } }, children)
      }
      // shaped: every cell spans two half-columns, so an incomplete last row can start half a
      // cell in per missing cell and sit centred under the full rows
      const n = children.length
      const { cols } = gridShape(n || 1, shape)
      const last = n % cols
      const firstOfLast = last ? n - last : -1
      return h('div', { class: 'ar-grid ar-grid-shaped', style: {
        gridTemplateColumns: `repeat(${cols * 2}, minmax(0, 1fr))`,
        gap: gapValue(p.gap),
      } }, children.map((c, i) => cloneVNode(c, {
        style: { gridColumn: i === firstOfLast ? `${cols - last + 1} / span 2` : 'span 2' },
      })))
    }
  },
}
</script>
