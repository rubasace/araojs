import { onBeforeUnmount, readonly, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useTouchGestures } from './useTouchGestures'

// Internal. Something that shows while the mouse moves and hides on its own: the floating
// controls, the cursor.
//   const { visible } = useAutoHide({ after: 2500, tap: 4000, visible: false })
//   visible   a read-only ref
//   after     ms the mouse must be still (anywhere in the window) for it to hide; a number, or a
//             ref or getter of one, read at each move; <= 0: it never hides once shown
//   tap       optional: a tap (touch, pen) in the middle of the window shows it for tap ms, and
//             another one while it is shown hides it now (useTouchGestures.ts says what the middle is,
//             and which taps are not the window's: the controls' own, links, buttons…)
//   visible   where it starts (default false: hidden until the mouse moves); shown at the start,
//             it stays shown until a move and after ms without another
// A browser follows a touch tap with a compatibility mousemove: that one is not the mouse, and
// does not show it (a mousemove within TAP_ECHO_MS of a touch or pen).
// Not VueUse's useIdle: that one counts any activity on the window (keys too), with a fixed
// timeout, and has neither the tap echo, nor a tap's time of its own, nor "never".
const TAP_ECHO_MS = 800

export function useAutoHide({ after, tap, visible: initial = false }: { after?: MaybeRefOrGetter<number | undefined>; tap?: number; visible?: boolean } = {}) {
  const visible = ref(initial)
  let timer: ReturnType<typeof setTimeout> | undefined
  function show(ms: number | undefined) {
    visible.value = true
    clearTimeout(timer)
    if (ms != null && ms > 0) timer = setTimeout(() => (visible.value = false), ms)
  }
  function hide() {
    clearTimeout(timer)
    visible.value = false
  }

  let lastTouch = 0
  useEventListener(window, ['pointerdown', 'pointerup'], (e) => {
    if (e.pointerType !== 'mouse') lastTouch = performance.now()
  })
  useEventListener(window, 'mousemove', () => {
    if (performance.now() - lastTouch >= TAP_ECHO_MS) show(toValue(after))
  })
  if (tap) {
    useTouchGestures(window, {
      tap: (zone) => { if (zone === 'middle') visible.value ? hide() : show(tap) },
    })
  }
  onBeforeUnmount(() => clearTimeout(timer))

  return { visible: readonly(visible) }
}
