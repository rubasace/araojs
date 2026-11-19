// The Vue plugin: app.use(Arao) registers what a deck uses without importing it.
//   components   Deck, Slide, Background, Img, Icon, Notes, Snippet, Agenda
//   directives   v-step, v-step-from
// The addons (ProgressBar, SlideNumber) are not global: a deck imports the ones it uses.
// CSS: every component brings its own (its .vue file's <style>); styles/ holds what is global,
// and the utility classes a deck writes (styles/utilities.css).
// Import order is CSS order, and it matters where two rules of the same specificity meet:
//   tokens.css first (the defaults, zero specificity);
//   the views (through Deck), then Snippet, Img (and Background, which uses it), Slide, Icon,
//   Notes, Agenda, then utilities.css: Img before the utility classes (the children of their
//   columns clip overflow-x); base.css last (its step fade wins over Snippet's own transitions).
//   The layouts (the library's layouts/ and the project's) and then the themes come after all of
//   the engine's CSS: index.ts imports them last (the build checks it).
// The library build checks two of them in dist/arao.css (vite.config.js, CSS_ORDER): the
// overflow-x of an Img in a column of the utility classes, the step fade.
import './styles/tokens.css'
import Deck from './components/Deck.vue'
import Snippet from './components/Snippet.vue'
import Img from './components/Img.vue'
import Background from './components/Background.vue'
import Slide from './components/Slide.vue'
import Icon from './components/Icon.vue'
import Notes from './components/Notes.vue'
import Agenda from './components/Agenda.vue'
import step, { stepFrom } from './directives/step'
import type { App, Plugin } from 'vue'
import './styles/utilities.css'
import './styles/base.css'

const Arao: Plugin = {
  install(app: App) {
    app.component('Deck', Deck)
    app.component('Slide', Slide)
    app.component('Background', Background)
    app.component('Img', Img)
    app.component('Icon', Icon)
    app.component('Notes', Notes)
    app.component('Snippet', Snippet)
    app.component('Agenda', Agenda)
    app.directive('step', step)
    app.directive('step-from', stepFrom)
  },
}

export default Arao
