import Deck from './Deck.vue'
import Slide from './Slide.vue'
import step from './step'
import { useDeck } from './useDeck'
import { useSlide } from './useSlide'
import Snippet from '../components/Snippet.vue'
import './engine.css'

export { Deck, Slide, Snippet, step, useDeck, useSlide }

export default {
  install(app) {
    app.component('Deck', Deck)
    app.component('Slide', Slide)
    app.component('Snippet', Snippet)
    app.directive('step', step)
  },
}
