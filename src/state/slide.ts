import { computed, getCurrentInstance, inject, onBeforeUnmount, onMounted, onUpdated, provide, reactive, ref, toValue, watch, type ComputedRef, type InjectionKey, type MaybeRefOrGetter, type Ref, type Slot } from 'vue'
import { addSlide, scopesVersion, stepOffset, sweep, type StepElement } from '../directives/step'
import { useStage, type Role } from './stage'

interface SlideContext {
  id: string
  step: ComputedRef<number>
  registerStep: (n: number) => () => void
  active: ComputedRef<boolean>
  role: Role
}
// what useSlide() gives a component inside a Slide
export interface SlideControls {
  readonly step: ComputedRef<number>
  requireSteps(n: MaybeRefOrGetter<number | string>): () => void
}

// One slide's state: its place in the stage it is drawn in, and its steps.
//   const slide = createSlide({ el, title })   in Slide.vue: el, a ref to its <section>; title, a
//                                              ref of its title prop. Registers it with its stage
//                                              (which orders it by its place in the template) and
//                                              provides it to what is inside it. drawn: whether
//                                              Slide draws its content (not in a thumbnail, but
//                                              for the cover)
//   useSlide()                                 public: for components inside a Slide (below)
//   useSlideForNotes()                         Notes: the slide it is in (state/notes.ts)
//   provideFooter(() => slots.footer)          in Deck: its #footer slot, for every slide to draw
// What reaches the slide from inside it: components through useSlide(), Notes through
// useSlideForNotes(), v-step through the DOM (directives/step.ts finds the slide by its id).
const KEY: InjectionKey<SlideContext> = Symbol('arao-slide')
const FOOTER: InjectionKey<() => Slot | undefined> = Symbol('arao-footer')
const IN_NOTES: InjectionKey<boolean> = Symbol('arao-in-notes')

export function provideFooter(get: () => Slot | undefined) {
  provide(FOOTER, get)
}

export function createSlide({ el, title }: { el: Readonly<Ref<HTMLElement | null | undefined>>; title: Readonly<Ref<string | undefined>> }) {
  const stage = useStage()
  if (!stage) throw new Error('[arao] <Slide> must be inside <Deck>')
  // export mode (core/exporter.ts) and thumbnails: no slide transition, no glide of collapsed steps
  const still = stage.role === 'export' || stage.role === 'thumbnail'
  const id = `s${Math.random().toString(36).slice(2, 9)}`

  // step numbers registered by v-step anywhere inside this slide (with multiplicity)
  const counts = reactive(new Map<number, number>())
  const steps = computed(() => Math.max(1, ...counts.keys()))

  // the stage places it by its position in the template, even when mounted after its neighbours
  const index = stage.register({ id, steps, title, el })
  const active = computed(() => stage.index.value === index.value)
  // whether its content is drawn: always, but in a thumbnail (only the cover shows there, so only
  // the cover mounts what is in it: its pictures, snippets and components)
  const drawn = computed(() => stage.role !== 'thumbnail' || active.value)
  // a slide already passed shows everything; one not reached yet shows step 1
  const step = computed(() =>
    active.value ? stage.step.value : stage.index.value > index.value ? steps.value : 1,
  )

  // the elements with v-step inside it (directives/step.ts), swept after each render: Vue calls no
  // hook when a directive is removed from an element it reuses (an edit, with HMR)
  const elements = new Set<StepElement>()
  onUpdated(() => sweep(elements))

  function registerStep(n: number) {
    counts.set(n, (counts.get(n) || 0) + 1)
    return () => {
      const c = (counts.get(n) ?? 0) - 1
      c > 0 ? counts.set(n, c) : counts.delete(n)
    }
  }
  provide(KEY, { id, step, registerStep, active, role: stage.role })
  const removeSlide = addSlide(id, { step, active, still, elements, registerStep })

  onBeforeUnmount(() => {
    removeSlide()
    stage.unregister(id)
  })

  // the Deck's #footer slot as it is now, or undefined (the slots object is updated in place)
  const footer = inject(FOOTER, () => undefined)
  return { id, index, active, drawn, step, still, total: stage.view.total, footer }
}

// For components inside a <Slide> that change *within* the slide (highlight, dim, count…)
// instead of just appearing: read the slide's step and declare how many steps you need.
//   const slide = useSlide()
//   slide.step.value          → current step of this slide (1-based)
//   slide.requireSteps(4)     → the slide has at least 4 steps (same as a v-step="4")
// requireSteps accepts a number, ref or getter; it follows changes and is released on unmount.
// The slide's total is always the max over every v-step and every requireSteps.
// Inside a v-step-from="n" scope both are relative (step 1 = step n of the slide), like v-step;
// the offset is read from the DOM once the component is mounted.
export function useSlide(): SlideControls {
  const slide = inject(KEY, null)
  if (!slide) throw new Error('[arao] useSlide() must be used inside <Slide>')
  // inside Notes it reads the step but requires none: notes are drawn in the presenter view only,
  // and the audience must count the same steps (as v-step there, directives/step.ts)
  const inNotes = inject(IN_NOTES, false)

  const releases: (() => void)[] = []
  const instance = getCurrentInstance()
  const offset = ref(0)
  if (instance) {
    onBeforeUnmount(() => releases.splice(0).forEach((r) => r()))
    const read = () => {
      let el: Node | null = instance.vnode.el as Node | null
      while (el && el.nodeType !== 1) el = el.parentElement ?? el.nextSibling // fragment/text roots
      // the component's own root may carry v-step-from: it applies to what the component renders
      const root = el as HTMLElement | null
      offset.value = root ? stepOffset(root) + (root.dataset?.arStepFrom ? Number(root.dataset.arStepFrom) - 1 : 0) : 0
    }
    onMounted(() => { read(); watch(scopesVersion, read) })
  }

  return {
    step: computed(() => slide.step.value - offset.value),
    requireSteps(n: MaybeRefOrGetter<number | string>) {
      if (inNotes) return () => {}
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

// Notes: the slide it is in (its id, its step, whether it is the one on screen, the role of its
// stage), or null outside a slide. What is inside the Notes requires no steps (useSlide, above)
export function useSlideForNotes() {
  provide(IN_NOTES, true)
  const s = inject(KEY, null)
  return s && { id: s.id, step: s.step, active: s.active, role: s.role }
}
