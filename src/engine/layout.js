import { h } from 'vue'

// Composition pieces: boxes laid out by props, so the usual arrangements need no custom CSS.
// Each one fills the free space of its container (the rest of the slide under its title, a
// zone, a cell of another piece) and takes v-step like any element. Sizes are canvas px.
//   Cols(ratio="1 2" gap="md" align="center")   columns, left to right
//   Rows(ratio="auto 1" gap="md")               rows, top to bottom
//   Grid(cols="4" gap="md")                     equal cells, filled in order row by row
//   Center                                      its content centred both ways (text too)
// ratio: one entry per track. A number is a share ("72 28", "1 1 1"), "auto" fits the content,
//        anything else is a CSS track size ("400px"). Without ratio: equal tracks, one per child.
//        Children beyond the ratio's entries start a new row (Cols) or get equal rows (Rows).
// gap:   sm | md | lg (theme tokens --ph-gap-sm|md|lg) or a number of px. Default md.
// align (Cols): start | center | end | stretch, vertical placement in each column. Default stretch.

const GAPS = ['sm', 'md', 'lg']
const ALIGN = ['start', 'center', 'end', 'stretch']
const isNumber = (v) => v !== '' && !Number.isNaN(Number(v))

const gap = {
  type: [String, Number],
  validator: (v) => GAPS.includes(v) || isNumber(v),
}
export const gapValue = (v) =>
  v == null || v === '' ? undefined : GAPS.includes(v) ? `var(--ph-gap-${v})` : isNumber(v) ? `${Number(v)}px` : String(v)

// "72 28" → grid tracks. `min` is the floor of a share track: 0 keeps the ratio exact (columns:
// text wraps, code shrinks), auto lets the track grow to its content (rows: nothing overlaps).
export const tracks = (ratio, min) =>
  String(ratio).trim().split(/[\s,]+/).map((t) => (isNumber(t) ? `minmax(${min}, ${Number(t)}fr)` : t)).join(' ')

const piece = (name, props, style) => ({
  name,
  props,
  setup(p, { slots }) {
    const cls = `ph-${name.toLowerCase()}`
    return () => h('div', { class: cls, style: style(p) }, slots.default?.())
  },
})

export const Cols = piece('Cols', {
  ratio: String,
  gap,
  align: { type: String, validator: (v) => ALIGN.includes(v) },
}, (p) => ({
  // with a ratio the columns are explicit and extra children wrap; without, one column per child
  gridTemplateColumns: p.ratio ? tracks(p.ratio, 0) : undefined,
  gridAutoFlow: p.ratio ? 'row' : undefined,
  gap: gapValue(p.gap),
  alignItems: p.align,
}))

export const Rows = piece('Rows', { ratio: String, gap }, (p) => ({
  gridTemplateRows: p.ratio ? tracks(p.ratio, 'auto') : undefined,
  gap: gapValue(p.gap),
}))

export const Grid = piece('Grid', {
  cols: { type: [String, Number], default: 3, validator: (v) => Number(v) >= 1 },
  gap,
}, (p) => ({
  gridTemplateColumns: `repeat(${Math.max(1, Math.floor(Number(p.cols)) || 1)}, minmax(0, 1fr))`,
  gap: gapValue(p.gap),
}))

export const Center = piece('Center', {}, () => undefined)
