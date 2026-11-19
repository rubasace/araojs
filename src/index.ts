// Arao, the library: what a slides project imports from 'araojs'. The only barrel: every
// other module imports the file it uses.
//   createDeckApp()   the whole app: the engine installed, the deck picked from the path, /<name>
//   default export    the Vue plugin (app.use(Arao)), for a project with its own app shell
//   components, directives and composables, for code that wants them by name
//   ProgressBar, SlideNumber: the addons, imported by the decks that use them
// It needs the Vite plugin (araojs/vite): the engine reads the project's decks, snippets and
// images (and the icons they use) through virtual modules only that plugin provides. Its CSS comes along with it.
// The plugin goes first: its imports set the order of the CSS in the build. The layouts (the
// library's layouts/ and the project's src/layouts, virtual:arao/layout-styles) come after all of
// the engine's CSS, and the themes (every CSS file of the theme sources' folders,
// virtual:arao/theme-styles) last, as when a project imported them itself (the library build fails
// if those imports are not the last two, in that order: vite.config.js, themeStylesError).
export { default } from './plugin'
export { default as Deck } from './components/Deck.vue'
import SlideImpl, { type SlideComponent } from './components/Slide.vue'
// typed generic in its layout: the attributes it takes are its layout's parameters (Slide.vue)
export const Slide = SlideImpl as unknown as SlideComponent
export { default as Background } from './components/Background.vue'
export { default as Img } from './components/Img.vue'
export { default as Icon } from './components/Icon.vue'
export { default as Snippet } from './components/Snippet.vue'
export { default as Notes } from './components/Notes.vue'
export { default as Agenda } from './components/Agenda.vue'
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
export type { SlideLayouts, SlideLayoutZones, ProjectLayouts, ProjectLayoutZones } from './components/Slide.vue'
export type { DeckSlide, Role } from './state/stage'
export type { Timer } from './state/timer'

// Global components and directives (app.use(Arao) registers them, plugin.ts): typed for the
// templates of a TypeScript project (Volar / vue-tsc check their props).
import type DeckComponent from './components/Deck.vue'
import type BackgroundComponent from './components/Background.vue'
import type ImgComponent from './components/Img.vue'
import type IconComponent from './components/Icon.vue'
import type SnippetComponent from './components/Snippet.vue'
import type NotesComponent from './components/Notes.vue'
import type AgendaComponent from './components/Agenda.vue'
import type { default as StepDirective, stepFrom as StepFromDirective } from './directives/step'
declare module 'vue' {
  export interface GlobalComponents {
    Deck: typeof DeckComponent
    Slide: SlideComponent
    Background: typeof BackgroundComponent
    Img: typeof ImgComponent
    Icon: typeof IconComponent
    Snippet: typeof SnippetComponent
    Notes: typeof NotesComponent
    Agenda: typeof AgendaComponent
  }
  export interface GlobalDirectives {
    vStep: typeof StepDirective
    vStepFrom: typeof StepFromDirective
  }
}

import 'virtual:arao/layout-styles'
import 'virtual:arao/theme-styles'
