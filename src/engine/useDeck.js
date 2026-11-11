import { inject } from 'vue'
import { DECK } from './registry'

// For addons: any component placed inside <Deck> can read where the deck is.
// { index, step, total, steps, progress, theme } are refs; next/prev/go(i, step) navigate.
export function useDeck() {
  const deck = inject(DECK, null)
  if (!deck) throw new Error('[phoenyx] useDeck() must be used inside <Deck>')
  return deck.api
}
