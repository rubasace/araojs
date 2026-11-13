import { toValue, type MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@vueuse/core'

// Internal. Touch (phones, tablets) and pen on target.
//   useTouchGestures(target, { tap, swipe })   the gestures, read once for whoever needs them:
//     tap(zone)    a tap: zone 'prev' (the left quarter of target), 'next' (the right quarter) or
//                  'middle' (the rest)
//     swipe(dir)   a swipe: 'next' (to the left) or 'prev' (to the right)
// Its users: useShortcuts (edge taps and swipes move the deck) and useAutoHide (the middle tap
// shows or hides the controls).
// The mouse is not touch. Links, buttons, inputs and the deck's own controls keep their taps, and
// so does any element with data-ar-touch="ignore".
// Taps and swipes are both read from pointer events (touch and pen), not from VueUse's useSwipe,
// which listens to touch events only and would leave the pen without swipes.
// target: an element, the window, or a ref or getter of one; null listens to nothing.
const TAP_MS = 500, TAP_MOVE = 12, SWIPE = 50
const OWN_TAPS = '.ar-controls, .ar-toast, a, button, input, select, textarea, label, [contenteditable], [data-ar-touch="ignore"]'

export type Zone = 'prev' | 'middle' | 'next'

export function useTouchGestures(target: MaybeRefOrGetter<HTMLElement | Window | null | undefined>, { tap, swipe }: { tap?: (zone: Zone) => void; swipe?: (dir: 'prev' | 'next') => void }) {
  let touch: { x: number; y: number; t: number; id: number } | null = null
  useEventListener(target, 'pointerdown', (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return
    touch = e.isPrimary ? { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId } : null
  })
  useEventListener(target, 'pointerup', (e: PointerEvent) => {
    if (e.pointerType === 'mouse' || !touch || e.pointerId !== touch.id) return
    const { x, y, t } = touch
    touch = null
    if ((e.target as Partial<Element> | null)?.closest?.(OWN_TAPS)) return
    const dx = e.clientX - x, dy = e.clientY - y
    // a swipe: mostly horizontal, and further than SWIPE px
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) { swipe?.(dx < 0 ? 'next' : 'prev'); return }
    if (e.timeStamp - t > TAP_MS || Math.hypot(dx, dy) > TAP_MOVE) return
    const el = toValue(target)
    const w = (el && 'clientWidth' in el ? el.clientWidth : 0) || innerWidth
    tap?.(e.clientX > w * 0.75 ? 'next' : e.clientX < w * 0.25 ? 'prev' : 'middle')
  })
  useEventListener(target, 'pointercancel', () => { touch = null })
}
