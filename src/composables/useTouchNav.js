import { toValue } from 'vue'
import { useEventListener, useSwipe } from '@vueuse/core'

// Internal. Touch (phones, tablets) on target moves the deck:
//   useTouchNav(viewport, { next, prev, middle, tap })
//   tap the right quarter → next(), the left quarter → prev(), the middle → middle()
//   swipe left → next(), right → prev()
//   tap() runs first on every tap, before what the tap does (the audience view closes the jump menu)
// The mouse is not touch. Links, buttons, inputs and the deck's own controls keep their taps and
// swipes, and so does any element with data-ar-touch="ignore". A gesture that a second finger
// joins, or that the browser takes over (pinch-zoom), is neither a tap nor a swipe.
// Taps are read from pointer events (touch and pen); swipes from VueUse's useSwipe (touch events,
// which follow the pointer events of the same touch).
// target: an element, or a ref or getter of one; null listens to nothing.
const TAP_MS = 500, TAP_MOVE = 12, SWIPE = 50
const OWN_TAPS = '.ar-controls, .ar-toast, a, button, input, select, textarea, label, [contenteditable], [data-ar-touch="ignore"]'

export function useTouchNav(target, { next, prev, middle, tap }) {
  let touch = null // the primary pointer of the gesture under way, until it is lifted
  let whole = false // the gesture has had only that one pointer, and the browser has not taken it over
  useEventListener(target, 'pointerdown', (e) => {
    if (e.pointerType === 'mouse') return
    touch = e.isPrimary ? { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId } : null
    whole = e.isPrimary
  })
  useEventListener(target, 'pointercancel', () => {
    touch = null
    whole = false
  })
  useEventListener(target, 'pointerup', (e) => {
    if (e.pointerType === 'mouse' || !touch || e.pointerId !== touch.id) return
    const { x, y, t } = touch
    touch = null
    if (e.target.closest?.(OWN_TAPS)) return
    const dx = e.clientX - x, dy = e.clientY - y
    if (e.timeStamp - t > TAP_MS || Math.hypot(dx, dy) > TAP_MOVE) return
    tap?.()
    const w = toValue(target)?.clientWidth || innerWidth
    if (e.clientX > w * 0.75) next()
    else if (e.clientX < w * 0.25) prev()
    else middle()
  })
  // mostly horizontal, and further than SWIPE px
  const { lengthX, lengthY } = useSwipe(target, {
    threshold: SWIPE,
    onSwipeEnd(e) {
      if (e.type !== 'touchend' || !whole || e.target.closest?.(OWN_TAPS)) return
      const dx = -lengthX.value, dy = -lengthY.value
      if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? next() : prev()
    },
  })
}
