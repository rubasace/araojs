// The Vue plugin: app.use(Phoenyx) registers what a deck uses without importing it.
//   components   Deck, Slide, Img, Icon, Notes, Snippet, Cols, Rows, Grid, Center
//   directives   v-step, v-step-from
// It also brings the engine's CSS (structure and layouts; each component carries its own).
// The addons (ProgressBar, SlideNumber) are not global: a deck imports the ones it uses.
// Import order is CSS order: the components' styles, then engine.css, then layouts.css.
import Deck from './components/Deck.vue'
import Slide from './components/Slide.vue'
import Img from './components/Img.vue'
import Icon from './components/Icon.vue'
import { Notes } from './components/Notes'
import { Center, Cols, Grid, Rows } from './components/layout'
import step, { stepFrom } from './directives/step'
import Snippet from './components/Snippet.vue'
import './styles/engine.css'
import './styles/layouts.css'

export default {
  install(app) {
    app.component('Deck', Deck)
    app.component('Slide', Slide)
    app.component('Img', Img)
    app.component('Icon', Icon)
    app.component('Notes', Notes)
    app.component('Snippet', Snippet)
    for (const c of [Cols, Rows, Grid, Center]) app.component(c.name, c)
    app.directive('step', step)
    app.directive('step-from', stepFrom)
  },
}
