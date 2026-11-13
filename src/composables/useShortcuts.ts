import type { ShallowRef } from 'vue'
import type { DeckFace, DeckMode } from '../state/deck'
import type { ThemeControls } from '../state/theme'
import { useKeyboard, type KeyHandlers } from './useKeyboard'
import { useTouchGestures, type Zone } from './useTouchGestures'

// Internal. The deck's shortcuts: keys and touch call the deck directly, as its buttons do.
//   useShortcuts(deck)   in Deck.vue, with what createDeck returned (it is the provider: it cannot
//                        useDeck()). Only in the audience and presenter views: the export and the
//                        thumbnails have none.
// Keys (on the window, composables/useKeyboard.ts):
//   → ↓ PageDown Space Enter   next        ← ↑ PageUp Backspace   previous
//   Home   the first slide      End   the last step of the last slide
//   t   the next theme          f   fullscreen      p   the presenter window (not from the
//                                                       presenter view: there the key is the browser's)
// The controls' own keys (g, 0-9, Escape: their lists) are theirs (Controls.vue).
// Touch (audience view, on its viewport; composables/useTouchGestures.ts): a tap on the right
// quarter or a swipe left → next; the left quarter or a swipe right → previous. The middle is the
// controls' (their auto-hide). The presenter view reads no touch.
const NEXT = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter']
const PREV = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']

export function useShortcuts({ mode, face, theme, viewport }: { mode: DeckMode; face: DeckFace; theme: ThemeControls; viewport: ShallowRef<HTMLElement | null> }) {
  if (mode !== 'audience' && mode !== 'presenter') return
  const handlers: KeyHandlers = {
    Home: () => face.go(0),
    End: () => face.go(face.total.value - 1, Infinity),
    t: theme.cycle,
    f: face.toggleFullscreen,
    p: mode === 'presenter' ? null : face.openPresenter,
  }
  for (const k of NEXT) handlers[k] = face.next
  for (const k of PREV) handlers[k] = face.prev
  useKeyboard(handlers)

  if (mode === 'audience') {
    const move = (dir: Zone) => (dir === 'next' ? face.next() : dir === 'prev' ? face.prev() : null)
    useTouchGestures(viewport, { tap: move, swipe: move })
  }
}
