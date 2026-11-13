import { getCurrentInstance, onBeforeUnmount, type ShallowRef } from 'vue'
import { shortcuts as projectShortcuts } from 'virtual:arao/shortcuts'
import { buildShortcuts, commandFor, type Command } from '../core/shortcuts'
import type { DeckFace, DeckMode } from '../state/deck'
import type { ThemeControls } from '../state/theme'
import { forDeck } from './useKeyboard'
import { useSlideNumber } from './useSlideNumber'
import { useTouchGestures, type Zone } from './useTouchGestures'

// Internal. The deck's shortcuts: which key runs which command (core/shortcuts.ts: the engine's
// defaults and the project's src/shortcuts.ts or .js), and who does each command.
//   useShortcuts({ next: deck.next, menu: openList, … })
//       registers what the caller does for each command it names (null: not here, the key is
//       the browser's); released when the caller unmounts
//   useDeckShortcuts(deck)
//       in Deck.vue, with what createDeck returned (it is the provider: it cannot useDeck()):
//       the deck's commands (next, prev, first, last, theme, fullscreen, presenter), the slide
//       number (useSlideNumber) and touch. Only in the audience and presenter views: the export
//       and the thumbnails have none
// One map (built when the first command registers: a mistake in the project's file throws then,
// when the deck starts), one listener on the window and one registry per window: a press runs at
// most one thing. A command has one owner: registering one that is already registered throws
// (two components doing "next" would both run on one key). The deck owns the moves; Controls
// owns menu (its jump list). Escape and the digits are not commands (core/shortcuts.ts).
// Keys keep the deck's rules (useKeyboard.ts forDeck): not in text fields, not with Ctrl/Cmd/Alt.
// Touch (audience view, on its viewport; composables/useTouchGestures.ts): a tap on the right
// quarter or a swipe left → next; the left quarter or a swipe right → previous. The middle is the
// controls' (their auto-hide). The presenter view reads no touch.
export type CommandHandlers = Partial<Record<Command, (() => void) | null | undefined>>

let map: ReadonlyMap<string, Command> | null = null
const registry = new Map<Command, () => void>()

function onKey(e: KeyboardEvent) {
  if (!forDeck(e)) return
  const command = commandFor(map!, e)
  const run = command && registry.get(command)
  if (!run) return
  run()
  e.preventDefault()
}

export function useShortcuts(handlers: CommandHandlers) {
  map ??= buildShortcuts(projectShortcuts)
  const mine: Command[] = []
  for (const [command, run] of Object.entries(handlers) as [Command, (() => void) | null | undefined][]) {
    if (!run) continue
    if (registry.has(command)) {
      // undo this call's own registrations before failing, so nothing is left half-registered
      for (const c of mine) registry.delete(c)
      throw new Error(`[arao] shortcuts: the command "${command}" is registered twice (one key would run both); each command has one owner`)
    }
    registry.set(command, run)
    mine.push(command)
  }
  if (mine.length && registry.size === mine.length) window.addEventListener('keydown', onKey)
  const release = () => {
    for (const c of mine) if (registry.get(c) === handlers[c]) registry.delete(c)
    if (mine.length && !registry.size) window.removeEventListener('keydown', onKey)
    mine.length = 0
  }
  if (getCurrentInstance()) onBeforeUnmount(release)
  return release
}

export function useDeckShortcuts({ mode, face, theme, viewport }: { mode: DeckMode; face: DeckFace; theme: ThemeControls; viewport: ShallowRef<HTMLElement | null> }) {
  if (mode !== 'audience' && mode !== 'presenter') return
  useShortcuts({
    next: face.next,
    prev: face.prev,
    first: face.first,
    last: face.last,
    theme: theme.cycle,
    fullscreen: face.toggleFullscreen,
    // not from the presenter view: there the key is the browser's
    presenter: mode === 'presenter' ? null : face.openPresenter,
  })
  useSlideNumber({ go: (n) => face.go(n - 1), total: () => face.total.value })

  if (mode === 'audience') {
    const move = (dir: Zone) => (dir === 'next' ? face.next() : dir === 'prev' ? face.prev() : null)
    useTouchGestures(viewport, { tap: move, swipe: move })
  }
}
