import Deck from './Deck.vue'
import Slide from './Slide.vue'
import { Center, Cols, Grid, Rows } from './layout'
import step from './step'
import { useDeck } from './useDeck'
import { useSlide } from './useSlide'
import Snippet from '../components/Snippet.vue'
import './engine.css'

export { Center, Cols, Deck, Grid, Rows, Slide, Snippet, step, useDeck, useSlide }

export default {
  install(app) {
    app.component('Deck', Deck)
    app.component('Slide', Slide)
    app.component('Snippet', Snippet)
    for (const c of [Cols, Rows, Grid, Center]) app.component(c.name, c)
    app.directive('step', step)
  },
}
