import { readonly, ref, toValue } from 'vue'
import { useEventListener } from './useEventListener'

// Internal. Fullscreen for target (an element, or a ref or getter of one; without one, the page):
//   const { fullscreen, toggle } = useFullscreen(viewport)
// fullscreen is a read-only ref that follows the document, whatever left or entered it (Esc too).
export function useFullscreen(target) {
  const fullscreen = ref(false)
  useEventListener(document, 'fullscreenchange', () => (fullscreen.value = !!document.fullscreenElement))
  function toggle() {
    document.fullscreenElement ? document.exitFullscreen() : (toValue(target) ?? document.documentElement).requestFullscreen()
  }
  return { fullscreen: readonly(fullscreen), toggle }
}
