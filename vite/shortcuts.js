// The project's shortcuts file, checked and built when Vite starts, handed to the engine as a
// virtual module (virtual:arao/shortcuts: the key map in effect, key → command).
// Optional: src/shortcuts.ts, else src/shortcuts.js (both present: the .ts, with a warning).
//   // src/shortcuts.ts
//   import { defineShortcuts } from 'araojs'
//   export default defineShortcuts({ MediaTrackNext: 'next', t: null })
// The file is loaded in Node through Vite's module runner (TypeScript included), with the package
// name standing for a stub that only has defineShortcuts: the file needs nothing else. Its map is
// checked with vite/shortcut-rules.js: a reserved key, a value that is no command or two spellings
// of one key stop `vite build`, `arao export` and the dev server's start, naming the file. Without
// a file the module holds the defaults. The dev server watches it: an edit (or creating or
// deleting it) is checked again and reloads the page; a broken edit shows Vite's error overlay
// and keeps the last good map.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { relative, resolve } from 'node:path'
import { runnerImport } from 'vite'
import { buildShortcuts } from './shortcut-rules.js'

const ID = 'virtual:arao/shortcuts'
const RESOLVED = `\0${ID}`
const FILES = ['src/shortcuts.ts', 'src/shortcuts.js']
const STUB = fileURLToPath(new URL('./shortcut-stub.js', import.meta.url))

/**
 * @param {string} packageName the library's own name, as the project's file imports it
 * @returns {import('vite').Plugin}
 */
export default function shortcuts(packageName) {
  let root = process.cwd()
  /** @type {import('vite').Logger | null} */
  let logger = null
  /** @type {Record<string, string>} */
  let map = buildShortcuts(undefined)

  const candidates = () => FILES.map((f) => resolve(root, f))

  // the map in effect: the defaults, with the project's file (if any) over them; throws on a mistake
  async function read() {
    const found = candidates().filter((f) => existsSync(f))
    if (found.length > 1) logger?.warn(`[arao] both ${FILES.join(' and ')} exist: ${FILES[0]} is used`)
    const f = found[0]
    if (!f) return buildShortcuts(undefined)
    const name = relative(root, f)
    let mod
    try {
      mod = await runnerImport(f, {
        configFile: false,
        root,
        logLevel: 'silent',
        resolve: { alias: [{ find: new RegExp(`^${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), replacement: STUB }] },
      })
    } catch (e) {
      throw new Error(`[arao] ${name} could not be loaded: ${/** @type {Error} */ (e).message}`)
    }
    return buildShortcuts(/** @type {{ default?: unknown }} */ (mod.module).default, name)
  }

  return {
    name: 'arao:shortcuts',
    configResolved(config) {
      root = config.root
      logger = config.logger
    },
    async buildStart() {
      map = await read()
    },
    resolveId(id) {
      if (id === ID) return RESOLVED
    },
    load(id) {
      if (id === RESOLVED) return `export const shortcuts = ${JSON.stringify(map)}`
    },
    configureServer(server) {
      const watched = new Set(candidates())
      for (const c of watched) server.watcher.add(c)
      const changed = async (/** @type {string} */ path) => {
        if (!watched.has(path)) return
        try {
          map = await read()
        } catch (e) {
          server.ws.send({ type: 'error', err: { message: /** @type {Error} */ (e).message, stack: '' } })
          return
        }
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', changed)
      server.watcher.on('unlink', changed)
      server.watcher.on('change', changed)
    },
  }
}
