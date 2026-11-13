import { readonly, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@vueuse/core'

// Internal. Fullscreen for target (an element, or a ref or getter of one; without one, the page):
//   const { fullscreen, toggle } = useFullscreen(viewport)
// fullscreen is a read-only ref that follows the document, whatever left or entered it (Esc too):
// true while any element is fullscreen, not only target. toggle() leaves fullscreen if anything is
// fullscreen, else makes target fullscreen. The standard API only (no vendor prefixes).
// Not VueUse's useFullscreen: its isFullscreen is true only for its own target, and it falls
// back to prefixed APIs.
export function useFullscreen(target: MaybeRefOrGetter<HTMLElement | null | undefined>) {
  const fullscreen = ref(false)
  useEventListener(document, 'fullscreenchange', () => { fullscreen.value = !!document.fullscreenElement })
  function toggle() {
    if (document.fullscreenElement) document.exitFullscreen()
    else (toValue(target) ?? document.documentElement).requestFullscreen()
  }
  return { fullscreen: readonly(fullscreen), toggle }
}
