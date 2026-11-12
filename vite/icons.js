// Icons for <Icon name="prefix:name">: Iconify sets, resolved when Vite builds or serves the project,
// so a deck needs no network when it is presented and its icons are vectors in the PDF.
//
// Sets: a set is an installed @iconify-json/<prefix> package, looked up from the project first and
// then from this package's own dependencies (lucide and simple-icons ship with it). Any other set
// works once the project installs it: npm install -D @iconify-json/<prefix>.
//
// Which icons: the project's source (src/ and the decks folder, minus the snippets and images
// folders; .vue .js .ts .jsx .tsx .mjs .cjs .pug files) is read for words of the form
// prefix:name whose prefix is an installed set and whose name is an icon of it. That finds
// name="lucide:rocket" and names in data arrays ({ icon: 'lucide:rocket' }) alike; words that
// look like one but are not (localhost:5173, a:hover) are dropped. Only the icons found go into
// virtual:phoenyx/icons, as "prefix:name" → { body, width, height } (viewBox 0 0 width height).
// A name the source does not spell out (built at runtime: `lucide:${kind}`) is not found: list it
// in the plugin option, phoenyx({ icons: ['lucide:rocket'] }).
//
// During development, a saved file that brings a name not yet in the module updates the module
// (no restart), in the same hot update as the file itself, so the slide never renders the new
// Icon before its data has arrived. Names that are no longer used stay until the next start.
import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isAbsolute, join, relative } from 'node:path'
import { getIconData } from '@iconify/utils/lib/icon-set/get-icon'
import { defaultIconProps } from '@iconify/utils/lib/icon/defaults'
import { iconToSVG } from '@iconify/utils/lib/svg/build'

const require = createRequire(import.meta.url)

const SOURCE = /\.(vue|pug|[cm]?[jt]s|[jt]sx)$/
// an Iconify name: prefix and name are lowercase words of letters and digits joined by "-",
// not glued to a longer word, a path or a URL on either side
const WORD = '[a-z\\d]+(?:-[a-z\\d]+)*'
const NAME = new RegExp(`(?<![\\w.:/@-])(${WORD}):(${WORD})(?![\\w:/-])`, 'g')

// names(code): every prefix:name word in a source file
export const names = (code) => new Set(Array.from(code.matchAll(NAME), (m) => `${m[1]}:${m[2]}`))

// root(): the Vite root; sources(): folders to read; skip(): folders inside them not to read;
// force: names to include whatever the source says; warn: the logger's warn
export function createIcons({ root, sources, skip, force = [], warn }) {
  const sets = new Map() // prefix → its icons.json, once read
  const data = new Map() // name → { body, width, height }, once built
  const seen = new Map() // source file → the names in it
  let shipped = null // the names in the module the dev server last served
  const warned = new Set()

  // an installed set, or null. Misses are not remembered: a set installed while the dev server
  // runs is found at the next save.
  function set(prefix) {
    if (sets.has(prefix)) return sets.get(prefix)
    for (const from of [createRequire(join(root(), 'package.json')), require]) {
      let path
      try { path = from.resolve(`@iconify-json/${prefix}/icons.json`) } catch { continue }
      const json = JSON.parse(readFileSync(path, 'utf8'))
      sets.set(prefix, json)
      return json
    }
    return null
  }

  function icon(name) {
    if (data.has(name)) return data.get(name)
    const [prefix, id] = name.split(':')
    const found = set(prefix) && getIconData(sets.get(prefix), id) // aliases resolved
    if (!found) return null
    // iconToSVG applies an alias's rotation or flip; a viewBox that does not start at 0 0 is
    // moved there, so the component only needs the size
    const { viewBox: [x, y, width, height], body } = iconToSVG({ ...defaultIconProps, ...found })
    const out = { body: x || y ? `<g transform="translate(${-x} ${-y})">${body}</g>` : body, width, height }
    data.set(name, out)
    return out
  }

  const inside = (dir, file) => {
    const r = relative(dir, file)
    return r === '' || (!r.startsWith('..') && !isAbsolute(r))
  }
  const readable = (file) => SOURCE.test(file) && !file.split(/[\\/]/).includes('node_modules')
    && sources().some((d) => inside(d, file)) && !skip().some((d) => inside(d, file))

  function walk(dir, out) {
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
    for (const e of entries) {
      const path = join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name !== 'node_modules' && !e.name.startsWith('.') && !skip().some((d) => inside(d, path))) walk(path, out)
      } else if (e.isFile() && SOURCE.test(e.name)) out.add(path)
    }
    return out
  }

  return {
    // the module's code, from the whole source the first time, then from what the saves told
    load() {
      if (!shipped) {
        const files = new Set()
        for (const d of sources()) walk(d, files)
        for (const f of files) seen.set(f, names(readFileSync(f, 'utf8')))
      }
      const icons = {}
      for (const name of [...new Set([...force, ...[...seen.values()].flatMap((s) => [...s])])].sort()) {
        const found = icon(name)
        if (found) icons[name] = found
        else if (force.includes(name) && !warned.has(name)) {
          warned.add(name)
          warn(`[phoenyx] icons: "${name}" is in no installed icon set (npm install -D @iconify-json/${name.split(':')[0]}, or check the name)`)
        }
      }
      shipped = new Set(Object.keys(icons))
      return `// prefix:name → { body, width, height }; no prototype: a name is looked up, never inherited
export const icons = Object.assign(Object.create(null), ${JSON.stringify(icons)})`
    },
    // a file was created, saved or deleted: true when the module must be served again
    async update(type, file, read) {
      if (!shipped || !readable(file)) return false
      if (type === 'delete') {
        seen.delete(file)
        return false
      }
      const found = names(await read())
      seen.set(file, found)
      return [...found].some((n) => !shipped.has(n) && icon(n))
    },
  }
}

// the plugin's icons option: an array of "prefix:name"
export function forced(value) {
  if (value == null) return []
  const bad = !Array.isArray(value) ? value : value.find((n) => typeof n !== 'string' || !new RegExp(`^${WORD}:${WORD}$`).test(n.trim()))
  if (bad !== undefined) throw new Error(`[phoenyx] icons must be a list of "prefix:name" (as "lucide:rocket"), got ${JSON.stringify(bad)}`)
  return value.map((n) => n.trim())
}
