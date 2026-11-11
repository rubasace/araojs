// Vite plugin for Phoenyx. Exposes the project's snippet folder as a virtual module so
// <Snippet file="App.java"> works with no imports. Default folder: src/snippets.
//   plugins: [vue(), phoenyx({ snippets: 'src/snippets' })]
const ID = 'virtual:phoenyx/snippets'
const RESOLVED = '\0' + ID

export default function phoenyx({ snippets = 'src/snippets' } = {}) {
  const dir = '/' + snippets.replace(/^\.?\/+|\/+$/g, '')
  return {
    name: 'phoenyx',
    resolveId: (id) => (id === ID ? RESOLVED : null),
    load(id) {
      if (id !== RESOLVED) return null
      // lazy: each snippet is its own chunk, fetched when a slide uses it
      return `const files = import.meta.glob(${JSON.stringify(dir + '/**/*')}, { query: '?raw', import: 'default' })
const prefix = ${JSON.stringify(dir + '/')}
export const snippets = Object.fromEntries(Object.entries(files).map(([k, v]) => [k.slice(prefix.length), v]))
export const snippetsDir = ${JSON.stringify(snippets)}`
    },
  }
}
