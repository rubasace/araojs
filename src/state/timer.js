import { computed, inject, provide, readonly, shallowRef, toValue, watch } from 'vue'
import { IDLE, clock, parseDuration, pause as pauseAt, start as startAt, toggle as toggleAt, withinBounds } from '../core/timer'

// The talk's timer and its length, one per Deck, kept by every window of the deck (useDeckSync
// shares the timer and the length the presenter set).
//   const timer = createTimer({ duration, warn })   in createDeck: duration, the deck's duration
//                                                    prop (a getter, ref or value); warn: false
//                                                    in a thumbnail (it says nothing of the
//                                                    prop). Provides the controls (useTimer) and
//                                                    returns them with the internals the sync needs
//   useTimer()                                       the controls, for the presenter view's bar
// The length is the deck's (its duration prop, in ms, or null; a value that is no length warns,
// and so does one outside 1 min – 24 h, which still counts; once per value) unless the
// presenter set another: override, in ms, or null. setDuration(ms) sets it; null, or the deck's
// own value, goes back to the deck's (no override left).
// An override wins until it is reset, even over a new duration prop (an edit of the deck, HMR).
// One equal to the deck's value is dropped, as setting the deck's own value would be: when an
// edit of the deck reaches it, or when a window an edit remounted takes it back from
// sessionStorage (the drop is a change like any other: the other windows follow).
// The controls (useTimer), a frozen object:
//   timer               read-only ref of the timer (core/timer.js): { state, acc, since }
//   duration            the length in effect, in ms, or null: the presenter's, else the deck's
//   deckDuration        the deck's own (its duration prop), in ms, or null
//   setDuration(ms)     sets the presenter's length; null goes back to the deck's
//   start(), pause(), toggle(), reset()   start (or resume), pause, either, back to idle
// Internals (on what createTimer returns, for useDeckSync): setTimer(t), which replaces the
// timer as another window sends it; override, setOverride(ms), the presenter's length as sent.
const KEY = Symbol('arao-timer')

export function createTimer({ duration: prop, warn = true }) {
  const timer = shallowRef(IDLE)
  const setTimer = (t) => (timer.value = t)
  const deckDuration = computed(() => parseDuration(toValue(prop)))
  const override = shallowRef(null)
  // anything but a length (a value kept by another version, say) is no override
  const setOverride = (ms) => (override.value = Number.isFinite(ms) && ms > 0 ? ms : null)
  const setDuration = (ms) => setOverride(ms === deckDuration.value ? null : ms)
  const duration = computed(() => override.value ?? deckDuration.value)
  // (said where the deck is shown, not by each thumbnail of it)
  if (warn) {
    watch(() => toValue(prop), (v) => {
      const ms = deckDuration.value
      if (v != null && String(v).trim() && ms == null) {
        console.warn(`[arao] Deck duration="${v}" is not a length (90, "45m", "1h30", "45:00"…): the presenter view shows no countdown`)
      } else if (ms != null && !withinBounds(ms)) {
        console.warn(`[arao] Deck duration="${v}" is ${clock(ms)}, outside 1 min – 24 h: the presenter view counts it down anyway, but its field takes nothing outside them`)
      }
    }, { immediate: true })
  }
  watch([override, deckDuration], ([o, d]) => {
    if (o != null && o === d) setOverride(null)
  })

  const controls = Object.freeze({
    timer: readonly(timer),
    duration,
    deckDuration,
    setDuration,
    start: () => setTimer(startAt(timer.value, Date.now())),
    pause: () => setTimer(pauseAt(timer.value, Date.now())),
    toggle: () => setTimer(toggleAt(timer.value, Date.now())),
    reset: () => setTimer(IDLE),
  })
  provide(KEY, controls)
  return { ...controls, timer, setTimer, override, setOverride }
}

export function useTimer() {
  const timer = inject(KEY, null)
  if (!timer) throw new Error('[arao] useTimer() must be used inside <Deck>')
  return timer
}
