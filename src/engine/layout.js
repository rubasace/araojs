import { h } from 'vue'

// Composition pieces: boxes laid out by props, so the usual arrangements need no custom CSS.
// Each one fills the free space of its container (the rest of the slide under its title, a
// zone, a cell of another piece) and takes v-step like any element. Sizes are canvas px.
//   Cols(ratio="1 2" gap="md" align="center")   columns, left to right
//   Rows(ratio="auto 1" gap="md")               rows, top to bottom
//   Grid(cols="4" gap="md")                     equal cells, filled in order row by row
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
// cols (Grid): a whole number of columns. Default 3.
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
  }
})

export const Rows = piece('Rows', { ratio, gap }, (p) => ({
  gridTemplateRows: p.ratio ? tracks(p.ratio, 'auto') : undefined,
  gap: gapValue(p.gap),
}))

export const Grid = piece('Grid', {
  cols: { type: [String, Number], default: 3, validator: (v) => Number.isInteger(Number(v)) && Number(v) >= 1 },
  gap,
}, (p) => ({
  gridTemplateColumns: `repeat(${Math.max(1, Math.floor(Number(p.cols)) || 1)}, minmax(0, 1fr))`,
  gap: gapValue(p.gap),
}))

export const Center = piece('Center', {}, () => undefined)
