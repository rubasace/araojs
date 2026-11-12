// Vite plugin for Phoenyx: everything a slides project needs in its vite.config.js.
//   import phoenyx from 'phoenyxjs/vite'
//   export default defineConfig({ plugins: [phoenyx()] })
// It brings @vitejs/plugin-vue along (with Pug for the templates), so the project adds neither;
// Vue's options go in phoenyx({ vue: { … } }). Do not add vue() as well: the plugin would run twice.
//
// It exposes three project folders as virtual modules, so slides name files and need no imports:
//   decks     ?deck=talk                  default src/decks      (each .vue file directly in it)
//   snippets  <Snippet file="App.java">   default src/snippets   (source text, loaded lazily)
//   images    <Img file="team.jpg">       default src/images     (URLs; subfolders allowed)
//   phoenyx({ decks: 'src/decks', snippets: 'src/snippets', images: 'src/images' })
// A folder is a path relative to the Vite root, or an absolute path. One outside the root
// ("../shared/images") works the same: the dev server is allowed to serve it (server.fs.allow)
// and watches it. A folder that was set but does not exist is reported when Vite starts.
//
// Decks: one lazily loaded chunk each; createDeckApp() picks one from ?deck=<file name>, and the
// export CLI (phoenyx export) looks for decks in the same folder.
//
// Images: only pictures are taken (png, jpg, jpeg, gif, webp, avif, svg, in any case); anything
// else in the folder (notes, sources, .psd) stays out of the build. Names are case-sensitive,
// as on most servers: file="Team.jpg" is not team.jpg.
// Their URLs are eager: a slide renders its pictures at once, with no async hop, so a slide
// never shows an empty box first. The cost: every slide is in the page from the start, so the
// browser fetches every picture the deck uses when it opens. Size photos for the screen: text and
// SVG stay sharp at any scale, but a photo is upscaled with the canvas, so for 4K a full-slide
// background wants ~3840 px wide (twice its size in canvas px); prefer WebP/AVIF/JPEG for photos.
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { searchForWorkspaceRoot } from 'vite'

const require = createRequire(import.meta.url)
// the package's own name, so that renaming it on publish needs no change here
const { name: PACKAGE } = require('../package.json')

const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg']
const DEFAULTS = { decks: 'src/decks', snippets: 'src/snippets', images: 'src/images' }

// what each folder's glob takes, and how; and what a missing folder means
const modules = {
  decks: { pattern: '*.vue', options: '{}', missing: 'createDeckApp() has no deck to open' },
  snippets: { pattern: '**/*', options: "{ query: '?raw', import: 'default' }", missing: 'files named in slides will show as missing' },
  images: { pattern: `**/*.{${IMAGES}}`, options: "{ query: '?url', import: 'default', eager: true, caseSensitive: false }", missing: 'files named in slides will show as missing' },
}

// glob syntax in a folder's name is literal: "talk (draft)", "[2024]"
const escapeGlob = (s) => s.replace(/[()[\]{}*?!+@|\\]/g, '\\$&')

export default function phoenyx(options = {}) {
  const { vue: vueOptions = {}, ...rest } = options
  const folders = {}
  for (const name of Object.keys(modules)) {
    const f = rest[name] ?? DEFAULTS[name]
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

  // Pug for the project's templates comes from this package: the project does not install it, and
  // it is found even where @vue/compiler-sfc cannot see this package's dependencies (a linked
  // install). Any other template language is required from the project.
  const template = vueOptions.template ?? {}
  const vueWithPug = {
    ...vueOptions,
    template: {
      ...template,
      preprocessCustomRequire: template.preprocessCustomRequire
        ?? ((id) => (id === 'pug' ? require('pug') : createRequire(resolve(root, 'package.json'))(id))),
    },
  }

  const plugin = {
    name: 'phoenyx',
    // for tools that run the project's Vite config (the export CLI): the folders, resolved
    api: { folders: () => Object.fromEntries(Object.keys(modules).map((n) => [n, dir(n)])) },
    config(user) {
      root = resolve(user.root ?? process.cwd()) // as Vite resolves it
      const config = {
        // one Vue, the project's, also for this package when it is linked (npm link, file:)
        resolve: { dedupe: ['vue'] },
        optimizeDeps: {
          // the engine imports the virtual modules below, which only this plugin resolves: it is
          // served as it is, not prebundled; what it imports from npm (vue, shiki) is prebundled
          exclude: [PACKAGE],
          include: ['vue', `${PACKAGE} > shiki`],
        },
      }
      const extra = outside()
      // Setting server.fs.allow replaces Vite's default (the workspace root): keep it, unless
      // the project set its own list, which Vite merges with this one.
      if (extra.length) config.server = { fs: { allow: [...(user.server?.fs?.allow ? [] : [searchForWorkspaceRoot(root)]), ...extra] } }
      return config
    },
    configResolved(config) {
      root = config.root
      if (config.plugins.filter((p) => p.name === 'vite:vue').length > 1)
        throw new Error('[phoenyx] @vitejs/plugin-vue is in the config twice: phoenyx() already includes it. Remove vue() from plugins; its options go in phoenyx({ vue: { … } })')
      for (const name of Object.keys(modules)) {
        if (rest[name] != null && !existsSync(dir(name)))
          config.logger.warn(`[phoenyx] the ${name} folder "${folders[name]}" does not exist (${dir(name)}): ${modules[name].missing}`)
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

  return [vue(vueWithPug), plugin]
}

export { phoenyx }
