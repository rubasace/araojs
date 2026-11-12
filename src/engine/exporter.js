import { nextTick } from 'vue'

// Export mode: the deck as a book of pages for printing to PDF (npm run export, or the browser's
// own Print → Save as PDF on the same URL). Every page is exactly the canvas size, unscaled.
//   ?export             one page per slide, the slide as it stands at its last step: every
//                       v-step revealed, its snippets at their last highlight. What shows only at
//                       an earlier step (v-step.only) is not on it: that is what &per-step is for.
//   ?export&per-step    one page per step of every slide
//   &notes              after the page(s) of a slide with speaker notes, a page with its notes
//   &theme=name         as anywhere (a name that is not one of the deck's themes is an error)
// No controls, no keyboard, no cursor hiding, no transitions or animations, and the window
// joins no other window of the deck (sync.js). Components can tell: useDeck().role is 'export'.
//
// How: the deck is rendered once, as usual, and walked page by page; at each page the slide on
// screen and the addons over it (slide number, progress…) are copied into the book as they
// stand. The copies are static DOM, so what does not survive a copy is not printed as shown:
// pixels drawn by script (canvas, WebGL), video frames, iframes, shadow DOM, and references by
// element id (an SVG gradient url(#id): ids repeat in the book, the first one wins).
//
// Ready: window.__phoenyxReady = { pages, slides, steps, width, height, missing } once every page
// is in the book with its fonts and pictures loaded (missing: names of pictures shown as
// placeholders); { error } if the export cannot be made.
// Content that arrives late marks itself with the attribute data-ph-busy while it does (Snippet
// until its colours are in, Img until its picture has loaded or failed); a page is copied once
// its slide and the addons have none left. Any component may do the same:
//   div(:data-ph-busy="loading ? '' : undefined")
// A page still busy after BUSY_MS is copied as it is, with a warning.

const BUSY_MS = 15000
const SLIDE = '[data-ph-slide]'

export function exportOptions(query) {
  return query.has('export') ? { perStep: query.has('per-step'), notes: query.has('notes') } : null
}

export function reportReady(value) {
  window.__phoenyxReady = value
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms))

// whatever is busy on this page: inside its slide, or outside every slide (an addon)
function busy(canvas, id) {
  for (const el of canvas.querySelectorAll('[data-ph-busy]')) {
    const host = el.closest(SLIDE)
    if (!host || host.dataset.phSlide === id) return true
  }
  return false
}
async function settle(canvas, id) {
  const end = performance.now() + BUSY_MS
  for (;;) {
    // the render, then whatever it set off for later (watchers, nextTick callbacks), then theirs
    await nextTick()
    await pause(0)
    await nextTick()
    if (!busy(canvas, id)) return true
    if (performance.now() > end) return false
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
async function pictures(book) {
  const urls = new Set()
  for (const el of book.querySelectorAll('*')) {
    const bg = getComputedStyle(el).backgroundImage
    if (bg !== 'none') for (const [, u] of bg.matchAll(/url\("(.+?)"\)/g)) urls.add(u)
  }
  const load = (img) => img.decode().catch(() => {}) // one that fails prints as the browser draws it
  await Promise.all([
    ...[...book.querySelectorAll('img')].map(load),
    ...[...urls].map((u) => Object.assign(new Image(), { src: u })).map(load),
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
  for (let i = 0; i < stage.list.length; i++) {
    const total = stage.list[i].steps.value
    steps += total
    for (let s = perStep ? 1 : total; s <= total; s++) {
      stage.place(i, s)
      const slide = stage.list[i].el.value
      if (!(await settle(canvas, slide.dataset.phSlide)))
        console.warn(`[phoenyx] export: slide ${i + 1}, step ${s} still loading after ${BUSY_MS / 1000} s: printed as it is`)
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
  await pictures(book)
  await document.fonts.ready
  const missing = [...new Set([...book.querySelectorAll('.ph-img-missing .ph-img-file')].map((el) => el.textContent))]
  return { pages, slides: stage.list.length, steps, width, height, missing }
}
