import { computed, inject, nextTick, provide, readonly, ref, shallowReactive, type ComputedRef, type InjectionKey, type Ref, type WritableComputedRef } from 'vue'

export type Role = 'audience' | 'presenter' | 'preview' | 'export' | 'thumbnail'
// what a slide registers with its stage (state/slide.ts); el, a ref to its <section>
export interface StageSlide {
  id: string
  steps: ComputedRef<number>
  title: Readonly<Ref<string | undefined>>
  el: Readonly<Ref<HTMLElement | null | undefined>>
}
export interface Position { index: number; step: number }
export interface StageOptions {
  follow?: () => Position
  onMove?: () => void
  role?: Role
}
export type Stage = ReturnType<typeof createStage>

// Internal. A stage is one rendering of the deck's slides and where it stands: the slides register
// with it, it orders them and moves between them. The audience window has one. The presenter view
// renders the deck twice, each copy with its own stage: the current slide, and a preview that
// follows it one step ahead. The deck makes its stages (state/deck.ts); the Stage part that draws
// one (components/internal/Stage.vue) makes it the stage of everything inside it:
//   const stage = createStage({ onMove })   navigable: next / prev / go / last move it, and onMove()
//                                           is called after each of those that changed the position
//                                           (keys, controls, addons, the URL); the stage's own
//                                           adjustments (slides reordered, the slide on screen
//                                           removed) are not moves; place(i, s) sets the position
//                                           without being one
//   createStage({ follow })                 follower: follow() → { index, step } is where it stands;
//                                           it cannot be moved by itself
//   role: 'audience' (default)              which rendering this is, for components (useDeck().role):
//         | 'presenter' | 'preview'         the audience window, the presenter view's current slide,
//         | 'export' | 'thumbnail'          or its preview of the next step; the deck being printed
//                                           (?export, core/exporter.ts: walked page by page, copied
//                                           into a book); or a thumbnail of its cover (a follower
//                                           that stands at the first slide; its slides other than
//                                           that one draw nothing, state/slide.ts)
//   provideStage(stage)                     in the Stage part: what it draws belongs to this stage
//   useStage()                              the stage the caller is drawn in, or null outside every
//                                           Stage (the views' own UI: controls, presenter bar)
// Slides register with the stage they are drawn in (state/slide.ts); what useDeck() reads of it is
// stage.view, merged into the deck's public face (state/deck.ts).
//
// Caveat: a presenter window mounts every slide twice, and keeps both mounted. Whatever a slide
// or an addon does when it mounts or while it is on screen happens twice there: timers, fetches,
// media that autoplays (sound from two places), and every element id appears twice (an SVG
// gradient, an anchor). A component that should not do that outside the audience's own window
// checks useDeck().role.
const KEY: InjectionKey<Stage> = Symbol('arao-stage')

export function provideStage(stage: Stage) {
  provide(KEY, stage)
}

export function useStage(): Stage | null {
  return inject(KEY, null)
}

export function createStage({ follow, onMove, role = 'audience' }: StageOptions = {}) {
  const list = shallowReactive<StageSlide[]>([])
  // a follower's position is read from follow(); writes to it (reorder, vacancy) are dropped
  const index: Ref<number> | WritableComputedRef<number> = follow ? computed({ get: () => follow().index, set() {} }) : ref(0)
  const step: Ref<number> | WritableComputedRef<number> = follow ? computed({ get: () => follow().step, set() {} }) : ref(1)
  const current = computed((): StageSlide | undefined => list[index.value])

  const noop = () => {}
  const move = <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => {
    const [i, s] = [index.value, step.value]
    fn(...args)
    if (index.value !== i || step.value !== s) onMove?.()
  }
  // this stage's part of useDeck(): read-only position, and the moves (none on a follower)
  const view = {
    role,
    index: readonly(index),
    step: readonly(step),
    total: computed(() => list.length),
    steps: computed(() => current.value?.steps.value ?? 1),
    // progress over every step of the deck, 0..1
    progress: computed(() => {
      const all = list.reduce((n, s) => n + s.steps.value, 0)
      const done = list.slice(0, index.value).reduce((n, s) => n + s.steps.value, 0) + step.value
      return all > 1 ? (done - 1) / (all - 1) : 1
    }),
    next: follow ? noop : move(next),
    prev: follow ? noop : move(prev),
    go: follow ? noop : move(go),
  }

  // slide = { id, steps, title, el }; el is a ref to its <section>
  function register(slide: StageSlide) {
    change()
    list.push(slide)
    return computed(() => list.findIndex((s) => s.id === slide.id))
  }
  function unregister(id: string) {
    const i = list.findIndex((s) => s.id === id)
    if (i < 0) return
    const tick = change()
    // the slide on screen is going away: who takes its place is decided once the tick settles
    if (i === index.value && !tick.vacancy) tick.vacancy = { slide: list[i], step: step.value }
    list.splice(i, 1)
    if (i < index.value) index.value--
    if (index.value >= list.length) index.value = Math.max(0, list.length - 1)
  }

  // Slide order is document order, not mount order: a slide mounted later (v-if, inserted by
  // HMR) or moved (keyed v-for, in the deck or in any component inside it) takes its place in
  // the template. Mounts, unmounts and moves of one tick are settled together once the DOM is
  // final; nothing else (a step, a re-render of the deck) reorders.
  type Vacancy = { slide: StageSlide; step: number }
  let pending: { before: StageSlide[]; vacancy: Vacancy | null } | null = null // { before: list at the start of the tick, vacancy: { slide, step } | null }
  function change() {
    if (!pending) {
      pending = { before: list.slice(), vacancy: null }
      nextTick(settle)
    }
    return pending
  }
  function settle() {
    const { before, vacancy } = pending!
    pending = null
    const placed = list.filter((s) => s.el.value?.isConnected)
    placed.sort((a, b) => (a.el.value!.compareDocumentPosition(b.el.value!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    const sorted = [...placed, ...list.filter((s) => !placed.includes(s))]
    if (vacancy) {
      list.splice(0, list.length, ...sorted)
      return fill(vacancy, before)
    }
    // the slide on screen stays on screen
    if (sorted.every((s, i) => s === list[i])) return
    const shown = list[index.value]
    list.splice(0, list.length, ...sorted)
    if (shown) index.value = list.indexOf(shown)
  }

  // The slide on screen went away this tick. A slide mounted in its place in the same tick
  // (re-keyed, v-if/v-else swapped, reloaded by HMR, every slide remounted) takes over at the
  // same step, clamped to its own total. Otherwise the next slide takes its place from step 1;
  // with no next slide, the previous one is shown complete, as if the audience stepped back.
  function fill({ slide, step: at }: Vacancy, before: StageSlide[]) {
    const i = before.indexOf(slide)
    if (i < 0) return go(index.value, 1) // mounted and gone within the same tick
    const was = new Set(before)
    const is = new Set(list)
    // nearest slide before it that survived, and how many removed slides sat in between
    let p = i - 1
    while (p >= 0 && !is.has(before[p])) p--
    const skipped = i - p - 1
    // slides mounted this tick right after that survivor: the same gap, in the new order
    const from = p >= 0 ? list.indexOf(before[p]) + 1 : 0
    let to = from
    while (to < list.length && !was.has(list[to])) to++
    if (to > from) go(from + Math.min(skipped, to - from - 1), at)
    else if (from < list.length) go(from, 1)
    else if (list.length) go(list.length - 1, list[list.length - 1].steps.value)
    else step.value = 1
  }

  function go(i: number, s = 1) {
    if (i < 0 || i >= list.length) return
    index.value = i
    step.value = Math.min(Math.max(1, s), list[i].steps.value)
  }
  function next() {
    if (current.value && step.value < current.value.steps.value) step.value++
    else go(index.value + 1, 1)
  }
  function prev() {
    if (step.value > 1) step.value--
    else if (index.value > 0) go(index.value - 1, list[index.value - 1].steps.value)
  }
  function last() {
    if (list.length) go(list.length - 1, list[list.length - 1].steps.value)
  }

  return {
    role, list, index, step, current, view, register, unregister, change,
    place: go, go: view.go, next: view.next, prev: view.prev, last: follow ? noop : move(last),
  }
}

// A slide's title, for the jump menu, the presenter view and the notes pages: Slide(title="…"),
// else its first heading outside the background and the footer (headingOf: that heading's text).
const HEADING = ':is(h1, h2, h3):not(.ar-slide-bg *, .ar-footer *)'
export const headingOf = (slide: StageSlide) => slide.el.value?.querySelector(HEADING)?.textContent?.replace(/\s+/g, ' ').trim() || ''
export const titleOf = (slide: StageSlide) => slide.title.value || headingOf(slide)

// Where the audience will be after one more press: the next step of the same slide, else the
// next slide at its first step; at the very end, { end: true }.
export function ahead(stage: Pick<Stage, 'index' | 'step' | 'list'>): Position & { end?: true } {
  const i = stage.index.value
  const s = stage.step.value
  if (s < (stage.list[i]?.steps.value ?? 1)) return { index: i, step: s + 1 }
  if (i + 1 < stage.list.length) return { index: i + 1, step: 1 }
  return { index: -1, step: 1, end: true }
}
