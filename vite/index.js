// Vite plugin for Arao: everything a slides project needs in its vite.config.js.
//   import arao from 'araojs/vite'
//   export default defineConfig({ plugins: [arao()] })
// It brings @vitejs/plugin-vue along (with Pug for the templates), so the project adds neither;
// Vue's options go in arao({ vue: { … } }). Do not add vue() as well: the plugin would run twice.
//
// It exposes four project folders as virtual modules, so slides name files and need no imports:
//   decks     /talk                       default src/decks      (each .vue file directly in it)
//   snippets  <Snippet file="App.java">   default src/snippets   (source text, loaded lazily)
//   images    <Img file="team.jpg">       default src/images     (URLs; subfolders allowed)
//   themes    Deck(:themes="['venue']")   default src/themes     (each .css file directly in it)
//   arao({ decks: 'src/decks', snippets: 'src/snippets', images: 'src/images', themes: 'src/themes' })
// A folder is a path relative to the Vite root, or an absolute path. One outside the root
// ("../shared/images") works the same: the dev server is allowed to serve it (server.fs.allow)
// and watches it. A folder that was set but does not exist is reported when Vite starts.
//
// Decks: one lazily loaded chunk each; createDeckApp() picks one from the URL's path, /<file name>
// (after the base). The export CLI (arao export) asks this plugin for them (api.decks()), so both
// see the same decks.
// A deck's path is the app's page at another URL: the dev server and vite preview answer it with
// index.html (Vite's SPA fallback). A static host answers it with 404.html where it has nothing
// else (GitHub Pages, and most hosts can be told to): the build writes index.html again as
// 404.html, next to it, unless the project's public folder has a 404.html of its own.
//
// Images: only pictures are taken (png, jpg, jpeg, gif, webp, avif, svg, in any case); anything
// else in the folder (notes, sources, .psd) stays out of the build. Names are case-sensitive,
// as on most servers: file="Team.jpg" is not team.jpg.
// Their URLs are eager: a slide renders its pictures at once, with no async hop, so a slide
// never shows an empty box first. The cost: every slide is in the page from the start, so the
// browser fetches every picture the deck uses when it opens. Size photos for the screen: text and
// SVG stay sharp at any scale, but a photo is upscaled with the canvas, so for 4K a full-slide
// background wants ~3840 px wide (twice its size in canvas px); prefer WebP/AVIF/JPEG for photos.
//
// Themes: every .css file directly in the folder is loaded, after the engine's own CSS, with nothing
// to import (virtual:arao/theme-styles), and names the themes of its [data-theme="<name>"]
// selectors (one file may hold several; comments do not count): virtual:arao/themes gives the
// engine those names, which a Deck without themes offers after 'default' (the engine's own tokens,
// no file). A file that names none is still loaded (shared rules, fonts) and Vite says so.
// Subfolders hold what the themes use (pictures, @import-ed partials), and are not loaded.
//
// Icons: <Icon name="lucide:rocket"> draws an icon of an installed Iconify set (@iconify-json/<prefix>),
// resolved here, at build time: the source is read for the names it uses and only those go into
// virtual:arao/icons (icons.js). arao({ icons: ['lucide:rocket'] }) adds names the source
// does not spell out (built at runtime).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { searchForWorkspaceRoot } from 'vite'
import { createIcons, forced } from './icons.js'

const require = createRequire(import.meta.url)
// the package's own name, so that renaming it on publish needs no change here
const { name: PACKAGE } = require('../package.json')

const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg']
const DEFAULTS = { decks: 'src/decks', snippets: 'src/snippets', images: 'src/images', themes: 'src/themes' }

// what each folder's glob takes, and how; and what a missing folder means
const modules = {
  decks: { pattern: '*.vue', options: '{}', missing: 'createDeckApp() has no deck to open' },
  snippets: { pattern: '**/*', options: "{ query: '?raw', import: 'default' }", missing: 'files named in slides will show as missing' },
  images: { pattern: `**/*.{${IMAGES}}`, options: "{ query: '?url', import: 'default', eager: true, caseSensitive: false }", missing: 'files named in slides will show as missing' },
  // its own two modules (load, below): the names, and the styles
  themes: { pattern: '*.css', missing: "decks can only wear 'default'" },
}

// the files of a folder with an extension, by name without it: what import.meta.glob takes for
// '*<ext>' (files directly in it or symlinks to files, not dotfiles, case-sensitive)
function filesIn(folder, ext) {
  let entries
  try {
    entries = readdirSync(folder, { withFileTypes: true })
  } catch {
    return []
  }
  return entries
    .filter((e) => !e.name.startsWith('.') && e.name.endsWith(ext)
      && (e.isFile() || (e.isSymbolicLink() && statSync(join(folder, e.name), { throwIfNoEntry: false })?.isFile())))
    .map((e) => e.name.slice(0, -ext.length))
    .sort()
}
const decksIn = (folder) => filesIn(folder, '.vue')

// the themes a stylesheet names: its [data-theme="<name>"] selectors (quoted or not, any case
// flag), not [data-theme^="…"] and the like, nor what its comments say
const THEME_SELECTOR = /\[\s*data-theme\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'\]]+))\s*(?:[is]\s*)?\]/gi
function themesOf(css) {
  const names = new Set()
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(THEME_SELECTOR)) {
    const name = (m[1] ?? m[2] ?? m[3]).trim()
    if (name) names.add(name)
  }
  return names
}
// the themes folder: every name its files give, sorted (the reader's alphabetical order, code-point
// order between names that differ only in case), and the files that give none
const byName = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }) || (a < b ? -1 : a > b ? 1 : 0)
function themesIn(folder) {
  const names = new Set()
  const unnamed = []
  for (const file of filesIn(folder, '.css').map((n) => `${n}.css`)) {
    let found
    try {
      found = themesOf(readFileSync(join(folder, file), 'utf8'))
    } catch {
      continue
    }
    if (!found.size) unnamed.push(file)
    for (const n of found) names.add(n)
  }
  return { names: [...names].sort(byName), unnamed }
}

// glob syntax in a folder's name is literal: "talk (draft)", "[2024]"
const escapeGlob = (s) => s.replace(/[()[\]{}*?!+@|\\]/g, '\\$&')

export default function arao(options = {}) {
  const { vue: vueOptions = {}, icons: iconsOption, ...rest } = options
  const folders = {}
  for (const name of Object.keys(modules)) {
    const f = rest[name] ?? DEFAULTS[name]
    if (typeof f !== 'string' || !f.trim()) throw new Error(`[arao] the ${name} folder must be a path, got ${JSON.stringify(f)}`)
    folders[name] = f.trim()
  }
  let root = process.cwd()
  let publicDir = ''
  let ssr = false
  const dir = (name) => resolve(root, folders[name])
  const isOutside = (d) => {
    const r = relative(root, d)
    return r === '..' || r.startsWith('..' + sep) || isAbsolute(r)
  }
  const outside = () => Object.keys(modules).map(dir).filter(isOutside)
  const resolved = (name) => `\0virtual:arao/${name}`
  let themeNames = null // the names the themes module was last loaded with
  const unnamedTheme = (file) => logger.warn(`[arao] ${folders.themes}/${file} names no theme (no [data-theme="<name>"] selector): it is loaded, but no deck can wear it`)

  // icons used in the source: src/ and the decks folder, but not the snippets and images folders
  // (their files are content, not source)
  let logger = console
  const icons = createIcons({
    root: () => root,
    sources: () => [resolve(root, 'src'), dir('decks')],
    skip: () => [dir('snippets'), dir('images')],
    force: forced(iconsOption),
    warn: (msg) => logger.warn(msg),
  })

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
    name: 'arao',
    // for tools that run the project's Vite config (the export CLI): the folders, resolved
    api: {
      folders: () => Object.fromEntries(Object.keys(modules).map((n) => [n, dir(n)])),
      // the decks' names, sorted: what the decks glob below ('*.vue') takes
      decks: () => decksIn(dir('decks')),
    },
    config(user) {
      root = resolve(user.root ?? process.cwd()) // as Vite resolves it
      const config = {
        // one Vue, the project's, also for this package when it is linked (npm link, file:)
        resolve: { dedupe: ['vue'] },
        optimizeDeps: {
          // the engine imports the virtual modules below, which only this plugin resolves: it is
          // served as it is, not prebundled; what it imports from npm (vue, shiki, @vueuse/core)
          // is prebundled
          exclude: [PACKAGE],
          include: ['vue', `${PACKAGE} > shiki`, `${PACKAGE} > @vueuse/core`],
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
      logger = config.logger
      publicDir = config.publicDir
      ssr = !!config.build.ssr
      if (config.plugins.filter((p) => p.name === 'vite:vue').length > 1)
        throw new Error('[arao] @vitejs/plugin-vue is in the config twice: arao() already includes it. Remove vue() from plugins; its options go in arao({ vue: { … } })')
      for (const name of Object.keys(modules)) {
        if (rest[name] != null && !existsSync(dir(name)))
          config.logger.warn(`[arao] the ${name} folder "${folders[name]}" does not exist (${dir(name)}): ${modules[name].missing}`)
      }
    },
    configureServer(server) {
      // the watcher covers the root; a folder outside it is added, so its new files show up live
      for (const d of outside()) server.watcher.add(d)
    },
    resolveId(id) {
      const name = id.startsWith('virtual:arao/') && id.slice('virtual:arao/'.length)
      return name in modules || name === 'icons' || name === 'theme-styles' ? resolved(name) : null
    },
    // a saved file that uses an icon the module lacks: the module goes first in the same update,
    // so its new data is in place when the file's own update renders the Icon
    async hotUpdate({ type, file, read, modules: changed }) {
      if (this.environment.name !== 'client') return
      // a theme file added, removed or edited: if the names the folder gives changed, the names
      // module is loaded again (which reports the files that name none) and the page reloads; else
      // it is a plain CSS update (the styles module's glob follows the files on its own), and a
      // file that names no theme is reported here
      if (file.endsWith('.css') && relative(dir('themes'), file) === basename(file)) {
        const { names, unnamed } = themesIn(dir('themes'))
        const mod = this.environment.moduleGraph.getModuleById(resolved('themes'))
        if (mod && JSON.stringify(names) !== JSON.stringify(themeNames)) {
          this.environment.moduleGraph.invalidateModule(mod)
          this.environment.hot.send({ type: 'full-reload' })
          return []
        }
        if (type !== 'delete' && unnamed.includes(basename(file))) unnamedTheme(basename(file))
      }
      if (!(await icons.update(type, file, read))) return
      const mod = this.environment.moduleGraph.getModuleById(resolved('icons'))
      return mod ? [mod, ...changed.filter((m) => m !== mod)] : undefined
    },
    // the build: index.html again as 404.html (see the top), once Vite has put the page in the bundle
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        if (ssr || (this.environment && this.environment.name !== 'client')) return
        const page = bundle['index.html']
        if (page?.type !== 'asset' || bundle['404.html'] || (publicDir && existsSync(join(publicDir, '404.html')))) return
        this.emitFile({ type: 'asset', fileName: '404.html', source: page.source })
      },
    },
    load(id) {
      if (id === resolved('icons')) return icons.load()
      if (id === resolved('themes')) {
        const { names, unnamed } = themesIn(dir('themes'))
        for (const file of unnamed) unnamedTheme(file)
        themeNames = names
        return `export const themes = ${JSON.stringify(names)}
export const themesDir = ${JSON.stringify(folders.themes)}`
      }
      const styles = id === resolved('theme-styles')
      const name = styles ? 'themes' : Object.keys(modules).find((n) => id === resolved(n))
      if (!name) return null
      // globs starting with "/" are relative to the root ("/../shared" leaves it); Vite keys
      // each file by its path from the root, so the folder's part is cut off the keys
      const rel = relative(root, dir(name)).split(sep).join('/')
      const prefix = rel ? `/${rel}/` : '/'
      const glob = (rel ? `/${escapeGlob(rel)}/` : '/') + modules[name].pattern
      // the themes' CSS, each file imported for its styles alone
      if (styles) return `import.meta.glob(${JSON.stringify(glob)}, { eager: true })`
      return `const files = import.meta.glob(${JSON.stringify(glob)}, ${modules[name].options})
const prefix = ${JSON.stringify(prefix)}
// no prototype: a file named "constructor" or "toString" is looked up, not an Object method
export const ${name} = Object.assign(Object.create(null), Object.fromEntries(Object.entries(files).map(([k, v]) => [k.slice(prefix.length), v])))
export const ${name}Dir = ${JSON.stringify(folders[name])}`
    },
  }

  return [vue(vueWithPug), plugin]
}

export { arao }
