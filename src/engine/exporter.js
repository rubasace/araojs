import { nextTick } from 'vue'

// Export mode: the deck as a book of pages for printing to PDF (npm run export, or the browser's
// own Print → Save as PDF on the same URL). Every page is exactly the canvas size, unscaled.
//   ?export             one page per slide, the slide as it stands at its last step: every
//                       v-step revealed, its snippets at their last highlight. What shows only at
//                       an earlier step (v-step.only) is not on it: that is what &per-step is for.
//   ?export&per-step    one page per step of every slide
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
//
// Ready: window.__phoenyxReady = { pages, slides, steps, width, height, missing, stalled } once
// every page is in the book with its fonts and pictures loaded; { error } if the export cannot be
// made. missing: names of pictures shown as placeholders (they failed). stalled: what was still
// on its way when printed (it neither loaded nor failed in time), printed as it stood.
// Content that arrives late marks itself with the attribute data-ph-busy while it does (Snippet
// until its colours are in, Img until its picture has loaded or failed); a page is copied once
// its slide and the addons have none left. Any component may do the same:
//   div(:data-ph-busy="loading ? '' : undefined")
// A page still busy after BUSY_MS is copied as it is, with a warning. The attribute may name what
// it waits for (Img: its picture's URL): what one page gave up on, no later page waits for again,
// and it is reported in stalled. Unnamed (''), every page waits for it in full.

const BUSY_MS = 15000
// a picture of the finished book still on its way after this long is let go (and is stalled)
const PICTURE_MS = 5000
const SLIDE = '[data-ph-slide]'

// a flag of the URL: there, and not 0/false/no/off
const flag = (query, name) => query.has(name) && !/^(0|false|no|off)$/i.test(query.get(name))

export function exportOptions(query) {
  return flag(query, 'export') ? { perStep: flag(query, 'per-step'), notes: flag(query, 'notes') } : null
}

export function reportReady(value) {
  window.__phoenyxReady = value
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms))

// what this page still waits for: the busy elements inside its slide or outside every slide (an
// addon), less those named in `stalled` (given up on already)
function waiting(canvas, id, stalled) {
  return [...canvas.querySelectorAll('[data-ph-busy]')].filter((el) => {
    const host = el.closest(SLIDE)
    return (!host || host.dataset.phSlide === id) && !stalled.has(el.dataset.phBusy)
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
      for (const s of c.querySelectorAll(SLIDE)) if (s.dataset.phSlide !== slide.dataset.phSlide) s.remove()
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

// The book's pictures, loaded and decoded before it is printed: every img (a copy is a new
// element, even if its file is cached) and every CSS background (only fetched when shown).
// One that fails prints as the browser draws it. One in `stalled` is not waited for, and one
// still on its way after PICTURE_MS joins it, by its URL.
async function pictures(book, stalled) {
  const urls = new Set()
  for (const el of book.querySelectorAll('*')) {
    const bg = getComputedStyle(el).backgroundImage
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
//   stage    the deck's stage (stage.js), its role 'export'
//   canvas   its .ph-canvas element
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
  const stalled = new Set() // what a page gave up on, by the name in its data-ph-busy
  for (let i = 0; i < stage.list.length; i++) {
    const total = stage.list[i].steps.value
    steps += total
    for (let s = perStep ? 1 : total; s <= total; s++) {
      stage.place(i, s)
      const slide = stage.list[i].el.value
      const left = await settle(canvas, slide.dataset.phSlide, stalled)
      if (left.length) {
        const names = [...new Set(left.map((el) => el.dataset.phBusy).filter(Boolean))]
        for (const n of names) stalled.add(n)
        const what = names.length ? ` (${names.join(', ')}: not waited for again)` : ''
        console.warn(`[phoenyx] export: slide ${i + 1}, step ${s} still loading after ${BUSY_MS / 1000} s${what}: printed as it is`)
      }
      await document.fonts.ready
      book.append(page(width, height, 'ph-page', copyCanvas(canvas, slide)))
      pages++
    }
    if (notes?.children.length) {
      const head = document.createElement('header')
      head.className = 'ph-notes-head'
      head.textContent = [`Diapositiva ${i + 1}`, title(i)].filter(Boolean).join(' · ')
      const body = notes.cloneNode(true)
      body.className = 'ph-notes-body'
      book.append(page(width, height, 'ph-page ph-notes-page', head, body))
      pages++
    }
  }
  await pictures(book, stalled)
  await document.fonts.ready
  const missing = [...new Set([...book.querySelectorAll('.ph-img-missing .ph-img-file')].map((el) => el.textContent))]
  return { pages, slides: stage.list.length, steps, width, height, missing, stalled: [...stalled] }
}
