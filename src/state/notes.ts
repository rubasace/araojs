import { computed, inject, provide, shallowRef, type InjectionKey, type ShallowRef } from 'vue'
import { useSlideForNotes } from './slide'

// Speaker notes: where they are drawn. One symbol, two sides.
//   const outlet = useNotesOutlet()       whoever draws notes (the presenter view, the export):
//   <div ref="outlet"></div>              the element it puts that ref on receives them
//   const { target, drawn } = useNotesTarget()   Notes: where to send its content, and whether to
//                                         (an outlet exists above it and its slide is the one on
//                                         screen in the main stage)
// Notes never know who draws them; a view without an outlet simply shows none.
const OUTLET: InjectionKey<ShallowRef<HTMLElement | null>> = Symbol('arao-notes-outlet')

export function useNotesOutlet() {
  const el = shallowRef<HTMLElement | null>(null)
  provide(OUTLET, el)
  return el
}

// the presenter view also draws the deck a step ahead (the preview): only the main stage's notes go
const MAIN = new Set<string>(['presenter', 'export'])

export function useNotesTarget() {
  const outlet = inject(OUTLET, null)
  const slide = useSlideForNotes()
  const target = computed(() => outlet?.value ?? null)
  const drawn = computed(() => !!target.value && !!slide && MAIN.has(slide.role) && slide.active.value)
  return { target, drawn, inSlide: !!slide, slideId: slide?.id }
}
