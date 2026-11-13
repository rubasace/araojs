// Arao, the library: what a slides project imports from 'araojs'. The only barrel: every
// other module imports the file it uses.
//   createDeckApp()   the whole app: the engine installed, the deck picked from the path, /<name>
//   default export    the Vue plugin (app.use(Arao)), for a project with its own app shell
//   components, directives and composables, for code that wants them by name
//   ProgressBar, SlideNumber: the addons, imported by the decks that use them
// It needs the Vite plugin (araojs/vite): the engine reads the project's decks, snippets and
// images (and the icons they use) through virtual modules only that plugin provides. Its CSS comes along with it.
// The plugin goes first: its imports set the order of the CSS in the build. The project's themes
// (every CSS file of its themes folder, virtual:arao/theme-styles) go last, after all of the
// engine's CSS, as when a project imported them itself.
export { default } from './plugin'
export { default as Deck } from './components/Deck.vue'
export { default as Slide } from './components/Slide.vue'
export { default as Img } from './components/Img.vue'
export { default as Icon } from './components/Icon.vue'
export { default as Snippet } from './components/Snippet.vue'
export { Notes } from './components/Notes'
export { default as Cols } from './components/layout/Cols.vue'
export { default as Rows } from './components/layout/Rows.vue'
export { default as Grid } from './components/layout/Grid.vue'
export { default as Center } from './components/layout/Center.vue'
export { default as step, stepFrom } from './directives/step'
export { useDeck } from './state/deck'
export { useSlide } from './state/slide'
export { default as ProgressBar } from './addons/ProgressBar.vue'
export { default as SlideNumber } from './addons/SlideNumber.vue'
export { createDeckApp } from './app'
import 'virtual:arao/theme-styles'
