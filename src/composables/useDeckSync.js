import { onBeforeUnmount, onMounted, watch } from 'vue'
import { createSync, deckKey } from '../core/sync'

// Internal. Every window of the same deck in the same browser in step (core/sync.js): where the
// deck stands, its theme, the talk's timer and the length the presenter set for it.
//   const sync = useDeckSync(stage, { theme, setTheme, adoptTheme, timer, setTimer, override, setOverride })
//   sync.moved()   after a move made in this window: the others follow. False while the deck
//                  is still being placed (nothing sent), true once sent.
// It starts once the deck has mounted, so the position the URL gives it is this window's own, not
// a move. Theme, timer and length changes are sent as they happen; a position only through
// moved(), so the deck renumbering its slides after an edit (HMR) sends nobody to another slide.
// adoptTheme: false keeps this window's theme when it opens (its URL named one); later changes
// still reach it. override: the presenter's length, in ms, or null (the deck's own).
export function useDeckSync(stage, { theme, setTheme, adoptTheme, timer, setTimer, override, setOverride }) {
  let sync = null
  onMounted(() => {
    sync = createSync(deckKey(location))
    sync.register('pos', {
      get: () => ({ index: stage.index.value, step: stage.step.value }),
      set: (v) => stage.place(v.index, v.step),
    })
    sync.register('theme', { get: () => theme.value, set: setTheme, adopt: adoptTheme })
    // kept through a reload of every window (sessionStorage), not past closing them
    sync.register('timer', { get: () => timer.value, set: setTimer, keep: true })
    sync.register('duration', { get: () => override.value, set: setOverride, keep: true })
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
