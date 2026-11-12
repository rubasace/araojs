import { onBeforeUnmount, onMounted, toValue, watch } from 'vue'

// Internal. Listens to `type` on target from the component's mount to its unmount.
//   useEventListener(window, 'keydown', onKey)
//   useEventListener(viewport, 'pointerdown', onDown)   a template ref: followed if it changes
// target: an element, window or document, or a ref or getter of one; null listens to nothing.
export function useEventListener(target, type, handler, options) {
  let off = null
  const stop = () => {
    off?.()
    off = null
  }
  onMounted(() => watch(() => toValue(target), (el) => {
    stop()
    if (!el) return
    el.addEventListener(type, handler, options)
    off = () => el.removeEventListener(type, handler, options)
  }, { immediate: true }))
  onBeforeUnmount(stop)
}
