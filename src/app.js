// The app of a slides project, in one call:
//   import { createDeckApp } from 'phoenyxjs'
//   createDeckApp().mount('#app')
// It installs the engine and renders one deck, picked from ?deck=<name>: the name of a .vue file
// directly in the project's decks folder (src/decks by default; the Vite plugin's `decks` option),
// case-insensitive. Without ?deck=, or with a name that is no deck, it opens the first deck by
// name, silently. The deck's code loads on its own: one chunk per deck.
// A project with its own app shell installs the engine instead: createApp(MyApp).use(Phoenyx).
import { createApp, defineAsyncComponent, h } from 'vue'
import { decks, decksDir } from 'virtual:phoenyx/decks'
import Phoenyx from './engine'

// file names without ".vue", in plain string order (the export CLI picks its default the same way)
const names = Object.keys(decks).map((f) => f.slice(0, -'.vue'.length)).sort()

export function createDeckApp() {
  const wanted = new URLSearchParams(location.search).get('deck')?.toLowerCase()
  const name = (wanted && names.find((n) => n.toLowerCase() === wanted)) || names[0]
  if (!name) console.warn(`[phoenyx] no decks in ${decksDir}: each .vue file directly in it is a deck (?deck=<file name>)`)
  const deck = name ? defineAsyncComponent(decks[`${name}.vue`]) : null
  return createApp({ name: 'PhoenyxDeckApp', render: () => (deck ? h(deck) : null) }).use(Phoenyx)
}
