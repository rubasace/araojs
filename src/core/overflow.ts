// What does not fit on a slide, measured on its section as it is laid out now, in canvas px
// (whatever the scale the canvas is drawn at), and Slide.fit, which shrinks a slide's body until
// it fits. DOM only, no Vue: the slide's own watch (composables/useOverflow.ts) and the export
// (exporter.ts, every page before it is copied) both call it.
//
//   measureSlide(section)          [] when everything fits; else what overflows, by how much
//   measureSlide(section, 'body')  the body's part alone: what Slide.fit looks at
//   fitSlide(section)              Slide.fit: the body's text shrunk just enough to fit, down to
//                                  FIT_MIN of its size (null for a slide without .fit, whose body
//                                  is left as it is)
//   describeOverflow(found)        what measureSlide found, in words (the warnings say it)
//   overflowFixes(found, fit)      how to fix it, by kind ({ kind, text }: what overflows where,
//                                  and what fitSlide did); sayFixes(fixes) in words
//
// What is checked: what shows against the box it has.
//   - the slide's zones (its header, its body, each zone .ar-zone-<name>): what shows in them past
//     their content box, and past the slide's padding (a body that grows with its content, as a
//     cover's does, pushed past the bottom; a zone pulled out by a negative margin, as grid's body
//     is, may reach as far as that margin). Past the body's bottom, it is said to be under the
//     footer, in the bottom margin, or cut off past the slide's edge;
//   - the blocks of a zone (its children: split's sides, grid's blocks, a paragraph too wide): what
//     shows in them past their content box;
//   - any element inside that clips (overflow other than visible: the columns of .cols, a side of
//     split): what shows in it past its content box, which it cuts off.
// What shows: text (the lines of an element's own text, and what of it sticks out of its box),
// media and the library's components that crop by design (Img, Snippet, Icon, img, svg, video,
// canvas…: their own box, nothing inside), and the box of an element that paints itself (a
// background, a border, a shadow: a card). An element that paints nothing is only what it holds:
// a list as tall as the items still to come (a step not shown yet takes its room) shows only its
// items shown.
// What does not: what is meant to reach past its box. The background layer (Background) and the
// footer are no zone; an element positioned absolutely or fixed is placed by design, and nothing
// inside it counts; nor does an element marked data-ar-bleed (a picture meant to reach the slide's
// edge, say). Nor what is not shown: hidden elements, a step not reached yet (opacity 0),
// visibility hidden.
// Overflow under TOLERANCE px is rounding, not overflow (Slide.fit is stricter: FIT_TOLERANCE).
// Positions are read with getBoundingClientRect: transforms count as drawn. The canvas's own
// scale is taken out (k); what moves (a step's glide, a fade) is to be measured once it is still:
// the callers wait for the slide's animations to finish.

export const TOLERANCE = 2
const FIT_TOLERANCE = 0.5
// the smallest a fitted body's text gets: this much of the size it would have
export const FIT_MIN = 0.6

export type Side = 'top' | 'right' | 'bottom' | 'left'
export interface Overflow {
  // what overflows, in words: 'the body', 'block 3 of the body (div)', 'a ul.steps in the body'
  box: string
  side: Side
  // how far what shows reaches past the box on that side, canvas px
  px: number
  // below a zone: whether it ends under the footer, in the bottom margin, or past the slide's edge
  // (cut off); a box that clips: cut, its content is cut off at its edge
  where?: 'footer' | 'margin' | 'edge' | 'cut'
}
// a rectangle in the viewport's px
type Box = { l: number; t: number; r: number; b: number }

// what shows by its own box, and nothing inside it
const OPAQUE = '.ar-img, .ar-snippet, .ar-icon, img, svg, picture, video, audio, canvas, iframe, object, embed, math, input, button, select, textarea'
const SIDES: Side[] = ['top', 'right', 'bottom', 'left']
const px = (v: string) => parseFloat(v) || 0
// a computed colour with nothing in it: transparent, or of alpha 0 (rgba(r, g, b, 0), or a colour
// function's "/ 0"); rgb(r, g, 0) is blue-less, not see-through
const clear = (c: string) => c === 'transparent' || /^rgba\((?:[^,]*,){3}\s*0\s*\)$/.test(c) || /\/\s*0\s*\)$/.test(c)

const union = (a: Box | null, b: Box | null): Box | null =>
  !a ? b : !b ? a : { l: Math.min(a.l, b.l), t: Math.min(a.t, b.t), r: Math.max(a.r, b.r), b: Math.max(a.b, b.b) }
const fromRect = (r: DOMRect): Box => ({ l: r.left, t: r.top, r: r.right, b: r.bottom })

// an element's box, shrunk by its borders (the padding box) and its padding too (the content box),
// in the viewport's px, k being the canvas's scale
function inset(el: Element, cs: CSSStyleDeclaration, k: number, what: 'padding' | 'content'): Box {
  const r = fromRect(el.getBoundingClientRect())
  const by = (side: string) => px(cs.getPropertyValue(`border-${side}-width`)) + (what === 'content' ? px(cs.getPropertyValue(`padding-${side}`)) : 0)
  return { l: r.l + by('left') * k, t: r.t + by('top') * k, r: r.r - by('right') * k, b: r.b - by('bottom') * k }
}

// how far `content` reaches past `box` on each side, canvas px
function past(content: Box, box: Box, k: number): Record<Side, number> {
  return { top: (box.t - content.t) / k, right: (content.r - box.r) / k, bottom: (content.b - box.b) / k, left: (box.l - content.l) / k }
}

// whether an element's own box shows: it paints something (a background, a border, a shadow) or
// holds text of its own
function paints(el: Element, cs: CSSStyleDeclaration) {
  if (cs.backgroundImage !== 'none' || !clear(cs.backgroundColor) || cs.boxShadow !== 'none') return true
  if (SIDES.some((s) => px(cs.getPropertyValue(`border-${s}-width`)) > 0 && !/none|hidden/.test(cs.getPropertyValue(`border-${s}-style`)) && !clear(cs.getPropertyValue(`border-${s}-color`)))) return true
  for (const node of el.childNodes) if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true
  return false
}

// an element for a message: its tag and its first class of its own (div.card), not the engine's
function named(el: Element) {
  const own = [...el.classList].find((c) => !c.startsWith('ar-'))
  return own ? `${el.localName}.${own}` : el.localName
}

interface Walk {
  k: number
  // the zone being walked, and what is found in it
  zone: Element
  zoneName: string
  found: Overflow[]
  tol: number
}

// The text sticking out of an element: its own text nodes, when its content is wider (or taller)
// than its box. Inline elements have none of their own (their box is their text's). Each line is
// taken as tall as its line-height, not as its glyphs' box: a font whose ascent and descent add
// up to more than the line-height (most do at 1.2) draws within its lines all the same.
function text(el: Element, cs: CSSStyleDeclaration, k: number): Box | null {
  if (cs.display === 'inline') return null
  const wide = el.scrollWidth > el.clientWidth + 1
  const tall = el.scrollHeight > el.clientHeight + 1
  if (!wide && !tall) return null
  let out: Box | null = null
  const range = document.createRange()
  const line = px(cs.lineHeight) * k // 'normal': 0, the glyphs' box then
  for (const node of el.childNodes) {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue
    range.selectNodeContents(node)
    for (const r of range.getClientRects()) {
      if (!r.width && !r.height) continue
      const half = (line ? Math.min(line, r.height) : r.height) / 2
      const mid = (r.top + r.bottom) / 2
      out = union(out, { l: r.left, r: r.right, t: mid - half, b: mid + half })
    }
  }
  return out
}

// What shows of what `el` holds, as one box (null: nothing): its children that paint and what is
// in them, and its own text that sticks out. Along the way, its blocks (the zone's children) and
// whatever clips are checked against their own content box.
function content(el: Element, cs: CSSStyleDeclaration, w: Walk): Box | null {
  let out = text(el, cs, w.k)
  for (const child of el.children) {
    if (child.hasAttribute('hidden') || child.hasAttribute('data-ar-bleed')) continue
    const ccs = getComputedStyle(child)
    if (ccs.display === 'none' || ccs.position === 'absolute' || ccs.position === 'fixed') continue
    if (ccs.visibility === 'hidden' || ccs.visibility === 'collapse' || parseFloat(ccs.opacity) === 0) continue
    if (ccs.display === 'contents') {
      out = union(out, content(child, ccs, w))
      continue
    }
    const opaque = child.matches(OPAQUE)
    if (opaque || paints(child, ccs)) {
      const r = child.getBoundingClientRect()
      if (r.width || r.height) out = union(out, fromRect(r))
    }
    if (opaque) continue
    let inner = content(child, ccs, w)
    if (!inner) continue
    const clipsX = ccs.overflowX !== 'visible'
    const clipsY = ccs.overflowY !== 'visible'
    if (el === w.zone || clipsX || clipsY) check(child, ccs, inner, w, el === w.zone, clipsX, clipsY)
    // what a box clips is not drawn past it: what reaches out of it is clipped on that axis
    if (clipsX || clipsY) {
      const pad = inset(child, ccs, w.k, 'padding')
      inner = {
        l: clipsX ? Math.max(inner.l, pad.l) : inner.l, r: clipsX ? Math.min(inner.r, pad.r) : inner.r,
        t: clipsY ? Math.max(inner.t, pad.t) : inner.t, b: clipsY ? Math.min(inner.b, pad.b) : inner.b,
      }
    }
    out = union(out, inner)
  }
  return out
}

// a block of the zone, or an element that clips: what shows in it past its content box
function check(el: Element, cs: CSSStyleDeclaration, inner: Box, w: Walk, block: boolean, clipsX: boolean, clipsY: boolean) {
  const over = past(inner, inset(el, cs, w.k, 'content'), w.k)
  const n = block ? [...el.parentElement!.children].filter((c) => !c.hasAttribute('hidden')).indexOf(el) + 1 : 0
  const box = block ? `block ${n} of ${w.zoneName} (${named(el)})` : `a ${named(el)} in ${w.zoneName}`
  for (const side of SIDES) {
    if (!(over[side] > w.tol)) continue
    const cut = side === 'left' || side === 'right' ? clipsX : clipsY
    w.found.push({ box, side, px: Math.round(over[side]), ...(cut && { where: 'cut' }) })
  }
}

const ZONES = ':scope > :is(.ar-header, .ar-body, .ar-zone)'
const zoneName = (z: Element) => z.classList.contains('ar-body') ? 'the body'
  : z.classList.contains('ar-header') ? 'the header'
  : `the zone #${[...z.classList].find((c) => c.startsWith('ar-zone-'))?.slice('ar-zone-'.length) ?? '?'}`

/**
 * What overflows on the slide (its section), as laid out now: [] when everything fits. With
 * 'body', the body alone (Slide.fit). tol: how far past its box is still rounding (canvas px). A
 * slide not drawn (display: none) has nothing to measure.
 */
export function measureSlide(slide: HTMLElement, only?: 'body', tol = TOLERANCE): Overflow[] {
  if (!slide.offsetWidth) return []
  const edge = fromRect(slide.getBoundingClientRect())
  const k = (edge.r - edge.l) / slide.offsetWidth || 1
  const area = inset(slide, getComputedStyle(slide), k, 'content') // inside the slide's padding: where its zones go
  // the footer's band, when it shows: what ends in it is under the footer
  const footer = slide.querySelector<HTMLElement>(':scope > .ar-footer')
  const band = footer && getComputedStyle(footer).display !== 'none' ? footer.getBoundingClientRect().top : null
  const found: Overflow[] = []
  for (const zone of slide.querySelectorAll(ZONES)) {
    if (only === 'body' && !zone.classList.contains('ar-body')) continue
    const zcs = getComputedStyle(zone)
    if (zcs.display === 'none' || zcs.visibility === 'hidden' || parseFloat(zcs.opacity) === 0) continue
    const name = zoneName(zone)
    const w: Walk = { k, zone, zoneName: name, found: [], tol }
    const inner = content(zone, zcs, w)
    if (!inner) continue
    // what shows past the zone's content box, and past the slide's padding, grown by as much as a
    // negative margin pulls the zone out
    const out = (side: string) => Math.max(0, -px(zcs.getPropertyValue(`margin-${side}`))) * k
    const room = { l: area.l - out('left'), t: area.t - out('top'), r: area.r + out('right'), b: area.b + out('bottom') }
    const held = past(inner, inset(zone, zcs, k, 'content'), k)
    const placed = past(inner, room, k)
    for (const side of SIDES) {
      const over = Math.max(held[side], placed[side])
      if (!(over > tol)) continue
      const o: Overflow = { box: name, side, px: Math.round(over) }
      if (side === 'bottom') o.where = inner.b > edge.b + tol * k ? 'edge' : band != null && inner.b > band + tol * k ? 'footer' : 'margin'
      found.push(o)
    }
    // a block's or a clipping element's overflow on a side its zone already overflows is that one
    const said = new Set(found.filter((o) => o.box === name).map((o) => o.side))
    found.push(...w.found.filter((o) => !said.has(o.side)))
  }
  return found
}

/**
 * What Slide.fit did: the factor applied (1: whole), whether the body fits at it, and whether
 * shrinking helped with all of what overflows at the bottom and on the right (false: some of it is
 * sized in px, or transformed, and does not shrink with the text).
 */
export interface FitResult { scale: number; fits: boolean; helps: boolean }
// what Slide.fit acts on: what spills past the body's room at the bottom and on the right. At the
// top and on the left, content is placed there (a negative margin, a transform): shrinking the
// text does not bring it back
type Shrinks = 'bottom' | 'right'
const SHRINKS: readonly Shrinks[] = ['bottom', 'right']
const shrinks = (side: Side): side is Shrinks => side === 'bottom' || side === 'right'
// how far what shows in the body spills on those sides, canvas px (0: it does not)
function spill(slide: HTMLElement): Record<Shrinks, number> {
  const s = { bottom: 0, right: 0 }
  for (const o of measureSlide(slide, 'body', FIT_TOLERANCE)) if (shrinks(o.side)) s[o.side] = Math.max(s[o.side], o.px)
  return s
}

/**
 * Slide.fit: on a slide with the class fit, the body's text (its font-size, which what is in em
 * follows) shrunk just enough for the body to fit, down to FIT_MIN, as --_ar-fit on the body
 * (utilities.css). Measured from the size it would have, so it grows back when there is room
 * again. A slide without .fit is never touched (its --_ar-fit, if a .fit it had left one, goes).
 * Only what spills at the bottom and on the right counts, and only where shrinking helps: if at
 * FIT_MIN a side spills no less than at full size (a block sized in px, a transform), that side is
 * not fitted, and if no side gets better, the body stays whole (helps: false, a warning says so).
 * → null for a slide without .fit (or without a body); else what it did (FitResult).
 */
export function fitSlide(slide: HTMLElement): FitResult | null {
  const body = slide.querySelector<HTMLElement>(':scope > .ar-body')
  if (!body) return null
  const was = parseFloat(body.style.getPropertyValue('--_ar-fit')) || 1
  const set = (v: number) => (v >= 1 ? body.style.removeProperty('--_ar-fit') : body.style.setProperty('--_ar-fit', v.toFixed(3)))
  if (!slide.classList.contains('fit')) {
    if (was !== 1) set(1)
    return null
  }
  if (!slide.offsetWidth) return { scale: was, fits: true, helps: true } // not drawn: nothing to measure
  const at = (v: number) => {
    set(v)
    return spill(slide)
  }
  const clean = (s: Record<Shrinks, number>, sides: readonly Shrinks[]) => sides.every((side) => !s[side])
  // as it is already, if nothing spills and a little more would (or it is whole): nothing to change
  if (clean(spill(slide), SHRINKS)) {
    if (was >= 1) return { scale: 1, fits: true, helps: true }
    const more = clean(at(Math.min(1, was + 0.01)), SHRINKS)
    set(was)
    if (!more) return { scale: was, fits: true, helps: true }
  }
  const whole = at(1)
  if (clean(whole, SHRINKS)) return { scale: 1, fits: true, helps: true }
  const least = at(FIT_MIN)
  // the sides shrinking helps with: those that spill less at FIT_MIN than whole
  const helped = SHRINKS.filter((side) => whole[side] > 0 && least[side] < whole[side] - 1)
  const stuck = SHRINKS.some((side) => whole[side] > 0 && !helped.includes(side))
  if (!helped.length) {
    set(1)
    return { scale: 1, fits: false, helps: false }
  }
  if (!clean(least, helped)) return { scale: FIT_MIN, fits: false, helps: !stuck }
  // the largest factor at which what shrinking helps with no longer spills, to within 1 %
  let lo = FIT_MIN
  let hi = 1
  while (hi - lo > 0.01) {
    const mid = (lo + hi) / 2
    if (clean(at(mid), helped)) lo = mid
    else hi = mid
  }
  set(lo)
  return { scale: Number(lo.toFixed(3)), fits: !stuck, helps: !stuck }
}

// one side of a box's overflow in words: "by 46px at the bottom, under the footer"
function say(o: Overflow) {
  const where = o.where === 'footer' ? ', under the footer'
    : o.where === 'margin' ? ', into the bottom margin'
    : o.where === 'edge' ? ', past the slide\'s edge (cut off)'
    : o.where === 'cut' ? ', cut off at its edge'
    : ''
  return `by ${o.px}px at the ${o.side}${where}`
}

/**
 * What measureSlide found, in words, the zones first, one part per box (split by ;): "the body
 * overflows by 46px at the bottom, under the footer; block 2 of the body (div) overflows by 20px
 * at the right, and by 20px at the left".
 */
export function describeOverflow(found: readonly Overflow[]) {
  const boxes = new Map<string, Overflow[]>()
  for (const o of found) boxes.set(o.box, [...(boxes.get(o.box) ?? []), o])
  return [...boxes].map(([box, sides]) => `${box} overflows ${sides.map(say).join(', and ')}`).join('; ')
}

/**
 * A way to fix an overflow, and which: usual, the fit, the scales or fewer blocks (too much at the
 * bottom or on the right); floor, Slide.fit at FIT_MIN and still too much; stuck, Slide.fit could
 * not shrink it (sized in px, transformed); placed, past the top or the left (and not past the
 * bottom or the right too, as centred content too big is), where content is put, not pushed.
 */
export type FixKind = 'usual' | 'floor' | 'stuck' | 'placed'
export interface Fix { kind: FixKind; text: string }
const FIXES: Record<FixKind, string> = {
  usual: 'to fit it: Slide.fit (shrinks the body\'s text just enough), a .scale-90, .scale-80 or .scale-70 class on the slide or on a block, or fewer blocks',
  floor: `Slide.fit shrank its body to ${Math.round(FIT_MIN * 100)}%, its floor, and it still does not fit: fewer blocks, less text, or two slides`,
  stuck: 'Slide.fit cannot shrink it (it is sized in px, or transformed): make it smaller, or fewer blocks',
  placed: 'past the top or the left it is placed, not pushed (a negative margin, a transform): if it is meant to reach out (a decoration), give it position: absolute or data-ar-bleed; else move it back in',
}

/** How to fix what measureSlide found, given what fitSlide did (null: no .fit on the slide). */
export function overflowFixes(found: readonly Overflow[], fit: FitResult | null): Fix[] {
  const fixes: Fix[] = []
  if (found.some((o) => shrinks(o.side))) {
    const kind: FixKind = fit && !fit.helps ? 'stuck' : fit && !fit.fits ? 'floor' : 'usual'
    fixes.push({ kind, text: FIXES[kind] })
  }
  // past the top or the left, and not past the bottom or the right as well (centred content too big
  // spills on both sides: that one is too much, not placed)
  const opposite = { top: 'bottom', left: 'right', bottom: 'top', right: 'left' } as const
  if (found.some((o) => !shrinks(o.side) && !found.some((p) => p.box === o.box && p.side === opposite[o.side]))) fixes.push({ kind: 'placed', text: FIXES.placed })
  return fixes
}

/** Fixes as sentences: "To fit it: …. Past the top …." */
export const sayFixes = (fixes: readonly Fix[]) => fixes.map((f) => `${f.text[0].toUpperCase()}${f.text.slice(1)}.`).join(' ')
