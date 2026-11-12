import { toValue } from 'vue'
import { useEventListener } from './useEventListener'

// Internal. Touch (phones, tablets) on target moves the deck:
//   useTouchNav(viewport, { next, prev, middle, tap })
//   tap the right quarter → next(), the left quarter → prev(), the middle → middle()
//   swipe left → next(), right → prev()
//   tap() runs first on every tap, before what the tap does (Deck closes the jump menu)
// The mouse is not touch. Links, buttons, inputs and the deck's own controls keep their taps, and
// so does any element with data-ph-touch="ignore".
// target: an element, or a ref or getter of one; null listens to nothing.
const TAP_MS = 500, TAP_MOVE = 12, SWIPE = 50
const OWN_TAPS = '.ph-controls, .ph-toast, a, button, input, select, textarea, label, [contenteditable], [data-ph-touch="ignore"]'

export function useTouchNav(target, { next, prev, middle, tap }) {
  let touch = null
  useEventListener(target, 'pointerdown', (e) => {
    if (e.pointerType === 'mouse') return
    touch = e.isPrimary ? { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId } : null
  })
  useEventListener(target, 'pointerup', (e) => {
    if (e.pointerType === 'mouse' || !touch || e.pointerId !== touch.id) return
    const { x, y, t } = touch
    touch = null
    if (e.target.closest?.(OWN_TAPS)) return
    const dx = e.clientX - x, dy = e.clientY - y
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) return dx < 0 ? next() : prev()
    if (e.timeStamp - t > TAP_MS || Math.hypot(dx, dy) > TAP_MOVE) return
    tap?.()
    const w = toValue(target)?.clientWidth || innerWidth
    if (e.clientX > w * 0.75) next()
    else if (e.clientX < w * 0.25) prev()
    else middle()
  })
  useEventListener(target, 'pointercancel', () => (touch = null))
}
