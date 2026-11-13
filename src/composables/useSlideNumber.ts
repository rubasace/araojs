import { onBeforeUnmount, readonly, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@vueuse/core'
import { forDeck } from './useKeyboard'

// Internal. Typing a slide number jumps to it, with nothing on screen (as PowerPoint and Keynote
// do: the audience sees no list):
//   const { typed } = useSlideNumber({ go: (n) => deck.go(n - 1), total: () => deck.total.value })
//   digits (0-9, the row or the keypad)   add to the number typed (typed: a read-only ref, '' when none)
//   Enter                                 goes to slide `typed` (1-based) and clears it; a number
//                                         that is no slide (0, past the last) does nothing
//   Escape, or WAIT_MS without a key      clears it
// The digits and Escape are reserved: no shortcut can take them (core/shortcuts.ts). Enter is a
// shortcut too (next): while a number is typed, Enter is this one's, read before the shortcuts'
// listener (capture), so it does not also move to the next step. The deck's rules apply
// (useKeyboard.ts forDeck): not in text fields (the jump list's own field), not with Ctrl/Cmd/Alt.
const WAIT_MS = 2000

export function useSlideNumber({ go, total }: { go: (n: number) => void; total: MaybeRefOrGetter<number> }) {
  const typed = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  const clear = () => {
    typed.value = ''
    clearTimeout(timer)
  }
  useEventListener(window, 'keydown', (e: KeyboardEvent) => {
    if (!forDeck(e)) return
    if (/^\d$/.test(e.key)) {
      typed.value = (typed.value + e.key).slice(-4)
      clearTimeout(timer)
      timer = setTimeout(clear, WAIT_MS)
      e.preventDefault()
    } else if (e.key === 'Enter' && typed.value) {
      const n = Number(typed.value)
      clear()
      if (n >= 1 && n <= toValue(total)) go(n)
      e.preventDefault()
      e.stopImmediatePropagation()
    } else if (e.key === 'Escape') {
      clear()
    }
  }, { capture: true })
  onBeforeUnmount(clear)
  return { typed: readonly(typed) }
}
