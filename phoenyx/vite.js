// Vite plugin for Phoenyx. Exposes two project folders as virtual modules, so slides name
// files and need no imports:
//   snippets  <Snippet file="App.java">   default src/snippets   (source text, loaded lazily)
//   images    <Img file="team.jpg">       default src/images     (URLs; subfolders allowed)
//   plugins: [vue(), phoenyx({ snippets: 'src/snippets', images: 'src/images' })]
const folder = (path) => '/' + path.replace(/^\.?\/+|\/+$/g, '')

// one virtual module per folder: files by path inside the folder → what `glob` gives for each
const modules = {
  snippets: (dir, path) => `const files = import.meta.glob(${JSON.stringify(dir + '/**/*')}, { query: '?raw', import: 'default' })
const prefix = ${JSON.stringify(dir + '/')}
export const snippets = Object.fromEntries(Object.entries(files).map(([k, v]) => [k.slice(prefix.length), v]))
export const snippetsDir = ${JSON.stringify(path)}`,
  // eager URLs: a slide renders its pictures at once, with no async hop (and so no flash of
  // an empty box); a URL is only a string, the browser fetches the file when an <img> uses it
  images: (dir, path) => `const files = import.meta.glob(${JSON.stringify(dir + '/**/*')}, { query: '?url', import: 'default', eager: true })
const prefix = ${JSON.stringify(dir + '/')}
export const images = Object.fromEntries(Object.entries(files).map(([k, v]) => [k.slice(prefix.length), v]))
export const imagesDir = ${JSON.stringify(path)}`,
}

export default function phoenyx({ snippets = 'src/snippets', images = 'src/images' } = {}) {
  const paths = { snippets, images }
  const resolved = (name) => `\0virtual:phoenyx/${name}`
  return {
    name: 'phoenyx',
    resolveId(id) {
      const name = id.startsWith('virtual:phoenyx/') && id.slice('virtual:phoenyx/'.length)
      return name in modules ? resolved(name) : null
    },
    load(id) {
      const name = Object.keys(modules).find((n) => id === resolved(n))
      return name ? modules[name](folder(paths[name]), paths[name]) : null
    },
  }
}
