import { computed, getCurrentInstance, inject, onBeforeUnmount, onMounted, ref, toValue, watch } from 'vue'
import { SLIDE } from '../core/registry'
import { scopesVersion, stepOffset } from '../directives/step'

// For components inside a <Slide> that change *within* the slide (highlight, dim, count…)
// instead of just appearing: read the slide's step and declare how many steps you need.
//   const slide = useSlide()
//   slide.step.value          → current step of this slide (1-based)
//   slide.requireSteps(4)     → the slide has at least 4 steps (same as a v-step="4")
// requireSteps accepts a number, ref or getter; it follows changes and is released on unmount.
// The slide's total is always the max over every v-step and every requireSteps.
// Inside a v-step-from="n" scope both are relative (step 1 = step n of the slide), like v-step;
// the offset is read from the DOM once the component is mounted.
export function useSlide() {
  const slide = inject(SLIDE, null)
  if (!slide) throw new Error('[arao] useSlide() must be used inside <Slide>')

  const releases = []
  const instance = getCurrentInstance()
  const offset = ref(0)
  if (instance) {
    onBeforeUnmount(() => releases.splice(0).forEach((r) => r()))
    const read = () => {
      let el = instance.vnode.el
      while (el && el.nodeType !== 1) el = el.parentElement ?? el.nextSibling // fragment/text roots
      // the component's own root may carry v-step-from: it applies to what the component renders
      offset.value = el ? stepOffset(el) + (el.dataset?.arStepFrom ? Number(el.dataset.arStepFrom) - 1 : 0) : 0
    }
    onMounted(() => { read(); watch(scopesVersion, read) })
  }

  return {
    step: computed(() => slide.step.value - offset.value),
    requireSteps(n) {
      let release = () => {}
      const stop = watch(() => (Number(toValue(n)) || 1) + offset.value, (v) => {
        release()
        release = slide.registerStep(v)
      }, { immediate: true })
      const dispose = () => { stop(); release() }
      releases.push(dispose)
      return dispose
    },
  }
}
