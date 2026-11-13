import { onKeyStroke } from '@vueuse/core'

// Internal. Keys on the window, wherever the focus is, with the rules every key of the deck keeps:
//   useKeyboard({ ArrowRight: next, g: openList, … })   key (KeyboardEvent.key) → handler(key)
// Keys typed in a text field are its own, and so are those typed anywhere inside an element
// marked data-ar-own-keys (a small editor with buttons of its own: no key of the deck acts while
// the focus is in it); so is Ctrl/Cmd/Alt + key (print, find, tabs, history; Shift is ours); a
// focused button keeps Space and Enter for itself. A key with no handler (or a null one) is left
// to the browser. Its users: useShortcuts (the deck's moves) and Controls (its own lists).
const OWN = 'input, textarea, [contenteditable], [data-ar-own-keys]'

export function useKeyboard(handlers) {
  const keys = Object.keys(handlers).filter((k) => handlers[k])
  onKeyStroke(keys, (e) => {
    if (e.target.closest?.(OWN)) return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('button')) return
    handlers[e.key](e.key)
    e.preventDefault()
  })
}
