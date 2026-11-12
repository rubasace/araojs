// Phoenyx, the library: what a slides project imports from 'phoenyxjs'.
//   createDeckApp()   the whole app: the engine installed, the deck picked from ?deck=<name>
//   default export    the Vue plugin (app.use(Phoenyx)), for a project with its own app shell
//   components, directives and composables, for code that wants them by name
//   ProgressBar, SlideNumber: the addons, imported by the decks that use them
// It needs the Vite plugin (phoenyxjs/vite): the engine reads the project's decks, snippets and
// images (and the icons they use) through virtual modules only that plugin provides. Its CSS comes along with it.
export {
  default,
  Center,
  Cols,
  Deck,
  Grid,
  Icon,
  Img,
  Notes,
  Rows,
  Slide,
  Snippet,
  step,
  stepFrom,
  useDeck,
  useSlide,
} from './engine'
export { default as ProgressBar } from './addons/ProgressBar.vue'
export { default as SlideNumber } from './addons/SlideNumber.vue'
export { createDeckApp } from './app'
