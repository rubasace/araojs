import { onKeyStroke } from '@vueuse/core'

// Internal. The deck's keys, on the window:
//   → ↓ PageDown Space Enter   next        ← ↑ PageUp Backspace   prev
//   Home first   End last   f fullscreen   t theme   p presenter   g menu   Escape close
//   0-9 jump(digit)            (typing a slide number opens the jump menu with it)
//   useKeyboard({ next, prev, first, last, fullscreen, theme, presenter, menu, jump, close })
// A key whose action is not given is left to the browser (the presenter view gives no presenter).
// Keys typed in a text field are its own, and so are those typed anywhere inside an element
// marked data-ar-own-keys (a small editor with buttons of its own: no key of the deck acts while
// the focus is in it); so is Ctrl/Cmd/Alt + key (print, find, tabs, history; Shift is ours); a
// focused button keeps Space and Enter for itself. Keys never show the controls: only the mouse
// does.
const KEYS = new Map(Object.entries({
  ArrowRight: 'next', ArrowDown: 'next', PageDown: 'next', ' ': 'next', Enter: 'next',
  ArrowLeft: 'prev', ArrowUp: 'prev', PageUp: 'prev', Backspace: 'prev',
  Home: 'first', End: 'last', f: 'fullscreen', t: 'theme', p: 'presenter', g: 'menu', Escape: 'close',
}))
const DIGITS = [...'0123456789']
const OWN = 'input, textarea, [contenteditable], [data-ar-own-keys]'

export function useKeyboard(actions) {
  onKeyStroke([...KEYS.keys(), ...DIGITS], (e) => {
    if (e.target.closest?.(OWN)) return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('button')) return
    const digit = DIGITS.includes(e.key)
    const action = digit ? actions.jump : actions[KEYS.get(e.key)]
    if (!action) return
    digit ? action(e.key) : action()
    e.preventDefault()
  })
}
