// Vite plugin for Phoenyx. Exposes two project folders as virtual modules, so slides name
// files and need no imports:
//   snippets  <Snippet file="App.java">   default src/snippets   (source text, loaded lazily)
//   images    <Img file="team.jpg">       default src/images     (URLs; subfolders allowed)
//   plugins: [vue(), phoenyx({ snippets: 'src/snippets', images: 'src/images' })]
// A folder is a path relative to the Vite root, or an absolute path. One outside the root
// ("../shared/images") works the same: the dev server is allowed to serve it (server.fs.allow)
// and watches it. A folder that was set but does not exist is reported when Vite starts.
//
// Images: only pictures are taken (png, jpg, jpeg, gif, webp, avif, svg, in any case); anything
// else in the folder (notes, sources, .psd) stays out of the build. Names are case-sensitive,
// as on most servers: file="Team.jpg" is not team.jpg.
// Their URLs are eager: a slide renders its pictures at once, with no async hop, so a slide
// never shows an empty box first. The cost: every slide is in the page from the start, so the
// browser fetches every picture the deck uses when it opens. Downscale pictures to the size they
// show at (the canvas is 1920x1080: a full-slide background needs no more than 1920 px wide) and
// prefer JPEG or WebP for photos.
import { existsSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { searchForWorkspaceRoot } from 'vite'

const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg']
const DEFAULTS = { snippets: 'src/snippets', images: 'src/images' }

// what each folder's glob takes, and how
const modules = {
  snippets: { pattern: '**/*', options: "{ query: '?raw', import: 'default' }" },
  images: { pattern: `**/*.{${IMAGES}}`, options: "{ query: '?url', import: 'default', eager: true, caseSensitive: false }" },
}

// glob syntax in a folder's name is literal: "talk (draft)", "[2024]"
const escapeGlob = (s) => s.replace(/[()[\]{}*?!+@|\\]/g, '\\$&')

export default function phoenyx(options = {}) {
  const folders = {}
  for (const name of Object.keys(modules)) {
    const f = options[name] ?? DEFAULTS[name]
    if (typeof f !== 'string' || !f.trim()) throw new Error(`[phoenyx] the ${name} folder must be a path, got ${JSON.stringify(f)}`)
    folders[name] = f.trim()
  }
  let root = process.cwd()
  const dir = (name) => resolve(root, folders[name])
  const isOutside = (d) => {
    const r = relative(root, d)
    return r === '..' || r.startsWith('..' + sep) || isAbsolute(r)
  }
  const outside = () => Object.keys(modules).map(dir).filter(isOutside)
  const resolved = (name) => `\0virtual:phoenyx/${name}`

  return {
    name: 'phoenyx',
    config(user) {
      root = resolve(user.root ?? process.cwd()) // as Vite resolves it
      const extra = outside()
      if (!extra.length) return
      // Setting server.fs.allow replaces Vite's default (the workspace root): keep it, unless
      // the project set its own list, which Vite merges with this one.
      const base = user.server?.fs?.allow ? [] : [searchForWorkspaceRoot(root)]
      return { server: { fs: { allow: [...base, ...extra] } } }
    },
    configResolved(config) {
      root = config.root
      for (const name of Object.keys(modules)) {
        if (options[name] != null && !existsSync(dir(name)))
          config.logger.warn(`[phoenyx] the ${name} folder "${folders[name]}" does not exist (${dir(name)}): files named in slides will show as missing`)
      }
    },
    configureServer(server) {
      // the watcher covers the root; a folder outside it is added, so its new files show up live
      for (const d of outside()) server.watcher.add(d)
    },
    resolveId(id) {
      const name = id.startsWith('virtual:phoenyx/') && id.slice('virtual:phoenyx/'.length)
      return name in modules ? resolved(name) : null
    },
    load(id) {
      const name = Object.keys(modules).find((n) => id === resolved(n))
      if (!name) return null
      // globs starting with "/" are relative to the root ("/../shared" leaves it); Vite keys
      // each file by its path from the root, so the folder's part is cut off the keys
      const rel = relative(root, dir(name)).split(sep).join('/')
      const prefix = rel ? `/${rel}/` : '/'
      const glob = (rel ? `/${escapeGlob(rel)}/` : '/') + modules[name].pattern
      return `const files = import.meta.glob(${JSON.stringify(glob)}, ${modules[name].options})
const prefix = ${JSON.stringify(prefix)}
// no prototype: a file named "constructor" or "toString" is looked up, not an Object method
export const ${name} = Object.assign(Object.create(null), Object.fromEntries(Object.entries(files).map(([k, v]) => [k.slice(prefix.length), v])))
export const ${name}Dir = ${JSON.stringify(folders[name])}`
    },
  }
}
