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

// file names without ".vue", case-insensitive and in the reader's alphabetical order (the order of
// the list), code-point order between names that differ only in case. ?deck= cannot tell those
// apart: the first one is kept, and the dev server says so.
const byName = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }) || (a < b ? -1 : a > b ? 1 : 0)
const names = []
for (const name of Object.keys(decks).map((f) => f.slice(0, -'.vue'.length)).sort(byName)) {
  const kept = names.find((n) => n.toLowerCase() === name.toLowerCase())
  if (!kept) names.push(name)
  else if (import.meta.env.DEV) console.warn(`[arao] decks "${kept}" and "${name}" differ only in case: ?deck= cannot tell them apart (${decksDir}/${kept}.vue opens)`)
}
const find = (wanted) => names.find((n) => n.toLowerCase() === wanted.toLowerCase())

// the title the list shows for a deck: its file name in words ("my-talk" → "My talk", "MyTalk" → "My Talk")
const humanise = (name) => {
  const words = name.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/[-_\s]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// the `deck` option out of createDeckApp's argument, which is { deck } or nothing. A bare string is
// taken for the name it obviously is, with a warning; anything else that is no object is ignored.
function deckOption(options) {
  if (options == null) return undefined
  if (typeof options === 'object' && !Array.isArray(options)) return options.deck
  const shape = `createDeckApp() takes an options object, createDeckApp({ deck: 'talk' })`
  if (typeof options === 'string') {
    console.warn(`[arao] ${shape}: got the string ${JSON.stringify(options)}, read as { deck: ${JSON.stringify(options)} }`)
    return options
  }
  console.warn(`[arao] ${shape}: got ${Array.isArray(options) ? 'an array' : typeof options}, ignored`)
  return undefined
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

export function createDeckApp(options) {
  const { name, missing } = pick(deckOption(options))
  const deck = name && defineAsyncComponent(decks[`${name}.vue`])
  const list = names.map((n) => ({ name: n.toLowerCase(), title: humanise(n) }))
  const render = deck ? () => h(deck) : () => h(DeckSelector, { decks: list, missing, dir: decksDir })
  return createApp({ name: 'AraoDeckApp', render }).use(Arao)
}
