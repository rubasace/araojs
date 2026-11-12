// Phoenyx, the library: what a slides project imports from 'phoenyxjs'. The only barrel: every
// other module imports the file it uses.
//   createDeckApp()   the whole app: the engine installed, the deck picked from ?deck=<name>
//   default export    the Vue plugin (app.use(Phoenyx)), for a project with its own app shell
//   components, directives and composables, for code that wants them by name
//   ProgressBar, SlideNumber: the addons, imported by the decks that use them
// It needs the Vite plugin (phoenyxjs/vite): the engine reads the project's decks, snippets and
// images (and the icons they use) through virtual modules only that plugin provides. Its CSS comes along with it.
// The plugin goes first: its imports set the order of the CSS in the build.
export { default } from './plugin'
export { default as Deck } from './components/Deck.vue'
export { default as Slide } from './components/Slide.vue'
export { default as Img } from './components/Img.vue'
export { default as Icon } from './components/Icon.vue'
export { default as Snippet } from './components/Snippet.vue'
export { Notes } from './components/Notes'
export { Center, Cols, Grid, Rows } from './components/layout'
export { default as step, stepFrom } from './directives/step'
export { useDeck } from './composables/useDeck'
export { useSlide } from './composables/useSlide'
export { default as ProgressBar } from './addons/ProgressBar.vue'
export { default as SlideNumber } from './addons/SlideNumber.vue'
export { createDeckApp } from './app'
