import { effect, ref, stop, type ComputedRef, type Directive, type DirectiveBinding, type ObjectDirective } from 'vue'
import { flip, snapshot, type Gliding } from '../core/flip'

// v-step="n"       → visible from step n of its slide on
// v-step.only="n"  → visible only at step n
// .collapse         → while hidden it takes no space (default: it keeps its place);
//                     when it appears or disappears, the elements around it glide (FLIP)
// The element may live in any nested component: it finds its slide through the DOM. Inside Notes
// it works the same, but adds no step to its slide.
//
// v-step-from="n" on any element or component shifts every v-step (and useSlide) inside it:
// their numbers become relative, 1 = step n of the slide. Scopes nest and add up. This lets a
// component number its own steps from 1 and be placed at any point of a slide:
//   Card(v-step-from="5")   →   li(v-step="1") inside Card shows at step 5, v-step="2" at 6…
const HIDDEN = 'ar-step-hidden'
const COLLAPSED = 'ar-step-collapsed'

// Slides by id, so v-step can find the slide that contains it from the DOM (its section carries
// data-ar-slide="<id>"). Each slide adds itself (state/slide.ts):
//   const remove = addSlide(id, { step, active, still, elements, registerStep })
// what a slide gives its v-steps (state/slide.ts)
export interface StepSlide {
  step: ComputedRef<number>
  active: ComputedRef<boolean>
  still: boolean
  elements: Set<StepElement>
  registerStep: (n: number) => () => void
}
type StepBinding = DirectiveBinding<number | string, 'only' | 'collapse'>
interface StepRecord {
  n: number
  only: boolean
  cls: string
  host: HTMLElement
  slide: StepSlide
  binding: StepBinding
  dispose(): void
}
// an element with v-step: its record, kept on it; __vnode is Vue's own (read by sweep)
export type StepElement = Gliding & { __phStep?: StepRecord; __vnode?: { dirs?: { dir: unknown }[] | null } }

const slides = new Map<string, StepSlide>()
export function addSlide(id: string, slide: StepSlide) {
  slides.set(id, slide)
  return () => slides.delete(id)
}

// Sum of the v-step-from scopes between el (exclusive) and its slide.
export function stepOffset(el: Element | null | undefined, host: Element | null | undefined = el?.closest?.('[data-ar-slide]')) {
  let off = 0
  for (let e = el?.parentElement; e && e !== host; e = e.parentElement) {
    if (e.dataset.arStepFrom) off += Number(e.dataset.arStepFrom) - 1
  }
  return off
}
// bumped whenever a v-step-from scope changes, so useSlide() consumers re-read their offset
export const scopesVersion = ref(0)

function attach(el: StepElement, binding: StepBinding) {
  const host = el.closest<HTMLElement>('[data-ar-slide]')
  const slide = host && slides.get(host.dataset.arSlide!)
  if (!host || !slide) {
    console.warn('[arao] v-step used outside a <Slide>', el)
    return
  }
  const n = Number(binding.value) + stepOffset(el, host)
  const only = !!binding.modifiers.only
  const cls = binding.modifiers.collapse ? COLLAPSED : HIDDEN
  // inside Notes (data-ar-notes) it follows the slide's steps and adds none: the notes are drawn
  // in the presenter view only, and the audience must count the same steps. It says its step on
  // the element, for the export's notes pages (they print every step of the notes, labelled)
  const inNotes = !!el.closest('[data-ar-notes]')
  const unregister = inNotes ? () => {} : slide.registerStep(n)
  if (inNotes) {
    el.dataset.arStep = String(n)
    if (only) el.dataset.arStepOnly = ''
  }
  // its dispose is added below, before anything can read it (the effect's first run toggles plainly)
  const rec = { n, only, cls, host, slide, binding } as StepRecord
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
      delete el.dataset.arStep
      delete el.dataset.arStepOnly
    },
  })
}

// Collapsed steps change layout, so their toggles are batched per slide: First is read before
// the first toggle of a step change, the toggles are applied together a microtask later, then
// everything glides from First to its new place. Slides not on screen (or arriving) just switch,
// and so does every slide with reduced motion or in export mode (slide.still).
const batches = new Map<HTMLElement, Map<StepElement, { rec: StepRecord; hidden: boolean }>>() // slide element → Map(el → { rec, hidden })
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function collapse(el: StepElement, rec: StepRecord, hidden: boolean) {
  const { host, slide } = rec
  let batch = batches.get(host)
  if ((batch?.get(el)?.hidden ?? el.classList.contains(COLLAPSED)) === hidden) return
  if (!batch) {
    // style.display is still the old render here: was this slide already on screen?
    if (!slide.active.value || host.style.display === 'none' || still() || slide.still) {
      el.classList.toggle(COLLAPSED, hidden)
      return
    }
    const roots = [...slide.elements].filter((e) => e.__phStep?.cls === COLLAPSED)
    const first = snapshot(host, roots)
    const fresh = new Map<StepElement, { rec: StepRecord; hidden: boolean }>()
    batch = fresh
    batches.set(host, fresh)
    queueMicrotask(() => {
      batches.delete(host)
      flip(host, first, () => {
        const appeared: StepElement[] = []
        for (const [e, { rec, hidden }] of fresh) {
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

function detach(el: StepElement) {
  el.__phStep?.dispose()
  delete el.__phStep
}

const step: ObjectDirective<StepElement, number | string, 'only' | 'collapse'> = {
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
export function sweep(elements: Set<StepElement>) {
  for (const el of [...elements]) {
    if (!el.__vnode?.dirs?.some((d) => d.dir === step)) detach(el)
  }
}

// v-step-from: marks the element as a step scope. Set in 'created' so that it is already there
// when the v-steps inside it attach (their 'mounted' runs after the parent's 'created').
function fromValue(binding: DirectiveBinding<number | string>) {
  const n = Number(binding.value)
  if (Number.isInteger(n) && n >= 1) return n
  console.warn(`[arao] v-step-from="${binding.value}" must be an integer ≥ 1; using 1`)
  return 1
}
export const stepFrom: ObjectDirective<HTMLElement, number | string> = {
  created(el, binding) {
    el.dataset.arStepFrom = String(fromValue(binding))
  },
  updated(el, binding) {
    const n = String(fromValue(binding))
    if (el.dataset.arStepFrom === n) return
    el.dataset.arStepFrom = n
    for (const d of el.querySelectorAll<StepElement>('*')) {
      if (d.__phStep) { const b = d.__phStep.binding; detach(d); attach(d, b) }
    }
    scopesVersion.value++
  },
  beforeUnmount(el) {
    delete el.dataset.arStepFrom
  },
}

export default step as Directive<StepElement, number | string, 'only' | 'collapse'>
