// Vite plugin for Arao: everything a slides project needs in its vite.config.js.
//   import arao from 'araojs/vite'
//   export default defineConfig({ plugins: [arao()] })
// It brings @vitejs/plugin-vue along (with Pug for the templates), so the project adds neither;
// Vue's options go in arao({ vue: { … } }). Do not add vue() as well: the plugin would run twice.
//
// It exposes the project's folders as virtual modules, so slides name files and need no imports:
//   decks     /talk                       default src/decks      (each .vue file directly in it)
//   snippets  <Snippet file="App.java">   default src/snippets   (source text, loaded lazily)
//   images    <Img file="team.jpg">       default src/images     (URLs; subfolders allowed)
//   themes    Deck(:themes="['venue']")   default src/themes     (each .css file directly in it;
//                                                                 a list of folders and packages)
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
// Themes come only from their sources: arao({ themes }) is one source or a list of them, in order
// (default 'src/themes'):
//   a folder    a path, as the other folders ('src/themes', '../shared/themes', './themes': a
//               folder at the root needs the "./", else it reads as a package's name)
//   a package   a bare lowercase npm name ('arao-themes', '@acme/arao-themes'), installed:
//               its themes are the .css files of its themes/ folder, or of the folder its
//               package.json names ("arao": { "themes": "css" }). A package not installed, or
//               one that gives no theme, stops the build.
// Every .css file directly in a source's folder is loaded, after the engine's own CSS, with nothing
// to import (virtual:arao/theme-styles), source after source, and names the themes of its
// [data-theme="<name>"] selectors (one file may hold several; comments, :not(…) and names with
// white space do not count), and of the local partials it @import-s: virtual:arao/themes gives the
// engine those names, which a Deck without themes offers after 'default' (the engine's own tokens,
// no file), source after source. A file that names none is still loaded (shared rules, fonts) and
// Vite says so. Subfolders hold what the themes use (pictures, @import-ed partials), and are not
// loaded on their own. A name two sources give is offered once, where it comes first, and Vite
// warns: both files are loaded and both apply; at equal specificity the later source wins.
// Sources are taken by their real folder (symlinks resolved: a linked package is watched where its
// files are), and one named twice counts once.
// A theme no source gives (a CSS file the project imports itself) is not one: a deck that lists it
// is warned and does not wear it. Its folder or its package goes in arao({ themes }).
//
// Icons: <Icon name="lucide:rocket"> draws an icon of an installed Iconify set (@iconify-json/<prefix>),
// resolved here, at build time: the source is read for the names it uses and only those go into
// virtual:arao/icons (icons.js). arao({ icons: ['lucide:rocket'] }) adds names the source
// does not spell out (built at runtime).
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { normalizePath, searchForWorkspaceRoot } from 'vite'
import { createIcons, forced } from './icons.js'

const require = createRequire(import.meta.url)
// the package's own name, so that renaming it on publish needs no change here
const { name: PACKAGE } = require('../package.json')

/**
 * arao()'s options: the three content folders (paths from the Vite root, or absolute), the theme
 * sources (a folder or a package, or a list of them), icon names to include whatever the source
 * says, and the options of Vue's own plugin (plugin-vue).
 * @typedef {{ decks?: string, snippets?: string, images?: string, themes?: string | string[], icons?: string[], vue?: import('@vitejs/plugin-vue').Options }} AraoOptions
 * @typedef {'decks' | 'snippets' | 'images'} Folder
 * @typedef {{ spec: string, dir: string, pkg: string | null, label: string }} ThemeSource
 */

const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg']
/** @type {Record<Folder, string>} */
const DEFAULTS = { decks: 'src/decks', snippets: 'src/snippets', images: 'src/images' }
const DEFAULT_THEMES = 'src/themes'
// a source that is a package's name, not a path: a bare lowercase npm name, 'name' or
// '@scope/name' (npm's rules: lowercase letters, digits, - . _ ~); anything else, or a name
// written with './', is a folder
const PACKAGE_NAME = /^(?:@[a-z0-9~][a-z0-9._~-]*\/)?[a-z0-9~][a-z0-9._~-]*$/

// what each folder's glob takes, and how; and what a missing folder means
/** @type {Record<Folder, { pattern: string, options?: string, missing: string }>} */
const modules = {
  decks: { pattern: '*.vue', options: '{}', missing: 'createDeckApp() has no deck to open' },
  snippets: { pattern: '**/*', options: "{ query: '?raw', import: 'default' }", missing: 'files named in slides will show as missing' },
  images: { pattern: `**/*.{${IMAGES}}`, options: "{ query: '?url', import: 'default', eager: true, caseSensitive: false }", missing: 'files named in slides will show as missing' },
}
// the themes have their own two modules (load, below): the names, and the styles

// the files of a folder with an extension, by name without it: what import.meta.glob takes for
// '*<ext>' (files directly in it or symlinks to files, not dotfiles, case-sensitive)
/** @param {string} folder @param {string} ext @returns {string[]} */
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
/** @param {string} folder */
const decksIn = (folder) => filesIn(folder, '.vue')

// the themes a stylesheet names: its [data-theme="<name>"] selectors (quoted or not, any case
// flag), not [data-theme^="…"] and the like, nor one inside :not(…), nor what its comments say.
// A name is read as the browser reads it: CSS escapes resolved ("caf\e9" is café), nothing
// trimmed. A name with white space in it is no theme's (state/deck.js turns it down too): it goes
// to `spaced`, for a warning. What the sheet @import-s goes to `imports`, as written.
const THEME_SELECTOR = /\[\s*data-theme\s*=\s*(?:"((?:\\[\s\S]|[^"\\])*)"|'((?:\\[\s\S]|[^'\\])*)'|((?:\\[0-9a-f]{1,6}\s?|\\[\s\S]|[^\s"'\]\\])+))\s*(?:[is]\s*)?\]/gi
const IMPORT = /@import\s+(?:url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)|"([^"]*)"|'([^']*)')/gi
// CSS escapes, as CSS reads them: \<1-6 hex digits> with one white space after them (a code
// point), \<newline> (a string's line continuation: nothing), \<any other character> (itself)
/** @param {string} s */
const unescapeCss = (s) => s.replace(/\\(?:([0-9a-f]{1,6})(?:\r\n|[ \t\n\r\f])?|(\r\n|[\n\r\f])|([\s\S]))/gi, (/** @type {string} */ _, /** @type {string} */ hex, /** @type {string} */ nl, /** @type {string} */ ch) => {
  if (nl) return ''
  if (ch) return ch
  const cp = parseInt(hex, 16)
  return cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff) ? '�' : String.fromCodePoint(cp)
})
// the text without what each :not(…) holds (its parentheses nested; strings and escapes skipped)
/** @param {string} css */
function withoutNot(css) {
  let out = ''
  let from = 0
  for (const m of css.matchAll(/:not\(/gi)) {
    if (m.index < from) continue // inside a :not(…) already cut
    out += css.slice(from, m.index)
    let i = m.index + m[0].length
    for (let depth = 1, /** @type {string | null} */ quote = null; i < css.length && depth; i++) {
      const c = css[i]
      if (c === '\\') i++
      else if (quote) quote = c === quote ? null : quote
      else if (c === '"' || c === "'") quote = c
      else if (c === '(') depth++
      else if (c === ')') depth--
    }
    from = i
  }
  return out + css.slice(from)
}
/** @param {string} css */
function themesOf(css) {
  /** @type {Set<string>} */
  const names = new Set()
  /** @type {Set<string>} */
  const spaced = new Set()
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const m of withoutNot(text).matchAll(THEME_SELECTOR)) {
    const name = unescapeCss(m[1] ?? m[2] ?? m[3])
    if (/\s/.test(name)) spaced.add(name)
    else if (name) names.add(name)
  }
  const imports = [...text.matchAll(IMPORT)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5])
  return { names, spaced, imports }
}
// the local file an @import names, or null: a path relative to the sheet, or from the root
// ("/styles/x.css"). A URL, a package's file (what is not next to the sheet) or a missing file is
// not followed: the browser still loads it, but the themes it names are no theme (put its folder
// or package in arao({ themes }))
/** @param {string} path @param {string} from @param {string} root */
function importedFile(path, from, root) {
  const p = path.replace(/[?#].*$/, '')
  if (!p || /^[a-z][a-z\d+.-]*:/i.test(p) || p.startsWith('//')) return null
  const file = p.startsWith('/') ? join(root, p) : resolve(dirname(from), p)
  return statSync(file, { throwIfNoEntry: false })?.isFile() ? file : null
}
// a themes folder: every name its files give, sorted (the reader's alphabetical order, code-point
// order between names that differ only in case); the files that give none; the names skipped for
// their white space ({ file, name }); and every file read (the folder's and the local partials
// they @import, followed all the way down), for the dev server to follow
/** @param {string} a @param {string} b */
const byName = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }) || (a < b ? -1 : a > b ? 1 : 0)
/** @param {string} folder @param {string} root */
function themesIn(folder, root) {
  /** @type {Set<string>} */
  const names = new Set()
  /** @type {string[]} */
  const unnamed = []
  /** @type {{ file: string, name: string }[]} */
  const spaced = []
  /** @type {Set<string>} */
  const sources = new Set()
  for (const file of filesIn(folder, '.css').map((n) => `${n}.css`)) {
    /** @type {Set<string>} */
    const found = new Set()
    /** @type {Set<string>} */
    const seen = new Set()
    /** @param {string} path */
    const read = (path) => {
      if (seen.has(path)) return
      seen.add(path)
      sources.add(normalizePath(path))
      let sheet
      try {
        sheet = themesOf(readFileSync(path, 'utf8'))
      } catch {
        return
      }
      for (const n of sheet.names) found.add(n)
      for (const n of sheet.spaced) spaced.push({ file: path, name: n })
      for (const i of sheet.imports) {
        const partial = importedFile(i, path, root)
        if (partial) read(partial)
      }
    }
    read(join(folder, file))
    if (!found.size) unnamed.push(file)
    for (const n of found) names.add(n)
  }
  return { names: [...names].sort(byName), unnamed, spaced, sources }
}

// The theme sources arao({ themes }) names, resolved: each a folder ({ spec, dir, pkg: null }) or
// an installed package's themes folder ({ spec, dir, pkg: its name }), dir its real path (symlinks
// resolved), each real folder once; label is how messages name it. A package is looked up as Node
// does, in node_modules from the root up, else through Node's resolution (Yarn PnP); its folder is
// themes/, or what its package.json says ("arao": { "themes": "<folder>" }, inside the package).
// Throws on a package not installed, or whose folder is not one.
/** @param {string} p */
const real = (p) => {
  try {
    return realpathSync(p)
  } catch {
    return p // not there (yet): as written
  }
}
/** @param {string[]} specs @param {string} root @returns {ThemeSource[]} */
function resolveThemeSources(specs, root) {
  /** @type {Set<string>} */
  const seen = new Set()
  return specs.map((spec) => resolveThemeSource(spec, root)).filter((t) => !seen.has(t.dir) && seen.add(t.dir))
}
/** @param {string} spec @param {string} root @returns {ThemeSource} */
function resolveThemeSource(spec, root) {
  if (!PACKAGE_NAME.test(spec)) return { spec, dir: real(resolve(root, spec)), pkg: null, label: spec }
  let pkgDir = null
  for (let d = root; ; d = dirname(d)) {
    if (existsSync(join(d, 'node_modules', spec, 'package.json'))) { pkgDir = join(d, 'node_modules', spec); break }
    if (dirname(d) === d) break
  }
  if (!pkgDir) {
    try {
      pkgDir = dirname(createRequire(join(root, 'package.json')).resolve(`${spec}/package.json`))
    } catch {
      // not resolvable that way either (or its exports hide package.json)
    }
  }
  if (!pkgDir) {
    const folder = statSync(resolve(root, spec), { throwIfNoEntry: false })?.isDirectory()
    throw new Error(folder
      ? `[arao] themes: "${spec}" is read as a package's name, and no package "${spec}" is installed. There is a folder "${spec}" at the root: write "./${spec}" to use it`
      : `[arao] themes: no package "${spec}" installed (node_modules/${spec}). Install it, or, if you meant a folder at the root, write "./${spec}"`)
  }
  pkgDir = real(pkgDir)
  /** @type {{ arao?: { themes?: unknown } }} */
  let meta = {}
  try {
    meta = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
  } catch {
    // an unreadable package.json: the default folder
  }
  const named = meta.arao?.themes
  if (named != null && (typeof named !== 'string' || !named.trim()))
    throw new Error(`[arao] themes: package "${spec}" says "arao": { "themes": ${JSON.stringify(named)} } in its package.json: a folder's path is wanted`)
  const folder = typeof named === 'string' ? named.trim() : 'themes'
  const inside = relative(pkgDir, resolve(pkgDir, folder))
  if (isAbsolute(folder) || inside === '..' || inside.startsWith('..' + sep) || isAbsolute(inside))
    throw new Error(`[arao] themes: package "${spec}" names "${folder}" as its themes folder ("arao": { "themes" } in its package.json): it must be a folder inside the package`)
  const dir = real(resolve(pkgDir, folder))
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory())
    throw new Error(`[arao] themes: package "${spec}" has no ${folder}/ folder (${dir}): a theme package keeps its CSS in themes/, or names its folder in its package.json, "arao": { "themes": "<folder>" }`)
  return { spec, dir, pkg: spec, label: `${spec} (${folder}/)` }
}
// every source's themes, in order: their names, each once where it comes first (the names a later
// source gives again: dupes, { name, first, then }), and the files that name none, the names
// skipped and the files read, as themesIn gives them, the files by full path
/** @param {ThemeSource[]} sources @param {string} root */
function themesOfSources(sources, root) {
  /** @type {string[]} */
  const names = []
  /** @type {Map<string, string>} */
  const from = new Map()
  /** @type {{ name: string, first: string, then: string }[]} */
  const dupes = []
  /** @type {string[]} */
  const unnamed = []
  /** @type {{ file: string, name: string }[]} */
  const spaced = []
  /** @type {Set<string>} */
  const files = new Set()
  /** @type {Map<string, string[]>} */
  const perSource = new Map()
  for (const source of sources) {
    const got = themesIn(source.dir, root)
    perSource.set(source.spec, got.names)
    for (const n of got.names) {
      const first = from.get(n)
      if (first == null) {
        from.set(n, source.label)
        names.push(n)
      } else dupes.push({ name: n, first, then: source.label })
    }
    for (const file of got.unnamed) unnamed.push(join(source.dir, file))
    spaced.push(...got.spaced)
    for (const file of got.sources) files.add(file)
  }
  return { names, dupes, unnamed, spaced, sources: files, perSource }
}

// glob syntax in a folder's name is literal: "talk (draft)", "[2024]"
/** @param {string} s */
const escapeGlob = (s) => s.replace(/[()[\]{}*?!+@|\\]/g, '\\$&')

/**
 * @param {AraoOptions} [options]
 * @returns {import('vite').Plugin[]}
 */
export default function arao(options = {}) {
  const { vue: vueOptions = {}, icons: iconsOption, themes: themesOption, ...rest } = options
  const names = /** @type {Folder[]} */ (Object.keys(modules))
  /** @type {Record<Folder, string>} */
  const folders = { ...DEFAULTS }
  for (const name of names) {
    const f = rest[name] ?? DEFAULTS[name]
    if (typeof f !== 'string' || !f.trim()) throw new Error(`[arao] the ${name} folder must be a path, got ${JSON.stringify(f)}`)
    folders[name] = f.trim()
  }
  // the theme sources as written: one, or a list (a folder's path or a package's name each)
  const themeSpecs = (themesOption == null ? [DEFAULT_THEMES] : Array.isArray(themesOption) ? themesOption : [themesOption]).map((t) => {
    if (typeof t !== 'string' || !t.trim()) throw new Error(`[arao] themes: each source must be a folder's path or a package's name, got ${JSON.stringify(t)}`)
    return t.trim()
  })
  if (!themeSpecs.length) throw new Error('[arao] themes: the list is empty (leave it out for src/themes)')
  /** @type {ThemeSource[]} */
  let themeSources = [] // resolved once the root is known (configResolved)
  let root = process.cwd()
  let publicDir = ''
  let ssr = false
  /** @param {Folder} name */
  const dir = (name) => resolve(root, folders[name])
  /** @param {string} d */
  const isOutside = (d) => {
    const r = relative(root, d)
    return r === '..' || r.startsWith('..' + sep) || isAbsolute(r)
  }
  const outside = () => [...names.map(dir), ...themeSources.map((t) => t.dir)].filter(isOutside)
  /** @param {string} name */
  const resolved = (name) => `\0virtual:arao/${name}`
  /** @type {string[] | null} */
  let themeNames = null // the names the themes module was last loaded with
  let themeFiles = new Set() // the files they were read from (the sources' files, and their partials)
  /** @param {string} file */
  const unnamedTheme = (file) => logger.warn(`[arao] ${normalizePath(relative(root, file))} names no theme (no [data-theme="<name>"] selector): it is loaded, but no deck can wear it`)
  /** @param {{ name: string, first: string, then: string }} d */
  const dupeTheme = ({ name, first, then }) => logger.warn(`[arao] theme "${name}" is in ${first} and in ${then}: it is offered once; both apply, and at equal specificity ${then} (loaded later) wins`)
  /** @param {string} file */
  const inThemeFolder = (file) => file.endsWith('.css') && themeSources.some((t) => relative(t.dir, file) === basename(file))
  /** @param {{ file: string, name: string }} s */
  const spacedTheme = ({ file, name }) => logger.warn(`[arao] ${normalizePath(relative(root, file))}: [data-theme=${JSON.stringify(name)}] is no theme (a theme's name has no white space): skipped`)

  // icons used in the source: src/ and the decks folder, but not the snippets and images folders
  // (their files are content, not source)
  /** @type {Pick<import('vite').Logger, 'warn'>} */
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
        ?? ((/** @type {string} */ id) => (id === 'pug' ? require('pug') : createRequire(resolve(root, 'package.json'))(id))),
    },
  }

  /** @type {import('vite').Plugin & { api: { folders: () => Record<Folder, string>, decks: () => string[] } }} */
  const plugin = {
    name: 'arao',
    // for tools that run the project's Vite config (the export CLI): the folders, resolved
    api: {
      folders: () => /** @type {Record<Folder, string>} */ (Object.fromEntries(names.map((n) => [n, dir(n)]))),
      // the decks' names, sorted: what the decks glob below ('*.vue') takes
      decks: () => decksIn(dir('decks')),
    },
    config(user) {
      root = resolve(user.root ?? process.cwd()) // as Vite resolves it
      themeSources = resolveThemeSources(themeSpecs, root)
      /** @type {import('vite').UserConfig} */
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
      for (const name of names) {
        if (rest[name] != null && !existsSync(dir(name)))
          config.logger.warn(`[arao] the ${name} folder "${folders[name]}" does not exist (${dir(name)}): ${modules[name].missing}`)
      }
      themeSources = resolveThemeSources(themeSpecs, root)
      const given = themesOfSources(themeSources, root)
      for (const t of themeSources) {
        if (t.pkg) {
          if (!given.perSource.get(t.spec)?.length)
            throw new Error(`[arao] themes: package "${t.spec}" gives no theme: no .css file of ${t.dir} has a [data-theme="<name>"] selector`)
        } else if (themesOption != null && !existsSync(t.dir))
          config.logger.warn(`[arao] the theme source "${t.spec}" is no folder (${t.dir}): its themes are missing`)
      }
    },
    configureServer(server) {
      // the watcher covers the root; a folder outside it is added, so its new files show up live
      for (const d of outside()) server.watcher.add(d)
    },
    resolveId(id) {
      const name = id.startsWith('virtual:arao/') ? id.slice('virtual:arao/'.length) : ''
      return (name && name in modules) || name === 'icons' || name === 'themes' || name === 'theme-styles' ? resolved(name) : null
    },
    // a saved file that uses an icon the module lacks: the module goes first in the same update,
    // so its new data is in place when the file's own update renders the Icon
    async hotUpdate({ type, file, read, modules: changed }) {
      if (this.environment.name !== 'client') return
      // a theme file (or a partial one @import-s) added, removed or edited: if the names the
      // folder gives changed, the names module is loaded again (which reports the files that name
      // none and the names skipped) and the page reloads; else it is a plain CSS update (the styles
      // module's glob follows the files on its own, Vite's CSS the partials), and what that file
      // gets wrong is reported here
      const isTheme = inThemeFolder(file)
      if (isTheme || themeFiles.has(normalizePath(file))) {
        const { names, unnamed, spaced, sources } = themesOfSources(themeSources, root)
        themeFiles = sources
        const mod = this.environment.moduleGraph.getModuleById(resolved('themes'))
        if (mod && JSON.stringify(names) !== JSON.stringify(themeNames)) {
          this.environment.moduleGraph.invalidateModule(mod)
          this.environment.hot.send({ type: 'full-reload' })
          return []
        }
        if (type !== 'delete') {
          if (isTheme && unnamed.some((u) => normalizePath(u) === normalizePath(file))) unnamedTheme(file)
          for (const s of spaced) if (normalizePath(s.file) === normalizePath(file)) spacedTheme(s)
        }
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
        const { names, dupes, unnamed, spaced, sources } = themesOfSources(themeSources, root)
        for (const file of unnamed) unnamedTheme(file)
        for (const s of spaced) spacedTheme(s)
        for (const d of dupes) dupeTheme(d)
        themeNames = names
        themeFiles = sources
        return `export const themes = ${JSON.stringify(names)}
export const themeSources = ${JSON.stringify(themeSources.map((t) => t.label))}`
      }
      // the themes' CSS, each file imported for its styles alone, source after source (a folder
      // missing gives nothing): globs from the root ("/../x" leaves it)
      if (id === resolved('theme-styles')) {
        return themeSources.map((t) => {
          const rel = relative(root, t.dir).split(sep).join('/')
          return `import.meta.glob(${JSON.stringify((rel ? `/${escapeGlob(rel)}/` : '/') + '*.css')}, { eager: true })`
        }).join('\n')
      }
      const name = names.find((n) => id === resolved(n))
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

export { arao }
