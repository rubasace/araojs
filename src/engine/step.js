import { effect, ref, stop } from 'vue'
import { slides } from './registry'
import { flip, snapshot } from './flip'

// v-step="n"       → visible from step n of its slide on
// v-step.only="n"  → visible only at step n
// .collapse         → while hidden it takes no space (default: it keeps its place);
//                     when it appears or disappears, the elements around it glide (FLIP)
// The element may live in any nested component: it finds its slide through the DOM.
//
// v-step-from="n" on any element or component shifts every v-step (and useSlide) inside it:
// their numbers become relative, 1 = step n of the slide. Scopes nest and add up. This lets a
// component number its own steps from 1 and be placed at any point of a slide:
//   Card(v-step-from="5")   →   li(v-step="1") inside Card shows at step 5, v-step="2" at 6…
const HIDDEN = 'ph-step-hidden'
const COLLAPSED = 'ph-step-collapsed'

// Sum of the v-step-from scopes between el (exclusive) and its slide.
export function stepOffset(el, host = el?.closest?.('[data-ph-slide]')) {
  let off = 0
  for (let e = el?.parentElement; e && e !== host; e = e.parentElement) {
    if (e.dataset.phStepFrom) off += Number(e.dataset.phStepFrom) - 1
  }
  return off
}
// bumped whenever a v-step-from scope changes, so useSlide() consumers re-read their offset
export const scopesVersion = ref(0)

function attach(el, binding) {
  const host = el.closest('[data-ph-slide]')
  const slide = host && slides.get(host.dataset.phSlide)
  if (!slide) {
    console.warn('[phoenyx] v-step used outside a <Slide>', el)
    return
  }
  const n = Number(binding.value) + stepOffset(el, host)
  const only = !!binding.modifiers.only
  const cls = binding.modifiers.collapse ? COLLAPSED : HIDDEN
  const unregister = slide.registerStep(n)
  const rec = { n, only, cls, host, slide, binding }
  let first = true
  const runner = effect(() => {
    const s = slide.step.value
    const hidden = !(only ? s === n : s >= n)
    if (cls === COLLAPSED && !first) collapse(el, rec, hidden)
    else el.classList.toggle(cls, hidden)
    first = false
  })
  slide.elements.add(el)
  el.__phStep = Object.assign(rec, {
    dispose() {
      stop(runner)
      unregister()
      slide.elements.delete(el)
      el.classList.remove(cls)
    },
  })
}

// Collapsed steps change layout, so their toggles are batched per slide: First is read before
// the first toggle of a step change, the toggles are applied together a microtask later, then
// everything glides from First to its new place. Slides not on screen (or arriving) just switch,
// and so does every slide with reduced motion or in export mode (slide.still).
const batches = new Map() // slide element → Map(el → { rec, hidden })
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function collapse(el, rec, hidden) {
  const { host, slide } = rec
  let batch = batches.get(host)
  if ((batch?.get(el)?.hidden ?? el.classList.contains(COLLAPSED)) === hidden) return
  if (!batch) {
    // style.display is still the old render here: was this slide already on screen?
    if (!slide.active.value || host.style.display === 'none' || still() || slide.still) return el.classList.toggle(COLLAPSED, hidden)
    const roots = [...slide.elements].filter((e) => e.__phStep?.cls === COLLAPSED)
    const first = snapshot(host, roots)
    batch = new Map()
    batches.set(host, batch)
    queueMicrotask(() => {
      batches.delete(host)
      flip(host, first, () => {
        const appeared = []
        for (const [e, { rec, hidden }] of batch) {
          if (e.__phStep !== rec) continue // detached or rebound meanwhile
          if (!hidden && e.classList.contains(COLLAPSED)) appeared.push(e)
          e.classList.toggle(COLLAPSED, hidden)
        }
        return appeared
      })
    })
  }
  batch.set(el, { rec, hidden })
}

function detach(el) {
  el.__phStep?.dispose()
  delete el.__phStep
}

const step = {
  mounted: attach,
  updated(el, binding) {
    const cur = el.__phStep
    const cls = binding.modifiers.collapse ? COLLAPSED : HIDDEN
    const n = Number(binding.value) + stepOffset(el, cur?.host)
    if (cur && cur.n === n && cur.only === !!binding.modifiers.only && cur.cls === cls) return
    detach(el)
    attach(el, binding)
  },
  beforeUnmount: detach,
}

// Vue calls no hook when a directive is *removed* from an element it reuses
// (e.g. editing a template with HMR). The slide calls this after each render.
export function sweep(elements) {
  for (const el of [...elements]) {
    if (!el.__vnode?.dirs?.some((d) => d.dir === step)) detach(el)
  }
}

// v-step-from: marks the element as a step scope. Set in 'created' so that it is already there
// when the v-steps inside it attach (their 'mounted' runs after the parent's 'created').
function fromValue(binding) {
  const n = Number(binding.value)
  if (Number.isInteger(n) && n >= 1) return n
  console.warn(`[phoenyx] v-step-from="${binding.value}" must be an integer ≥ 1; using 1`)
  return 1
}
export const stepFrom = {
  created(el, binding) {
    el.dataset.phStepFrom = fromValue(binding)
  },
  updated(el, binding) {
    const n = String(fromValue(binding))
    if (el.dataset.phStepFrom === n) return
    el.dataset.phStepFrom = n
    for (const d of el.querySelectorAll('*')) {
      if (d.__phStep) { const b = d.__phStep.binding; detach(d); attach(d, b) }
    }
    scopesVersion.value++
  },
  beforeUnmount(el) {
    delete el.dataset.phStepFrom
  },
}

export default step
