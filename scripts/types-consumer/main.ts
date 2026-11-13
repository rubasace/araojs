// A TypeScript project using araojs: what its types must allow, and what they must reject.
import Arao, { createDeckApp, useDeck, useSlide, Deck, type DeckFace } from 'araojs'
import arao from 'araojs/vite'

const app = createDeckApp()
app.use(Arao)
const plugins: import('vite').Plugin[] = arao({ decks: 'src/decks' })
void plugins
void Deck

export function inComponent(): void {
  const deck: DeckFace = useDeck()
  const n: number = deck.index.value
  deck.next()
  const slide = useSlide()
  slide.requireSteps(3)
  // @ts-expect-error the deck's refs are read-only
  deck.index.value = n + 1
  // @ts-expect-error useDeck() is not a number
  const wrong: number = useDeck
  void wrong
}
