// The slides project a command runs in (its folder is the current directory), as its own Vite
// config sets it up: the arao() plugin's api (vite/index.js: its folders, its decks, its layouts),
// with the options the project gives it, resolved by the project's Vite (a peer dependency of this
// package) as its build resolves them. Every command that needs to know the project asks here.
// A config that cannot be loaded, or that has no arao() plugin, ends the command: its message says
// which, after the command's name.

/**
 * @typedef {{ folders: () => Record<string, string>, decks: () => string[],
 *   layouts: () => import('../vite/index.js').ProjectLayout[] }} AraoApi
 */

/**
 * The project's arao() plugin's api.
 * @param {string} command the command's name, for its messages
 * @param {string} root the project's folder
 * @returns {Promise<AraoApi>}
 */
export async function projectPlugin(command, root) {
  const { resolveConfig } = await import('vite')
  /** @type {AraoApi | undefined} */
  let api
  try {
    const config = await resolveConfig({ root, logLevel: 'error' }, 'build')
    api = /** @type {{ api?: AraoApi }} */ (config.plugins.find((p) => p.name === 'arao'))?.api
  } catch (e) {
    console.error(`${command}: cannot load the Vite config of ${root}: ${/** @type {Error} */ (e).message}`)
    process.exit(1)
  }
  if (!api) {
    console.error(`${command}: the Vite config of ${root} has no arao() plugin: is this a slides project?`)
    process.exit(1)
  }
  return api
}
