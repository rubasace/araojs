import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import { createSync, deckKey, type Sync } from '../core/sync'
import type { Position, Stage } from '../state/stage'
import type { Timer } from '../state/timer'

// Internal. Every window of the same deck in the same browser in step (core/sync.ts): where the
// deck stands, its theme, the talk's timer and the length the presenter set for it.
//   const sync = useDeckSync(stage, { path, theme, setTheme, adoptTheme, timer, setTimer, override, setOverride })
//   sync.moved()   after a move made in this window: the others follow. False while the deck
//                  is still being placed (nothing sent), true once sent.
// It starts once the deck has mounted, so the position the URL gives it is this window's own, not
// a move. Theme, timer and length changes are sent as they happen; a position only through
// moved(), so the deck renumbering its slides after an edit (HMR) sends nobody to another slide.
// adoptTheme: false keeps this window's theme when it opens (its URL named one); later changes
// still reach it. override: the presenter's length, in ms, or null (the deck's own). path: the
// deck's (state/deck.ts), which keys the channel with this URL's query (core/sync.ts deckKey).
export interface DeckSyncOptions {
  path: string
  theme: Ref<string>
  setTheme: (name: string) => void
  adoptTheme: boolean
  timer: Ref<Timer>
  setTimer: (t: Timer) => void
  override: Ref<number | null>
  setOverride: (ms: unknown) => void
}

export function useDeckSync(stage: Stage, { path, theme, setTheme, adoptTheme, timer, setTimer, override, setOverride }: DeckSyncOptions) {
  let sync: Sync | null = null
  onMounted(() => {
    sync = createSync(deckKey(path, location.search))
    sync.register('pos', {
      get: () => ({ index: stage.index.value, step: stage.step.value }),
      set: (v: Position) => stage.place(v.index, v.step),
    })
    sync.register<string>('theme', { get: () => theme.value, set: setTheme, adopt: adoptTheme })
    // kept through a reload of every window (sessionStorage), not past closing them
    sync.register<Timer>('timer', { get: () => timer.value, set: setTimer, keep: true })
    sync.register<number | null>('duration', { get: () => override.value, set: setOverride, keep: true })
    sync.hello()
  })
  onBeforeUnmount(() => sync?.close())
  watch(theme, () => sync?.publish('theme'))
  watch(timer, () => sync?.publish('timer'))
  watch(override, () => sync?.publish('duration'))
  return {
    moved: () => !!sync && sync.publish('pos', true),
  }
}
