import { computed, shallowRef, toValue, watch } from 'vue'
import { IDLE, parseDuration, start } from '../core/timer'

// Internal. The talk's timer, kept by every window (useDeckSync shares it), and its length.
//   const { timer, setTimer, duration, startTimer } = useTimer(() => props.duration)
//   timer         a shallow ref of the timer (core/timer.js: plain data); setTimer(t) replaces it
//   duration      the length in ms, or null; a value that is no length warns (once per value)
//   startTimer()  starts it if it is idle (the deck's first move); a paused timer stays paused
export function useTimer(length) {
  const timer = shallowRef(IDLE)
  const setTimer = (t) => (timer.value = t)
  const duration = computed(() => parseDuration(toValue(length)))
  watch(() => toValue(length), (v) => {
    if (v != null && String(v).trim() && duration.value == null) {
      console.warn(`[phoenyx] Deck duration="${v}" is not a length (90, "45m", "1h30", "45:00"…): the presenter view shows no countdown`)
    }
  }, { immediate: true })
  function startTimer() {
    if (timer.value.state === 'idle') timer.value = start(timer.value, Date.now())
  }
  return { timer, setTimer, duration, startTimer }
}
