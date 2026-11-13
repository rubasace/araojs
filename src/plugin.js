// The Vue plugin: app.use(Arao) registers what a deck uses without importing it.
//   components   Deck, Slide, Img, Icon, Notes, Snippet, Cols, Rows, Grid, Center
//   directives   v-step, v-step-from
// The addons (ProgressBar, SlideNumber) are not global: a deck imports the ones it uses.
// CSS: every component brings its own (its .vue file's <style>); styles/ holds what is global.
// Import order is CSS order, and it matters where two rules of the same specificity meet:
//   tokens.css first (the defaults, zero specificity);
//   the views (through Deck), then Snippet before Slide (a Snippet in an image zone takes the
//   zone's flex), Img before Slide, Slide before Icon and the layout pieces (both keep their own
//   flex in an image zone), Img before the layout pieces (their children clip overflow-x);
//   base.css last (its step fade wins over Snippet's own transitions). The project's themes come
//   after all of the engine's CSS: index.js imports them last (the build checks it).
// The library build checks three of them in dist/arao.css (vite.config.js, CSS_ORDER): Snippet's
// flex, the overflow-x of an Img in Cols, the step fade.
import './styles/tokens.css'
import Deck from './components/Deck.vue'
import Snippet from './components/Snippet.vue'
import Img from './components/Img.vue'
import Slide from './components/Slide.vue'
import Icon from './components/Icon.vue'
import Cols from './components/layout/Cols.vue'
import Rows from './components/layout/Rows.vue'
import Grid from './components/layout/Grid.vue'
import Center from './components/layout/Center.vue'
import { Notes } from './components/Notes'
import step, { stepFrom } from './directives/step'
import './styles/base.css'

export default {
  install(app) {
    app.component('Deck', Deck)
    app.component('Slide', Slide)
    app.component('Img', Img)
    app.component('Icon', Icon)
    app.component('Notes', Notes)
    app.component('Snippet', Snippet)
    app.component('Cols', Cols)
    app.component('Rows', Rows)
    app.component('Grid', Grid)
    app.component('Center', Center)
    app.directive('step', step)
    app.directive('step-from', stepFrom)
  },
}
