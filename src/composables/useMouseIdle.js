import { onBeforeUnmount, readonly, ref, toValue } from 'vue'
import { useEventListener } from '@vueuse/core'

// Internal. Whether the mouse has been still over target for a while.
//   const { idle, wake, sleep } = useMouseIdle(viewport, 2500, { idle: true })
//   idle      a read-only ref: true once the mouse has not moved over target for ms; it starts as
//             the `idle` option (default false: idle only after a first move and ms without one)
//   ms        a number, or a ref or getter of one, read at each move; ms <= 0: never idle
//   wake(ms)  not idle now, idle again after ms (default: the same ms), for what is not the mouse
//             (Deck: a tap in the middle shows the controls for 4 s); sleep(): idle now
// A browser follows a touch tap with a compatibility mousemove: that one is not the mouse, and
// does not count (a mousemove within TAP_ECHO_MS of a touch or pen on target).
// target: an element, or a ref or getter of one; null watches nothing (idle stays as it is).
// Not VueUse's useIdle: that one counts any activity on the window (keys too), with a fixed
// timeout, and has neither the tap echo, nor a wake for a time of its own, nor "never".
const TAP_ECHO_MS = 800

export function useMouseIdle(target, ms, { idle: initial = false } = {}) {
  const idle = ref(initial)
  let timer
  function wake(after = toValue(ms)) {
    idle.value = false
    clearTimeout(timer)
    if (after > 0) timer = setTimeout(() => (idle.value = true), after)
  }
  function sleep() {
    clearTimeout(timer)
    idle.value = true
  }

  let lastTouch = 0
  const touched = (e) => {
    if (e.pointerType !== 'mouse') lastTouch = performance.now()
  }
  useEventListener(target, ['pointerdown', 'pointerup'], touched)
  useEventListener(target, 'mousemove', () => {
    if (performance.now() - lastTouch >= TAP_ECHO_MS) wake()
  })
  onBeforeUnmount(() => clearTimeout(timer))

  return { idle: readonly(idle), wake, sleep }
}
