// The project's shortcuts file, as a virtual module (virtual:arao/shortcuts), for the engine's
// key map (src/core/shortcuts.ts). Optional: src/shortcuts.ts or src/shortcuts.js (the first that
// exists, .ts first), or the file arao({ shortcuts: 'path/without-or-with-extension' }) names.
//   // src/shortcuts.ts
//   import { defineShortcuts } from 'araojs'
//   export default defineShortcuts({ MediaTrackNext: 'next', t: null })
// Without one the module exports {} and the deck keeps its default keys. The dev server watches
// the file: creating, editing or deleting it reloads the page with the new keys.
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ID = 'virtual:arao/shortcuts'
const RESOLVED = `\0${ID}`
const EXTENSIONS = ['.ts', '.js', '.mts', '.mjs']

/**
 * @param {string | undefined} option the file arao({ shortcuts }) names, if any
 * @returns {import('vite').Plugin}
 */
export default function shortcuts(option) {
  if (option != null && (typeof option !== 'string' || !option.trim())) {
    throw new Error(`[arao] the shortcuts file must be a path, got ${JSON.stringify(option)}`)
  }
  const base = (option ?? 'src/shortcuts').trim()
  let root = process.cwd()
  // the candidates: the path as written if it has an extension, else the path with each extension
  const candidates = () => {
    const p = resolve(root, base)
    return EXTENSIONS.some((e) => p.endsWith(e)) ? [p] : EXTENSIONS.map((e) => p + e)
  }
  const file = () => candidates().find((f) => existsSync(f)) ?? null

  return {
    name: 'arao:shortcuts',
    configResolved(config) {
      root = config.root
      if (option != null && !file()) {
        config.logger.warn(`[arao] shortcuts: ${base} not found (tried ${candidates().map((c) => c.slice(root.length + 1)).join(', ')}): the deck keeps its default keys`)
      }
    },
    resolveId(id) {
      if (id === ID) return RESOLVED
    },
    load(id) {
      if (id !== RESOLVED) return
      const f = file()
      return f
        ? `export { default as shortcuts } from ${JSON.stringify(f)}`
        : 'export const shortcuts = {}'
    },
    configureServer(server) {
      const watched = new Set(candidates())
      for (const c of watched) server.watcher.add(c)
      const changed = (/** @type {string} */ path) => {
        if (!watched.has(path)) return
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
