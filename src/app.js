// The app of a slides project, in one call:
//   import { createDeckApp } from 'araojs'
//   createDeckApp().mount('#app')
// It installs the engine and renders one deck, picked from ?deck=<name>: the name of a .vue file
// directly in the project's decks folder (src/decks by default; the Vite plugin's `decks` option),
// case-insensitive. The deck's code loads on its own: one chunk per deck.
// Without ?deck=, it opens the project's only deck; with several, it lists them (DeckSelector),
// each a link to ?deck=<name>. createDeckApp({ deck: 'talk' }) names the deck to open instead of
// the list. A name that is no deck (in the URL or in `deck`) warns and shows the list: it never
// opens another deck in its place.
// A project with its own app shell installs the engine instead: createApp(MyApp).use(Arao).
import { createApp, defineAsyncComponent, h } from 'vue'
import { decks, decksDir } from 'virtual:arao/decks'
import Arao from './plugin'
import DeckSelector from './views/DeckSelector.vue'

// file names without ".vue", in plain string order (the export CLI picks its default the same way)
const names = Object.keys(decks).map((f) => f.slice(0, -'.vue'.length)).sort()
const find = (wanted) => names.find((n) => n.toLowerCase() === wanted.toLowerCase())

// the title the list shows for a deck: its file name in words ("my-talk" → "My talk", "MyTalk" → "My Talk")
const humanise = (name) => {
  const words = name.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/[-_\s]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// what to render: { name } of a deck, or {} for the list ({ missing } names one that is no deck)
function pick(option) {
  const asked = new URLSearchParams(location.search).get('deck')?.trim()
  const preset = typeof option === 'string' ? option.trim() : ''
  if (option != null && !preset) console.warn(`[arao] createDeckApp({ deck }) takes the name of a deck, got ${JSON.stringify(option)}`)
  const wanted = asked || preset
  if (wanted) {
    const name = find(wanted)
    if (name) return { name }
    const source = asked ? '?deck=' : 'createDeckApp({ deck })'
    console.warn(`[arao] ${source}: no deck "${wanted}" in ${decksDir} (there are: ${names.join(', ') || 'none'})`)
    return { missing: wanted }
  }
  if (names.length === 1) return { name: names[0] }
  if (!names.length) console.warn(`[arao] no decks in ${decksDir}: each .vue file directly in it is a deck (?deck=<file name>)`)
  return {}
}

export function createDeckApp({ deck: option } = {}) {
  const { name, missing } = pick(option)
  const deck = name && defineAsyncComponent(decks[`${name}.vue`])
  const list = names.map((n) => ({ name: n.toLowerCase(), title: humanise(n) }))
  const render = deck ? () => h(deck) : () => h(DeckSelector, { decks: list, missing, dir: decksDir })
  return createApp({ name: 'AraoDeckApp', render }).use(Arao)
}
