import { onMounted, watch } from 'vue'
import { useEventListener } from '@vueuse/core'

// Internal. The URL's hash is where the deck stands: #/slide/step, both 1-based.
//   useHashRoute(stage)
// Read once the deck has mounted and whenever the hash changes (stage.go: a move like any other);
// written on every change of position, replacing the history entry instead of adding one.
export function useHashRoute(stage) {
  function read() {
    const [, i, s] = location.hash.match(/^#\/(\d+)(?:\/(\d+))?/) || []
    if (i) stage.go(Number(i) - 1, Number(s || 1))
  }
  onMounted(read)
  useEventListener(window, 'hashchange', read)
  watch([stage.index, stage.step], () => history.replaceState(null, '', `#/${stage.index.value + 1}/${stage.step.value}`))
}
