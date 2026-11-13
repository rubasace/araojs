// The small languages of layout props, parsed into CSS: a track ratio ("1 2"), a gap ("md"), a
// grid shape ("2:1"). Pure: strings in, CSS values out; each `is…` is the prop validator, the
// same parser, so what passes validation is exactly what renders. Used by the layout pieces next
// to it (Cols, Rows, Grid), which hand the values to their CSS, and by Slide (its zones' ratio).
//
// Track ratio: one entry per track, separated by spaces (or commas). Each entry is one of
//   a positive number   a share of the free space; shares are proportions, so "1 2",
//                       "0.25 0.5" and "33 67" split it the same way
//   auto                the track fits its content
//   400px               a fixed size in canvas px
// Nothing else (no other units, no fr, no CSS functions). An invalid ratio is no ratio: the
// caller lays out equal tracks, as without one.
// Gap: sm | md | lg (theme tokens --ar-gap-sm|md|lg), a number of px (12) or a length in px, em
//   or rem ("12px", "1.5em"). An invalid gap is no gap: the stylesheet's default applies.
// Grid shape: columns : rows ("2:1", "3/2", "1.5", 2), a positive number of columns per row.
//   With n cells it uses rows = round(√(n / shape)) (at least 1) and columns = ⌈n / rows⌉:
//   2:1 puts 6 cells in 3 + 3, 5 in 3 + 2, 8 in 4 + 4, 3 in one row. Not a track ratio ("2 1").

const GAPS = ['sm', 'md', 'lg']
const isNumber = (v) => /^\d*\.?\d+$/.test(String(v).trim()) // non-negative decimal: 12, 1.5, .5
const LENGTH = /^\d*\.?\d+(px|em|rem)$/

// gap → CSS value; undefined when invalid
export const gapValue = (v) => {
  if (GAPS.includes(v)) return `var(--ar-gap-${v})`
  if (v == null) return undefined
  if (isNumber(v)) return `${Number(v)}px`
  const s = String(v).trim()
  return LENGTH.test(s) ? s : undefined
}
export const isGap = (v) => gapValue(v) !== undefined

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

// grid shape: "2:1" | "2/1" | "1.5" | 2 → columns per row (a positive number); null when invalid
export const shapeValue = (v) => {
  if (v == null || v === '') return null
  const m = String(v).trim().match(/^(\d*\.?\d+)\s*(?:[:/]\s*(\d*\.?\d+))?$/)
  const n = m ? Number(m[1]) / (m[2] ? Number(m[2]) : 1) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}
// n cells in a grid of shape `shape` (columns / rows) → { cols, rows }
export const gridShape = (n, shape) => {
  const rows = Math.max(1, Math.round(Math.sqrt(n / shape)))
  const cols = Math.max(1, Math.ceil(n / rows))
  return { cols, rows: Math.ceil(n / cols) }
}
