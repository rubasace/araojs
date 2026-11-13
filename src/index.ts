// Arao, the library: what a slides project imports from 'araojs'. The only barrel: every
// other module imports the file it uses.
//   createDeckApp()   the whole app: the engine installed, the deck picked from the path, /<name>
//   default export    the Vue plugin (app.use(Arao)), for a project with its own app shell
//   components, directives and composables, for code that wants them by name
//   ProgressBar, SlideNumber: the addons, imported by the decks that use them
// It needs the Vite plugin (araojs/vite): the engine reads the project's decks, snippets and
// images (and the icons they use) through virtual modules only that plugin provides. Its CSS comes along with it.
// The plugin goes first: its imports set the order of the CSS in the build. The project's themes
// (every CSS file of its theme sources' folders, virtual:arao/theme-styles) go last, after all of the
// engine's CSS, as when a project imported them itself (the library build fails if that import is
// not the last: vite.config.js, themeStylesError).
export { default } from './plugin'
export { default as Deck } from './components/Deck.vue'
export { default as Slide } from './components/Slide.vue'
export { default as Img } from './components/Img.vue'
export { default as Icon } from './components/Icon.vue'
export { default as Snippet } from './components/Snippet.vue'
export { default as Notes } from './components/Notes.vue'
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
export { defineShortcuts } from './core/shortcuts'
export type { Command, ShortcutMap } from './core/shortcuts'
export type { DeckAppOptions } from './app'
export type { DeckFace } from './state/deck'
export type { SlideControls } from './state/slide'
export type { Role } from './state/stage'
export type { Timer } from './state/timer'

// Global components and directives (app.use(Arao) registers them, plugin.ts): typed for the
// templates of a TypeScript project (Volar / vue-tsc check their props).
import type DeckComponent from './components/Deck.vue'
import type SlideComponent from './components/Slide.vue'
import type ImgComponent from './components/Img.vue'
import type IconComponent from './components/Icon.vue'
import type SnippetComponent from './components/Snippet.vue'
import type NotesComponent from './components/Notes.vue'
import type ColsComponent from './components/layout/Cols.vue'
import type RowsComponent from './components/layout/Rows.vue'
import type GridComponent from './components/layout/Grid.vue'
import type CenterComponent from './components/layout/Center.vue'
import type { default as StepDirective, stepFrom as StepFromDirective } from './directives/step'
declare module 'vue' {
  export interface GlobalComponents {
    Deck: typeof DeckComponent
    Slide: typeof SlideComponent
    Img: typeof ImgComponent
    Icon: typeof IconComponent
    Snippet: typeof SnippetComponent
    Notes: typeof NotesComponent
    Cols: typeof ColsComponent
    Rows: typeof RowsComponent
    Grid: typeof GridComponent
    Center: typeof CenterComponent
  }
  export interface GlobalDirectives {
    vStep: typeof StepDirective
    vStepFrom: typeof StepFromDirective
  }
}

import 'virtual:arao/theme-styles'
