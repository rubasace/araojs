import { inject, provide } from 'vue'

// Internal. What the deck's own UI (Controls, Presenter, PresenterBar) reads from its Deck: one
// context per Deck, provided by it and injected by them, instead of props passed down. Slides and
// addons do not use it: they have useDeck() (the stage they are drawn in) and useSlide().
//   provideDeckContext(context)   in Deck
//   const { deck, … } = useDeckContext()
// The context:
//   deck                        the audience's stage api (useDeck): where the deck is, next/prev/go
//   hud                         the floating controls are shown (the mouse moved, a tap in the middle)
//   titles                      every slide's title, for the jump menu
//   theme, themes, setTheme     the theme worn, the deck's list, and wearing another
//   fullscreen, toggleFullscreen
//   openPresenter               opens the presenter window (from the audience's window)
//   title, next, notes          the presenter view: the title of the slide on screen, where one
//                               more press leads ({ index, step, end }), the slide's Notes
//   timer, setTimer, duration   the talk's timer (core/timer.js) and its length in ms (or null)
// Every value is a ref (or computed) or a function, except deck, a plain object of refs.
const KEY = Symbol('phoenyx-deck-ui')

export function provideDeckContext(context) {
  provide(KEY, context)
  return context
}

export function useDeckContext() {
  const context = inject(KEY, null)
  if (!context) throw new Error('[phoenyx] the deck controls and presenter view only work inside <Deck>')
  return context
}
