// The app of a slides project, in one call:
//   import { createDeckApp } from 'araojs'
//   createDeckApp().mount('#app')
// It installs the engine and renders one deck, picked from the URL's path: /<name>, the name of a
// .vue file directly in the project's decks folder (src/decks by default; the Vite plugin's
// `decks` option), case-insensitive, right after the app's base (Vite's `base`: /talks/<name>
// when the site is served under /talks/). The deck's code loads on its own: one chunk per deck.
// / (the base itself) lists the decks (DeckSelectorView): a card per deck, with its cover drawn in
// it, each a link to /<name>. A project with one deck opens it at / instead, unless
// createDeckApp({ deckList: 'always' }). A name that is no deck warns and shows the list, with a
// notice: it never opens another deck in its place.
// The URL is put in its one form, without a reload (history.replaceState), keeping the query and
// the hash: the old ?deck=<name> becomes /<name>, and a deck's path is written as the list writes
// it (/Talk/ → /talk), so every window of a deck has the same path (core/sync.ts keys on it).
// A project's only deck stays at / in the address bar: the deck is told its path
// (provideDeckRoute), so its windows at / and at /talk are in step, and its presenter window
// opens at /talk?presenter.
// A project with its own app shell installs the engine instead: createApp(MyApp).use(Arao).
import { createApp, defineAsyncComponent, h, type App, type Component } from 'vue'
import { decks, decksDir } from 'virtual:arao/decks'
import Arao from './plugin'
import { provideDeckRoute } from './state/deck'
import DeckSelectorView from './views/DeckSelectorView.vue'

// file names without ".vue", case-insensitive and in the reader's alphabetical order (the order of
// the list), code-point order between names that differ only in case. A path cannot tell those
// apart: the first one is kept, and the dev server says so.
const byName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }) || (a < b ? -1 : a > b ? 1 : 0)
const names: string[] = []
for (const name of Object.keys(decks).map((f) => f.slice(0, -'.vue'.length)).sort(byName)) {
  const kept = names.find((n) => n.toLowerCase() === name.toLowerCase())
  if (!kept) names.push(name)
  else if (import.meta.env.DEV) console.warn(`[arao] decks "${kept}" and "${name}" differ only in case: their path cannot tell them apart (${decksDir}/${kept}.vue opens)`)
}
const find = (wanted: string) => names.find((n) => n.toLowerCase() === wanted.toLowerCase())

// the title the list shows for a deck: its file name in words ("my-talk" → "My talk", "MyTalk" →
// "My Talk"); its cover's heading goes under it, once drawn
const humanise = (name: string) => {
  const words = name.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/[-_\s]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// The app's base, as a path ending in "/": Vite's base (/ or /talks/). A relative base (./) is
// the folder of the page, so there the deck must be the last segment of the path.
const baseOf = () => new URL(import.meta.env.BASE_URL, location.href).pathname
// a deck's path: its name as the list writes it
const pathOf = (base: string, name: string) => base + encodeURIComponent(name.toLowerCase())
const decode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}
// this URL at another path, with its query (but ?deck=) and its hash; a flag stays a flag
function moveTo(path: string) {
  const query = [...new URLSearchParams(location.search)]
    .filter(([key]) => key !== 'deck')
    .map(([key, value]) => encodeURIComponent(key) + (value ? `=${encodeURIComponent(value)}` : ''))
  history.replaceState(history.state, '', path + (query.length ? `?${query.join('&')}` : '') + location.hash)
}

// what to render: { name } of a deck, or {} for the list ({ missing } names one that is no deck)
type DeckList = 'auto' | 'always'
function pick(base: string, deckList: DeckList): { name?: string; missing?: string } {
  const asked = new URLSearchParams(location.search).get('deck')
  if (asked != null) moveTo(asked.trim() ? base + encodeURIComponent(asked.trim()) : base)
  // the first segment after the base; index.html is the base itself
  const rest = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : ''
  const wanted = decode(rest.split('/')[0]).trim()
  if (wanted && wanted !== 'index.html') {
    const name = find(wanted)
    if (name) {
      if (location.pathname !== pathOf(base, name)) moveTo(pathOf(base, name))
      return { name }
    }
    console.warn(`[arao] no deck "${wanted}" in ${decksDir} (there are: ${names.join(', ') || 'none'})`)
    return { missing: wanted }
  }
  if (names.length === 1 && deckList === 'auto') return { name: names[0] }
  if (!names.length) console.warn(`[arao] no decks in ${decksDir}: each .vue file directly in it is a deck (/<file name>)`)
  return {}
}

// createDeckApp's options, { deckList } or nothing; anything else warns and is ignored
// a deck as the list of decks shows it (views/DeckSelectorView.vue)
export interface DeckEntry {
  name: string
  title: string
  href: string
  path: string
  load: () => Promise<{ default: Component }>
}

const DECK_LIST: unknown[] = ['auto', 'always']
// createDeckApp's options
export interface DeckAppOptions {
  deckList?: DeckList
}
function readOptions(options: unknown): { deckList: DeckList } {
  const shape = `createDeckApp() takes an options object, createDeckApp({ deckList: 'always' })`
  if (options == null) return { deckList: 'auto' }
  if (typeof options !== 'object' || Array.isArray(options)) {
    console.warn(`[arao] ${shape}: got ${Array.isArray(options) ? 'an array' : typeof options === 'string' ? JSON.stringify(options) : typeof options}, ignored`)
    return { deckList: 'auto' }
  }
  for (const key of Object.keys(options)) {
    if (key !== 'deckList') console.warn(`[arao] createDeckApp(): no option "${key}" (its options: deckList); ignored`)
  }
  const { deckList = 'auto' } = options as { deckList?: unknown }
  if (DECK_LIST.includes(deckList)) return { deckList: deckList as DeckList }
  console.warn(`[arao] createDeckApp({ deckList }) is 'auto' (one deck opens at /) or 'always' (/ always lists), got ${JSON.stringify(deckList)}: 'auto'`)
  return { deckList: 'auto' }
}

export function createDeckApp(options?: DeckAppOptions): App {
  const { deckList } = readOptions(options)
  const base = baseOf()
  const { name, missing } = pick(base, deckList)
  const deck = name && defineAsyncComponent(decks[`${name}.vue`])
  const list: DeckEntry[] = names.map((n) => ({ name: n.toLowerCase(), title: humanise(n), href: pathOf(base, n), path: decode(pathOf(base, n)), load: decks[`${n}.vue`] }))
  const render = deck ? () => h(deck) : () => h(DeckSelectorView, { decks: list, missing, dir: decksDir })
  const app = createApp({ name: 'AraoDeckApp', render }).use(Arao)
  // without <!doctype html> the page renders in quirks mode: tables lose the theme's colour and size
  if (import.meta.env.DEV && typeof document !== 'undefined' && document.compatMode === 'BackCompat') {
    console.warn('[arao] index.html has no <!doctype html>: the page renders in quirks mode (tables lose their theme). Put <!doctype html> as its first line')
  }
  if (name) provideDeckRoute(app, { name, path: pathOf(base, name) })
  return app
}
