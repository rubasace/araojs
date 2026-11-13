import { onKeyStroke } from '@vueuse/core'

// Internal. Keys on the window, wherever the focus is, with the rules every key of the deck keeps:
//   useKeyboard({ Escape: close, … })   key (KeyboardEvent.key) → handler(key)
//   forDeck(e)                          whether a press is the deck's to act on (the same rules)
// Keys typed in a text field are its own, and so are those typed anywhere inside an element
// marked data-ar-own-keys (a small editor with buttons of its own: no key of the deck acts while
// the focus is in it); so is Ctrl/Cmd/Alt + key (print, find, tabs, history; Shift and AltGr are ours); a
// focused button keeps Space and Enter for itself. A key with no handler (or a null one) is left
// to the browser. Its users: useShortcuts (the deck's commands, through forDeck), useSlideNumber
// (the digits) and Controls (Escape, for its own list).
const OWN = 'input, textarea, [contenteditable], [data-ar-own-keys]'

// key (KeyboardEvent.key) → what it does; a key without one (null, undefined) is the browser's
export type KeyHandlers = Record<string, ((key: string) => void) | null | undefined>

export function forDeck(e: KeyboardEvent): boolean {
  const target = e.target as Partial<Element> | null // an element, or the window/document
  if (target?.closest?.(OWN)) return false
  // AltGr (Ctrl+Alt on Windows) types characters on many layouts: those presses are the deck's.
  // On a Mac, Option is Alt: keys typed with it stay the browser's.
  if (e.metaKey || ((e.ctrlKey || e.altKey) && !e.getModifierState?.('AltGraph'))) return false
  if ((e.key === ' ' || e.key === 'Enter') && target?.closest?.('button')) return false
  return true
}

export function useKeyboard(handlers: KeyHandlers) {
  const keys = Object.keys(handlers).filter((k) => handlers[k])
  onKeyStroke(keys, (e) => {
    if (!forDeck(e)) return
    handlers[e.key]!(e.key)
    e.preventDefault()
  })
}
