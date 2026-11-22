import { onBeforeUnmount, onMounted, onUpdated, shallowRef, watch, type Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { describeOverflow, fitSlide, measureSlide, overflowFixes, sayFixes } from '../core/overflow'
import { titleIn, type Role } from '../state/stage'

// A slide's watch over its own size (core/overflow.ts), in Slide.vue, for the slide on screen:
//   useOverflow({ el, active, step, steps, index, role, theme, deck })
//     el       its section; active, step, steps, index: its state (state/slide.ts)
//     role     the drawing it is in (state/stage.ts); theme, the theme worn (a ref)
//     deck     the deck's name for the warnings (null: the page's path)
// Two jobs:
//   - Slide.fit, a slide with the class fit, in every drawing (the audience's, the presenter
//     view's two, a thumbnail, the export): its body shrunk to fit (fitSlide) whenever what it
//     holds may have changed size. On becoming the slide on screen, at a new step, with a new
//     theme or after its own render it is done at once, before the browser paints; on what comes
//     later (a picture loaded, a font, a child component's own change, the window) on the next
//     frame; and once more when what moves on it (a step's glide, a fade) has stopped.
//   - In development only, in the audience's window: a console warning when what is on screen
//     does not fit (measureSlide), naming the deck, the slide, its step, what overflows and by
//     how much, and how to fix it. Measured a moment after the last change (DEBOUNCE_MS), once
//     its animations are done, its fonts and what marks itself busy (data-ar-busy: a picture
//     loading) are in. Once per slide and step: the same overflow is not said again, a different
//     one is, and one that is gone may come back later and be said again.
//     The export measures every page itself (core/exporter.ts), and reports it to the CLI.
// Nothing at all for a slide that is not on screen (it is not laid out: display none), nor, in a
// production build, for a slide without .fit outside the export: no observer, no measure.
// The cost, then: in development, one walk of the slide on screen's boxes a moment after it
// changes; with .fit, a few layouts of its body when its content, step, theme or the window change.
const DEBOUNCE_MS = 250
// what moves on a slide (a step's glide, a fade, the slide's own transition) is waited for this
// long at most; and what is busy loading, as long as the export waits for it (exporter.ts)
const ANIMATIONS_MS = 3000
const BUSY_MS = 15000
// refitted on its boxes' sizes alone more often than this in a second, a slide is left as it is
// until something else changes (a fit that would make itself refit, endlessly)
const LOOP = 12

export interface OverflowOptions {
  el: Readonly<Ref<HTMLElement | null>>
  active: Readonly<Ref<boolean>>
  step: Readonly<Ref<number>>
  steps: Readonly<Ref<number>>
  index: Readonly<Ref<number>>
  role: Role
  theme: Readonly<Ref<string>>
  deck: string | null
}

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

// the slide still: its animations that end have ended (one that loops never does), its fonts and
// what is busy loading are in; each waited for so long at most
async function still(slide: HTMLElement) {
  const ending = slide.getAnimations({ subtree: true }).filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime ?? Infinity))
  await Promise.race([Promise.all(ending.map((a) => a.finished.catch(() => {}))), pause(ANIMATIONS_MS)])
  await document.fonts.ready
  for (const end = performance.now() + BUSY_MS; slide.querySelector('[data-ar-busy]') && performance.now() < end;) await pause(100)
  await frame()
}

export function useOverflow({ el, active, step, steps, index, role, theme, deck }: OverflowOptions) {
  // the warnings: in development, in the audience's window (the export reports its own)
  const warns = !!import.meta.env.DEV && role === 'audience'
  // what each step last warned of: the same overflow is said once
  const warned = new Map<number, string>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let raf = 0
  let burst = 0 // fits on sizes alone in the current second, from burstAt
  let burstAt = 0
  const watching = shallowRef(false)
  let ro: ResizeObserver | null = null
  let mo: MutationObserver | null = null
  const wanted = () => !!el.value && active.value && (warns || el.value.classList.contains('fit'))

  // Slide.fit now (fitSlide leaves a slide without .fit as it is, and clears what a .fit left)
  function fit() {
    const slide = el.value
    if (slide && active.value) return fitSlide(slide)
    return null
  }
  // what changed may have changed its size: fit (now, before the paint, or on the next frame), and
  // check it once it is still. sized: only a box's size changed (a ResizeObserver's word)
  function changed(now: boolean, sized = false) {
    if (!active.value) return
    if (sized) {
      const t = performance.now()
      if (t - burstAt > 1000) [burst, burstAt] = [0, t]
      if (++burst > LOOP) return
    }
    if (now) fit()
    else if (!raf) raf = requestAnimationFrame(() => { raf = 0; fit() })
    clearTimeout(timer)
    timer = setTimeout(settled, DEBOUNCE_MS)
  }
  // once it is still: fit again (what moved was measured where it was), then, in development, say
  // what does not fit
  async function settled() {
    const slide = el.value
    if (!slide || !active.value) return
    const at = step.value
    await still(slide)
    if (el.value !== slide || !active.value || step.value !== at) return
    const done = fitSlide(slide)
    if (!warns) return
    const found = measureSlide(slide)
    if (!found.length) return void warned.delete(at)
    const what = `${describeOverflow(found)}. ${sayFixes(overflowFixes(found, done))}`
    if (warned.get(at) === what) return
    warned.set(at, what)
    const title = titleIn(slide)
    const where = [`deck ${deck ? `"${deck}"` : `at ${location.pathname}`}`, `slide ${index.value + 1}${title ? ` "${title}"` : ''}`, steps.value > 1 ? `step ${at} of ${steps.value}` : '']
    console.warn(`[arao] overflow: ${where.filter(Boolean).join(', ')}: ${what}`)
  }

  // the observers, while the slide is on screen and has something to watch for
  const resized = () => changed(false, true)
  const mutated = (records: MutationRecord[]) => {
    // the footer's own changes are no content of the slide's
    const inside = records.filter((r) => !(r.target as Element).closest?.('.ar-footer'))
    if (!inside.length) return
    if (inside.some((r) => r.type === 'childList')) observeBoxes()
    changed(false)
  }
  // a font loaded, the window resized: listened to while watching (a null target listens to none)
  useEventListener(() => (watching.value ? document.fonts : null), 'loadingdone', () => changed(false))
  useEventListener(() => (watching.value ? window : null), 'resize', () => changed(false))
  // the slide, its zones and their blocks change size when what is in them does (a picture loads)
  function observeBoxes() {
    const slide = el.value
    if (!ro || !slide) return
    ro.disconnect()
    ro.observe(slide)
    for (const zone of slide.querySelectorAll(':scope > :is(.ar-header, .ar-body, .ar-zone)')) {
      ro.observe(zone)
      for (const block of zone.children) ro.observe(block)
    }
  }
  function watchOn() {
    if (watching.value) return
    watching.value = true
    ro = new ResizeObserver(resized)
    observeBoxes()
    mo = new MutationObserver(mutated)
    mo.observe(el.value!, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden', 'src'] })
  }
  function watchOff() {
    if (!watching.value) return
    watching.value = false
    ro?.disconnect()
    mo?.disconnect()
    ro = mo = null
    clearTimeout(timer)
    cancelAnimationFrame(raf)
    raf = 0
  }
  // on screen or not, .fit or not (a class bound to state may change): watching or not
  function update(now: boolean) {
    if (wanted()) {
      watchOn()
      changed(now)
    } else {
      watchOff()
      // a .fit removed (or a slide left): what it fitted stays until the class goes, then goes
      if (el.value && !el.value.classList.contains('fit')) fitSlide(el.value)
    }
  }
  onMounted(() => update(true))
  onUpdated(() => update(true))
  watch([active, step, theme], () => update(true), { flush: 'post' })
  onBeforeUnmount(watchOff)
}
