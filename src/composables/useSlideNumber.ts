import { onBeforeUnmount, readonly, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useEventListener } from '@vueuse/core'
import { forDeck } from './useKeyboard'

// Internal. Typing a slide number jumps to it, with nothing on screen (as PowerPoint and Keynote
// do: the audience sees no list):
//   const { typed } = useSlideNumber({ go: (n) => deck.go(n - 1), total: () => deck.total.value })
//   a digit        adds to the number typed (typed: a read-only ref, '' when none). Read by its
//                  key, or by its code (Digit0-9, Numpad0-9: the number row of an AZERTY keyboard
//                  types & é " … without Shift)
//   Enter          goes to slide `typed` (1-based) and clears it; a number that is no slide (0,
//                  past the last) does nothing
//   Backspace      deletes the last digit typed
//   Escape, any other key, or WAIT_MS without a key   clears it (the other key does what it does)
// The digits and Escape are reserved: no shortcut can take them (vite/shortcut-rules.js). While a
// number is typed, its digits, Enter and Backspace are this one's: read before the shortcuts'
// listener (capture) and stopped there, so Enter does not also move to the next step, nor
// Backspace back. The deck's rules apply (useKeyboard.ts forDeck): not in text fields (the jump
// list's own field), not with Ctrl/Cmd/Alt.
const WAIT_MS = 2000
const MODIFIERS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock'])

// the digit a press types, or null: by its key, else by its code
export function digitOf(e: Pick<KeyboardEvent, 'key' | 'code'>): string | null {
  if (/^\d$/.test(e.key)) return e.key
  return /^(?:Digit|Numpad)(\d)$/.exec(e.code ?? '')?.[1] ?? null
}

export function useSlideNumber({ go, total }: { go: (n: number) => void; total: MaybeRefOrGetter<number> }) {
  const typed = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  const clear = () => {
    typed.value = ''
    clearTimeout(timer)
  }
  const own = (e: KeyboardEvent) => {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
  useEventListener(window, 'keydown', (e: KeyboardEvent) => {
    if (!forDeck(e) || MODIFIERS.has(e.key)) return
    const digit = digitOf(e)
    if (digit) {
      typed.value = (typed.value + digit).slice(-4)
      clearTimeout(timer)
      timer = setTimeout(clear, WAIT_MS)
      return own(e)
    }
    if (!typed.value) return
    if (e.key === 'Enter') {
      const n = Number(typed.value)
      clear()
      if (n >= 1 && n <= toValue(total)) go(n)
      return own(e)
    }
    if (e.key === 'Backspace') {
      typed.value = typed.value.slice(0, -1)
      clearTimeout(timer)
      if (typed.value) timer = setTimeout(clear, WAIT_MS)
      return own(e)
    }
    clear() // Escape, or any other key: it goes on to do what it does
  }, { capture: true })
  onBeforeUnmount(clear)
  return { typed: readonly(typed) }
}
