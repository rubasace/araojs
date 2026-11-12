import { inject } from 'vue'
import { DECK } from '../core/registry'

// For addons: any component placed inside <Deck> can read where the deck is.
// { index, step, total, steps, progress, theme } are refs; next/prev/go(i, step) navigate.
// The presenter view draws the deck twice, the current slide and a preview of the next step:
// in the preview, an addon reads the preview's position, and next/prev/go do nothing.
// role (a plain string) says which drawing a component is in: 'audience' (the audience window),
// 'presenter' (the presenter view's current slide), 'preview' (its next step) or 'export' (the
// deck being printed, ?export: each page is a static copy, so what plays does not print). Everything
// mounts once per drawing, so a presenter window runs it twice: skip side effects (timers,
// fetches, autoplay, sound) where they do not belong.
//   const deck = useDeck()
//   onMounted(() => deck.role === 'audience' && video.value.play())
export function useDeck() {
  const deck = inject(DECK, null)
  if (!deck) throw new Error('[phoenyx] useDeck() must be used inside <Deck>')
  return deck.api
}
