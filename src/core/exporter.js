import { nextTick } from 'vue'

// Export mode: the deck as a book of pages for printing to PDF (npm run export, or the browser's
// own Print → Save as PDF on the same URL). Every page is exactly the canvas size, unscaled.
//   ?export             one page per step of every slide (the default: &per-step says the same,
//                       and &per-step=0 does not change it; only &per-slide does)
//   ?export&per-slide   one page per slide, the slide as it stands at its last step: every
//                       v-step revealed, its snippets at their last highlight. What shows only at
//                       an earlier step (v-step.only) is not on it.
//   &notes              after the page(s) of a slide with speaker notes, a page with its notes
//   &theme=name         as anywhere (a name that is not one of the deck's themes is an error)
// A flag set to 0, false, no or off is not set: ?export=0 is the deck as usual.
// No controls, no keyboard, no cursor hiding, no transitions or animations, and the window
// joins no other window of the deck (sync.js). Components can tell: useDeck().role is 'export'.
//
// How: the deck is rendered once, as usual, and walked page by page; at each page the slide on
// screen and the addons over it (slide number, progress…) are copied into the book as they
// stand. The copies are static DOM, so what does not survive a copy is not printed as shown:
// pixels drawn by script (canvas, WebGL), video frames, iframes, shadow DOM, and references by
// element id (an SVG gradient url(#id): ids repeat in the book, the first one wins).
// What Chromium prints differently from what it shows, and the book works around:
//   - a page is one piece (engine.css, .ar-page): otherwise content whose box reaches past the
//     bottom of its page, even clipped or moved back up by a transform, is split there and the
//     part above the break is drawn as a box of its own;
//   - blurred box-shadows are redrawn as pictures (printableShadows below): Chromium prints them
//     as soft masks that some readers (macOS Preview, Quick Look) draw as solid boxes;
//   - blurred (filtered) pictures are drawn with their filter beforehand (printableFilters below):
//     Chromium blurs only what is inside the clip, and the edge of the blur shows.
// A blurred text-shadow stays a soft mask: see the reference, Export.
//
// Ready: window.__araoReady = { pages, slides, steps, width, height, missing, stalled } once
// every page is in the book with its fonts and pictures loaded; { error } if the export cannot be
// made (with code: 'theme-not-listed' and the deck's themes when the theme is not one of them).
// missing: names of pictures shown as placeholders (they failed). stalled: what was still on its
// way when printed (it neither loaded nor failed in time), printed as it stood.
// Content that arrives late marks itself with the attribute data-ar-busy while it does (Snippet
// until its colours are in, Img until its picture has loaded or failed); a page is copied once
// its slide and the addons have none left. Any component may do the same:
//   div(:data-ar-busy="loading ? '' : undefined")
// A page still busy after BUSY_MS is copied as it is, with a warning. The attribute may name what
// it waits for (Img: its picture's URL): what one page gave up on, no later page waits for again,
// and it is reported in stalled. Unnamed (''), every page waits for it in full.

const BUSY_MS = 15000
// a picture of the finished book still on its way after this long is let go (and is stalled)
const PICTURE_MS = 5000
const SLIDE = '[data-ar-slide]'

// a flag of the URL: there, and not 0/false/no/off
const flag = (query, name) => query.has(name) && !/^(0|false|no|off)$/i.test(query.get(name))

export function exportOptions(query) {
  return flag(query, 'export') ? { perStep: !flag(query, 'per-slide'), notes: flag(query, 'notes') } : null
}

export function reportReady(value) {
  window.__araoReady = value
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms))

// what this page still waits for: the busy elements inside its slide or outside every slide (an
// addon), less those named in `stalled` (given up on already)
function waiting(canvas, id, stalled) {
  return [...canvas.querySelectorAll('[data-ar-busy]')].filter((el) => {
    const host = el.closest(SLIDE)
    return (!host || host.dataset.arSlide === id) && !stalled.has(el.dataset.arBusy)
  })
}
// [] once nothing is busy; what still is, after BUSY_MS
async function settle(canvas, id, stalled) {
  const end = performance.now() + BUSY_MS
  for (;;) {
    // the render, then whatever it set off for later (watchers, nextTick callbacks), then theirs
    await nextTick()
    await pause(0)
    await nextTick()
    const left = waiting(canvas, id, stalled)
    if (!left.length || performance.now() > end) return left
    await pause(16)
  }
}

// the canvas as it is now, with only the slide on screen in it (addons included)
function copyCanvas(canvas, slide) {
  const copy = canvas.cloneNode(false)
  for (const child of canvas.children) {
    if (child === slide) copy.append(child.cloneNode(true))
    else if (!child.matches(SLIDE)) {
      const c = child.cloneNode(true)
      // a component wrapping slides: keep the one on screen, if it is one of them
      for (const s of c.querySelectorAll(SLIDE)) if (s.dataset.arSlide !== slide.dataset.arSlide) s.remove()
      copy.append(c)
    }
  }
  return copy
}

function page(width, height, cls, ...children) {
  const el = document.createElement('div')
  el.className = cls
  el.style.width = `${width}px`
  el.style.height = `${height}px`
  el.append(...children)
  return el
}

// ---- blurred box-shadows, redrawn as pictures ---------------------------------------------
// Chromium prints a blurred box-shadow (inset or not) as a fill through a soft mask of the
// graphics state, the blur being a greyscale picture inside that mask. pdf.js, PDFium and MuPDF
// apply it; macOS Preview and Quick Look do not, and draw the shadow's whole box as a solid
// square of its colour. A picture with an alpha channel, on the other hand, every reader draws.
// So each element of a page with a blurred shadow gets that shadow drawn on a canvas, in canvas
// px at SHADOW_SCALE, and painted as its border-image, outset over the shadow's extent, in place
// of the box-shadow. A border-image is painted with the element's own background and border:
// the same place in the painting order as the shadow, under the same transforms, opacity and
// clipping, not clipped by the element's own overflow, and it takes no room. It replaces the
// border, so a visible border is drawn into the picture too.
// Left as they are (printed as Chromium prints them): elements with a border-image of their own,
// a border that is not solid in one colour, a filter (Chromium already prints those as a
// picture), inline and table-part boxes. A blurred text-shadow has the same problem and no box
// to carry a picture: see the reference, Export.
const SHADOW_SCALE = 2
const SHADOW_MAX_PX = 16e6 // canvas pixels for one picture: a larger shadow gets a lower scale
const px = (v) => parseFloat(v) || 0

// "rgba(0, 0, 0, 0.3) 0px 4px 12px 0px inset, …" → [{ color, x, y, blur, spread, inset }]
function parseShadows(value) {
  const parts = []
  let depth = 0
  let start = 0
  for (let i = 0; i < value.length; i++) {
    const c = value[i]
    if (c === '(') depth++
    else if (c === ')') depth--
    else if (c === ',' && !depth) parts.push(value.slice(start, i)), (start = i + 1)
  }
  parts.push(value.slice(start))
  return parts.map((part) => {
    const tokens = part.trim().match(/[^\s(]+(?:\([^)]*\))?/g) ?? []
    const lengths = tokens.filter((t) => /^-?[\d.]+(?:e[-+]?\d+)?px$/i.test(t)).map(px)
    const color = tokens.filter((t) => t !== 'inset' && !/^-?[\d.]+(?:e[-+]?\d+)?px$/i.test(t)).join(' ')
    const [x = 0, y = 0, blur = 0, spread = 0] = lengths
    return { color: color || 'black', x, y, blur, spread, inset: tokens.includes('inset') }
  })
}

// the corner radii of a w x h border box, [tl, tr, br, bl] as { x, y } px, overlapping radii
// scaled down as CSS does
function cornerRadii(cs, w, h) {
  const corners = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((c) => {
    const [a, b = a] = cs[`border${c}Radius`].split(' ')
    const len = (v, of) => (v.endsWith('%') ? (px(v) / 100) * of : px(v))
    return { x: len(a, w), y: len(b, h) }
  })
  const [tl, tr, br, bl] = corners
  const f = Math.min(1, w / (tl.x + tr.x || 1), w / (bl.x + br.x || 1), h / (tl.y + bl.y || 1), h / (tr.y + br.y || 1))
  return f < 1 ? corners.map((r) => ({ x: r.x * f, y: r.y * f })) : corners
}

// a radius grown (or shrunk) by `d` for a shadow's spread: CSS keeps small radii sharp
function spreadRadius(r, d) {
  if (d <= 0) return Math.max(0, r + d)
  if (r >= d) return r + d
  return r + d * (1 + (r / d - 1) ** 3)
}

// radii grown by d (shrunk if negative), each as spreadRadius does
const spreadRadii = (radii, d) => radii.map((r) => ({ x: spreadRadius(r.x, d), y: spreadRadius(r.y, d) }))

function roundRect(ctx, x, y, w, h, radii) {
  ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), radii.map((r) => ({ x: Math.max(0, r.x), y: Math.max(0, r.y) })))
}

// what to draw for one element, or null to leave it as it is
function shadowPlan(el) {
  if (el instanceof SVGElement && el.ownerSVGElement) return null // inside an SVG: no CSS box
  const cs = getComputedStyle(el)
  if (cs.boxShadow === 'none' || cs.borderImageSource !== 'none' || cs.filter !== 'none') return null
  if (/^(inline|contents|none)$/.test(cs.display) || cs.display.startsWith('table-')) return null
  const shadows = parseShadows(cs.boxShadow)
  if (!shadows.some((s) => s.blur > 0)) return null // sharp shadows print as plain fills
  const sides = ['Top', 'Right', 'Bottom', 'Left'].map((s) => ({
    width: px(cs[`border${s}Width`]),
    style: cs[`border${s}Style`],
    color: cs[`border${s}Color`],
  }))
  const shown = sides.filter((s) => s.width > 0 && s.style !== 'none' && s.style !== 'hidden')
  if (shown.some((s) => s.style !== 'solid' || s.color !== shown[0].color)) return null
  const border = sides.map((s) => s.width)
  let w = px(cs.width)
  let h = px(cs.height)
  if (cs.boxSizing !== 'border-box') {
    w += px(cs.paddingLeft) + px(cs.paddingRight) + border[1] + border[3]
    h += px(cs.paddingTop) + px(cs.paddingBottom) + border[0] + border[2]
  }
  if (!(w > 0 && h > 0)) return null
  return { w, h, radii: cornerRadii(cs, w, h), shadows, border, borderColor: shown[0]?.color ?? null }
}

// the plan drawn on a canvas: a PNG (as a blob: URL) and how far it reaches out of the border
// box on each side, [top, right, bottom, left] px
async function drawShadows({ w, h, radii, shadows, border, borderColor }) {
  // the extent: each outer shadow's shape, moved and spread, plus its blur (σ = blur / 2, ~3σ)
  const reach = (s) => s.blur * 1.5 + 2
  let [top, right, bottom, left] = [0, 0, 0, 0]
  for (const s of shadows) {
    if (s.inset) continue
    top = Math.max(top, s.spread - s.y + reach(s))
    bottom = Math.max(bottom, s.spread + s.y + reach(s))
    left = Math.max(left, s.spread - s.x + reach(s))
    right = Math.max(right, s.spread + s.x + reach(s))
  }
  const out = [top, right, bottom, left].map(Math.ceil)
  const cw = w + out[1] + out[3]
  const ch = h + out[0] + out[2]
  const k = Math.min(SHADOW_SCALE, Math.sqrt(SHADOW_MAX_PX / (cw * ch)))
  const canvas = new OffscreenCanvas(Math.ceil(cw * k), Math.ceil(ch * k))
  // the scale that makes the picture exactly as large as what it is stretched over (sizes in
  // canvas px are fractional: a column of a grid), so that its edges land where the box's are
  const kx = canvas.width / cw
  const ky = canvas.height / ch
  const ctx = canvas.getContext('2d')
  ctx.setTransform(kx, 0, 0, ky, out[3] * kx, out[0] * ky) // user space: canvas px, the border box at 0,0
  // a shadow alone: its shape is drawn far to the left, off the canvas, and the shadow is cast
  // back into place (shadow offsets and blur are in device pixels, untouched by the transform)
  const far = cw + 4 * Math.max(...shadows.map((s) => s.blur), 0) + 100
  const cast = (s, shape, rule) => {
    ctx.save()
    ctx.shadowColor = s.color
    ctx.shadowBlur = s.blur * k
    ctx.shadowOffsetX = (far + s.x) * kx
    ctx.shadowOffsetY = s.y * ky
    ctx.fillStyle = '#000'
    ctx.beginPath()
    shape(-far)
    ctx.fill(rule)
    ctx.restore()
  }
  // outer shadows, the first one on top; then the border box cut out of them
  for (const s of shadows.toReversed()) {
    if (s.inset) continue
    const d = s.spread
    cast(s, (dx) => roundRect(ctx, dx - d, -d, w + 2 * d, h + 2 * d, spreadRadii(radii, d)))
  }
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  roundRect(ctx, 0, 0, w, h, radii)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  // inset shadows: inside the padding box, cast by everything outside a hole in it
  const [bt, br, bb, bl] = border
  const inner = radii.map((r, i) => ({ x: r.x - (i === 0 || i === 3 ? bl : br), y: r.y - (i < 2 ? bt : bb) }))
  const pw = w - bl - br
  const ph = h - bt - bb
  for (const s of shadows.toReversed()) {
    if (!s.inset) continue
    const d = s.spread
    ctx.save()
    ctx.beginPath()
    roundRect(ctx, bl, bt, pw, ph, inner)
    ctx.clip()
    const pad = reach(s) + Math.abs(s.x) + Math.abs(s.y) + Math.abs(d)
    cast(s, (dx) => {
      ctx.rect(dx + bl - pad, bt - pad, pw + 2 * pad, ph + 2 * pad)
      roundRect(ctx, dx + bl + d, bt + d, pw - 2 * d, ph - 2 * d, spreadRadii(inner, -d))
    }, 'evenodd')
    ctx.restore()
  }
  // the border the border-image replaces
  if (borderColor) {
    ctx.fillStyle = borderColor
    ctx.beginPath()
    roundRect(ctx, 0, 0, w, h, radii)
    roundRect(ctx, bl, bt, pw, ph, inner)
    ctx.fill('evenodd')
  }
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  return { url: URL.createObjectURL(blob), out }
}

// Redraws the blurred box-shadows of one page of the book (laid out, in the document). `drawn`
// keeps the pictures already made, by what they show: the same element on many pages is drawn once.
async function printableShadows(page, drawn) {
  const plans = []
  for (const el of page.querySelectorAll('*')) {
    const plan = shadowPlan(el)
    if (plan) plans.push([el, plan])
  }
  for (const [el, plan] of plans) {
    const key = JSON.stringify(plan)
    // one that cannot be drawn is printed as Chromium prints it
    if (!drawn.has(key)) drawn.set(key, drawShadows(plan).catch(() => null))
    const picture = await drawn.get(key)
    if (!picture) continue
    const { url, out } = picture
    el.style.setProperty('box-shadow', 'none', 'important')
    // the whole picture as the middle of a nine-slice image of zero-width borders, stretched over
    // the border box grown by `out`
    const outset = out.map((v) => `${v}px`).join(' ')
    el.style.setProperty('border-image', `url("${url}") 0 fill / 0 / ${outset} stretch`, 'important')
  }
}

// ---- filtered pictures, drawn with their filter -----------------------------------------
// Chromium prints a filtered element (Img blur, Slide bg-blur: filter: blur() on an img) by
// filtering only what is inside its clip: a blurred picture, grown past its box so that the soft
// edge of the blur falls outside the view (image.js blurStyle), prints with that edge inside,
// fading into what is behind it (a dark frame around a blurred background). So in the book each
// img with a filter of colour functions and blur gets its picture drawn on a canvas, fitted as
// object-fit and object-position say and filtered as on screen, and shows that instead, with no
// filter of its own. Left as they are: a picture that cannot be drawn on a canvas (another origin
// without CORS: the canvas would be unreadable; a browser without canvas filters), drop-shadow()
// and url() filters, an img with a border or padding.
const FILTERS = /^(?:\s*(?:blur|brightness|contrast|grayscale|hue-rotate|invert|opacity|saturate|sepia)\([^()]*\))+\s*$/

// where object-fit and object-position put a nw x nh picture in a w x h box: [x, y, width, height]
function fitted(cs, nw, nh, w, h) {
  const fit = cs.objectFit
  let s = fit === 'cover' ? Math.max(w / nw, h / nh) : fit === 'none' ? 1 : Math.min(w / nw, h / nh)
  if (fit === 'scale-down') s = Math.min(s, 1)
  const [dw, dh] = fit === 'fill' ? [w, h] : [nw * s, nh * s]
  const [px0, py0] = cs.objectPosition.split(' ')
  const at = (v, free) => (v?.endsWith('%') ? (parseFloat(v) / 100) * free : px(v))
  return [at(px0, w - dw), at(py0, h - dh), dw, dh]
}

async function drawFiltered({ src, filter, cs, w, h }) {
  const picture = new Image()
  picture.src = src
  await picture.decode()
  const { naturalWidth: nw, naturalHeight: nh } = picture
  if (!(nw > 0 && nh > 0)) throw new Error('no intrinsic size')
  const k = Math.min(SHADOW_SCALE, Math.sqrt(SHADOW_MAX_PX / (w * h)))
  const canvas = new OffscreenCanvas(Math.ceil(w * k), Math.ceil(h * k))
  const kx = canvas.width / w
  const ky = canvas.height / h
  const ctx = canvas.getContext('2d')
  if (!('filter' in ctx)) throw new Error('no canvas filters here')
  // the canvas filter is applied in canvas pixels: blur lengths scaled to them
  ctx.filter = filter.replace(/blur\(([\d.]+)px\)/g, (_, r) => `blur(${r * k}px)`)
  const [x, y, dw, dh] = fitted(cs, nw, nh, w, h)
  ctx.drawImage(picture, x * kx, y * ky, dw * kx, dh * ky)
  return URL.createObjectURL(await canvas.convertToBlob({ type: 'image/png' })) // throws if unreadable
}

async function printableFilters(page, drawn) {
  const plans = []
  for (const img of page.querySelectorAll('img')) {
    const cs = getComputedStyle(img)
    if (cs.filter === 'none' || !FILTERS.test(cs.filter)) continue
    if (['Top', 'Right', 'Bottom', 'Left'].some((s) => px(cs[`border${s}Width`]) || px(cs[`padding${s}`]))) continue
    const plan = { src: img.currentSrc || img.src, filter: cs.filter, w: px(cs.width), h: px(cs.height) }
    if (plan.src && plan.w > 0 && plan.h > 0) plans.push([img, plan, cs.objectFit, cs.objectPosition])
  }
  for (const [img, plan, objectFit, objectPosition] of plans) {
    const key = JSON.stringify([plan, objectFit, objectPosition])
    // one that cannot be drawn is printed as Chromium prints it
    if (!drawn.has(key)) drawn.set(key, drawFiltered({ ...plan, cs: { objectFit, objectPosition } }).catch(() => null))
    const url = await drawn.get(key)
    if (!url) continue
    img.removeAttribute('srcset')
    img.src = url
    for (const [k, v] of [['filter', 'none'], ['object-fit', 'fill'], ['object-position', '0 0']])
      img.style.setProperty(k, v, 'important')
  }
}

// The book's pictures, loaded and decoded before it is printed: every img (a copy is a new
// element, even if its file is cached) and every CSS background and border-image (only fetched
// when shown). One that fails prints as the browser draws it. One in `stalled` is not waited
// for, and one still on its way after PICTURE_MS joins it, by its URL.
async function pictures(book, stalled) {
  const urls = new Set()
  for (const el of book.querySelectorAll('*')) {
    const cs = getComputedStyle(el)
    for (const bg of [cs.backgroundImage, cs.borderImageSource])
      if (bg !== 'none') for (const [, u] of bg.matchAll(/url\("(.+?)"\)/g)) urls.add(u)
  }
  const load = async (img, url) => {
    const late = pause(PICTURE_MS).then(() => false)
    const done = await Promise.race([img.decode().then(() => true, () => true), late])
    if (!done && !img.complete) stalled.add(url) // not slow to decode: not even there yet
  }
  const fresh = (url) => !stalled.has(url)
  const src = (img) => img.getAttribute('src')
  await Promise.all([
    ...[...book.querySelectorAll('img')].filter((img) => fresh(src(img))).map((img) => load(img, src(img))),
    ...[...urls].filter(fresh).map((u) => load(Object.assign(new Image(), { src: u }), u)),
  ])
}

// Walks the stage and fills `book` with its pages.
//   stage    the deck's stage (state/stage.js), its role 'export'
//   canvas   its .ar-canvas element
//   notes    an element holding the notes of the slide on screen, or null for no notes pages
//   title(i) the title of slide i, for the notes pages
export async function buildBook({ stage, canvas, book, notes, title, perStep, width, height }) {
  const size = document.createElement('style')
  size.textContent = `@page { size: ${width}px ${height}px; margin: 0; }`
  document.head.append(size)

  await nextTick() // slides mounted after the deck settle their order on the next tick
  await document.fonts.ready
  let pages = 0
  let steps = 0
  const stalled = new Set() // what a page gave up on, by the name in its data-ar-busy
  const drawn = new Map() // printableShadows and printableFilters: the pictures they have made
  for (let i = 0; i < stage.list.length; i++) {
    const total = stage.list[i].steps.value
    steps += total
    for (let s = perStep ? 1 : total; s <= total; s++) {
      stage.place(i, s)
      const slide = stage.list[i].el.value
      const left = await settle(canvas, slide.dataset.arSlide, stalled)
      if (left.length) {
        const names = [...new Set(left.map((el) => el.dataset.arBusy).filter(Boolean))]
        for (const n of names) stalled.add(n)
        const what = names.length ? ` (${names.join(', ')}: not waited for again)` : ''
        console.warn(`[arao] export: slide ${i + 1}, step ${s} still loading after ${BUSY_MS / 1000} s${what}: printed as it is`)
      }
      await document.fonts.ready
      const copy = page(width, height, 'ar-page', copyCanvas(canvas, slide))
      book.append(copy)
      await printableShadows(copy, drawn)
      await printableFilters(copy, drawn)
      pages++
    }
    if (notes?.children.length) {
      const head = document.createElement('header')
      head.className = 'ar-notes-head'
      head.textContent = [`Diapositiva ${i + 1}`, title(i)].filter(Boolean).join(' · ')
      const body = notes.cloneNode(true)
      body.className = 'ar-notes-body'
      book.append(page(width, height, 'ar-page ar-notes-page', head, body))
      pages++
    }
  }
  await pictures(book, stalled)
  await document.fonts.ready
  const missing = [...new Set([...book.querySelectorAll('.ar-img-missing .ar-img-file')].map((el) => el.textContent))]
  return { pages, slides: stage.list.length, steps, width, height, missing, stalled: [...stalled] }
}
