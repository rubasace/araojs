import { getCurrentInstance, inject, onBeforeUnmount, readonly, toValue, watch } from 'vue'
import { SLIDE } from './registry'

// For components inside a <Slide> that change *within* the slide (highlight, dim, count…)
// instead of just appearing: read the slide's step and declare how many steps you need.
//   const slide = useSlide()
//   slide.step.value          → current step of this slide (1-based)
//   slide.requireSteps(4)     → the slide has at least 4 steps (same as a v-step="4")
// requireSteps accepts a number, ref or getter; it follows changes and is released on unmount.
// The slide's total is always the max over every v-step and every requireSteps.
export function useSlide() {
  const slide = inject(SLIDE, null)
  if (!slide) throw new Error('[phoenyx] useSlide() must be used inside <Slide>')

  const releases = []
  if (getCurrentInstance()) onBeforeUnmount(() => releases.splice(0).forEach((r) => r()))

  return {
    step: readonly(slide.step),
    requireSteps(n) {
      let release = () => {}
      const stop = watch(() => Number(toValue(n)) || 1, (v) => {
        release()
        release = slide.registerStep(v)
      }, { immediate: true })
      const dispose = () => { stop(); release() }
      releases.push(dispose)
      return dispose
    },
  }
}
