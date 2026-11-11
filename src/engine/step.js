import { effect, stop } from 'vue'
import { slides } from './registry'

// v-step="n"       → visible from step n of its slide on
// v-step.only="n"  → visible only at step n
// .collapse         → while hidden it takes no space (default: it keeps its place)
// The element may live in any nested component: it finds its slide through the DOM.
function attach(el, binding) {
  const host = el.closest('[data-ph-slide]')
  const slide = host && slides.get(host.dataset.phSlide)
  if (!slide) {
    console.warn('[phoenyx] v-step used outside a <Slide>', el)
    return
  }
  const n = Number(binding.value)
  const only = !!binding.modifiers.only
  const cls = binding.modifiers.collapse ? 'ph-step-collapsed' : 'ph-step-hidden'
  const unregister = slide.registerStep(n)
  const runner = effect(() => {
    const s = slide.step.value
    el.classList.toggle(cls, !(only ? s === n : s >= n))
  })
  slide.elements.add(el)
  el.__phStep = {
    n, only, cls,
    dispose() {
      stop(runner)
      unregister()
      slide.elements.delete(el)
      el.classList.remove(cls)
    },
  }
}

function detach(el) {
  el.__phStep?.dispose()
  delete el.__phStep
}

const step = {
  mounted: attach,
  updated(el, binding) {
    const cur = el.__phStep
    const cls = binding.modifiers.collapse ? 'ph-step-collapsed' : 'ph-step-hidden'
    if (cur && cur.n === Number(binding.value) && cur.only === !!binding.modifiers.only && cur.cls === cls) return
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

export default step
