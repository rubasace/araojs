import { Comment, Fragment, Text, cloneVNode, h } from 'vue'

// Composition pieces: boxes laid out by props, so the usual arrangements need no custom CSS.
// Each one fills the free space of its container (the rest of the slide under its title, a
// zone, a cell of another piece) and takes v-step like any element. Sizes are canvas px.
//   Cols(ratio="1 2" gap="md" align="center")   columns, left to right
//   Rows(ratio="auto 1" gap="md")               rows, top to bottom
//   Grid(cols="4" gap="md")                     equal cells, filled in order row by row
//   Grid(ratio="2:1")                           columns and rows chosen from the number of children
//                                               to keep that shape; the last row is centred
//   Center                                      its content centred both ways (text too)
// ratio: one entry per track, separated by spaces (or commas). Each entry is one of
//          a positive number   a share of the free space; shares are proportions, so "1 2",
//                              "0.25 0.5" and "33 67" split it the same way
//          auto                the track fits its content
//          400px               a fixed size in canvas px
//        Nothing else (no other units, no fr, no CSS functions). An invalid ratio warns in
//        development and is ignored: equal tracks, as without one.
//        Without ratio: equal tracks, one per child. Children beyond the ratio's entries start
//        a new row (Cols) or get equal rows (Rows).
// gap:   sm | md | lg (theme tokens --ph-gap-sm|md|lg), a number of px (12) or a length in
//        px, em or rem ("12px", "1.5em"). Default md; an invalid gap warns and keeps md.
// align (Cols): start | center | end | stretch, vertical placement in each column. Default stretch.
//        In a centred (or end-aligned) slide body the row is only as tall as its content and sits
//        centred (Slide.vue); align="stretch", written out, keeps it full height there too.
// cols (Grid): a whole number of columns. Default 3.
// ratio (Grid): the grid's shape, columns : rows ("2:1", "3/2", "1.5"). With n children it uses
//        rows = round(√(n / ratio)) (at least 1) and columns = ⌈n / rows⌉: 2:1 puts 6 children in
//        3 + 3, 5 in 3 + 2, 8 in 4 + 4, 3 in one row. An incomplete last row is centred under the
//        others. Overrides cols. Not the same as the track ratio of Cols/Rows ("2 1").
// Overflow: widths hold, heights grow. A child is never wider than its track (its column, its
//        cell) and what is wider inside it is clipped at the track's edge, so it never paints over
//        its neighbour (wrap the text, shrink the code). Rows grow to fit their content (Rows,
//        Grid, the wrapped rows of Cols), so rows never overlap; if they do not fit, the piece
//        overflows its container at the bottom.
// .collapse: tracks are positional, so a child collapsed by v-step.collapse frees its track and
//        the children after it shift back one (into its column in Cols, its row in Rows, its
//        cell in Grid) until it shows again.

const GAPS = ['sm', 'md', 'lg']
const ALIGN = ['start', 'center', 'end', 'stretch']
const isNumber = (v) => /^\d*\.?\d+$/.test(String(v).trim()) // non-negative decimal: 12, 1.5, .5
const LENGTH = /^\d*\.?\d+(px|em|rem)$/

// gap → CSS value; undefined when invalid, so the stylesheet default (md) applies. The prop
// validator is this same function, so what passes validation is exactly what renders.
export const gapValue = (v) => {
  if (GAPS.includes(v)) return `var(--ph-gap-${v})`
  if (v == null) return undefined
  if (isNumber(v)) return `${Number(v)}px`
  const s = String(v).trim()
  return LENGTH.test(s) ? s : undefined
}
const gap = { type: [String, Number], validator: (v) => gapValue(v) !== undefined }

// "72 28" → its entries; null when invalid (an unknown entry, or a share that is not positive)
const ENTRY = /^(\d*\.?\d+(px)?|auto)$/
export const ratioEntries = (ratio) => {
  const entries = typeof ratio === 'string' ? ratio.trim().split(/[\s,]+/) : []
  return entries[0] && entries.every((e) => ENTRY.test(e) && !(isNumber(e) && Number(e) <= 0)) ? entries : null
}
// a valid ratio, with exactly `n` entries when given
export const isRatio = (ratio, n) => {
  const entries = ratioEntries(ratio)
  return !!entries && (n == null || entries.length === n)
}

// ratio → grid tracks; undefined when invalid (the caller then lays out equal tracks). Shares are
// divided by their sum: fr tracks adding up to less than 1 would take only that fraction of the
// space ("0.25 0.25" would leave half of it empty). `min` is the floor of a share track: 0 keeps
// the ratio exact (columns), auto lets the track grow to its content (rows: nothing overlaps).
export const tracks = (ratio, min) => {
  const entries = ratioEntries(ratio)
  if (!entries) return undefined
  const sum = entries.filter(isNumber).reduce((s, e) => s + Number(e), 0)
  return entries.map((e) => (isNumber(e) ? `minmax(${min}, ${Number(e) / sum}fr)` : e)).join(' ')
}
const ratio = { type: String, validator: (v) => isRatio(v) }

const piece = (name, props, style) => ({
  name,
  props,
  setup(p, { slots }) {
    const cls = `ph-${name.toLowerCase()}`
    return () => h('div', { class: cls, style: style(p) }, slots.default?.())
  },
})

export const Cols = piece('Cols', {
  ratio,
  gap,
  align: { type: String, validator: (v) => ALIGN.includes(v) },
}, (p) => {
  // with a ratio the columns are explicit and extra children wrap; without, one column per child
  const columns = p.ratio ? tracks(p.ratio, 0) : undefined
  return {
    gridTemplateColumns: columns,
    gridAutoFlow: columns ? 'row' : undefined,
    gap: gapValue(p.gap),
    alignItems: p.align,
    // an explicit stretch keeps the columns full height in a centred body (engine.css)
    alignContent: p.align === 'stretch' ? 'stretch' : undefined,
  }
})

export const Rows = piece('Rows', { ratio, gap }, (p) => ({
  gridTemplateRows: p.ratio ? tracks(p.ratio, 'auto') : undefined,
  gap: gapValue(p.gap),
}))

// Grid ratio: "2:1" | "2/1" | "1.5" | 2 → columns per row (a positive number); null when invalid
export const shapeValue = (v) => {
  if (v == null || v === '') return null
  const m = String(v).trim().match(/^(\d*\.?\d+)\s*(?:[:/]\s*(\d*\.?\d+))?$/)
  const n = m ? Number(m[1]) / (m[2] ? Number(m[2]) : 1) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}
// n children in a grid of shape `shape` (columns / rows) → { cols, rows }
export const gridShape = (n, shape) => {
  const rows = Math.max(1, Math.round(Math.sqrt(n / shape)))
  const cols = Math.max(1, Math.ceil(n / rows))
  return { cols, rows: Math.ceil(n / cols) }
}
// the element children a slot renders (v-for fragments flattened; v-if comments, blank text out)
const elements = (nodes = []) => nodes.flatMap((n) =>
  n.type === Fragment ? elements(n.children)
    : n.type === Comment || (n.type === Text && !String(n.children).trim()) ? [] : [n])

export const Grid = {
  name: 'Grid',
  props: {
    cols: { type: [String, Number], default: 3, validator: (v) => Number.isInteger(Number(v)) && Number(v) >= 1 },
    ratio: { type: [String, Number], validator: (v) => shapeValue(v) !== null },
    gap,
  },
  setup(p, { slots }) {
    return () => {
      const children = elements(slots.default?.())
      const shape = shapeValue(p.ratio)
      if (!shape) {
        return h('div', { class: 'ph-grid', style: {
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
      return h('div', { class: 'ph-grid ph-grid-shaped', style: {
        gridTemplateColumns: `repeat(${cols * 2}, minmax(0, 1fr))`,
        gap: gapValue(p.gap),
      } }, children.map((c, i) => cloneVNode(c, {
        style: { gridColumn: i === firstOfLast ? `${cols - last + 1} / span 2` : 'span 2' },
      })))
    }
  },
}

export const Center = piece('Center', {}, () => undefined)
