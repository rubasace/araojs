// Web fonts for themes: a theme names a font family in a font token, and the build fetches it and
// serves it with the deck. Nothing to download, @font-face or link by hand.
//
//   [data-theme="venue"] { --ar-font-sans: "Inter", sans-serif; --ar-font-mono: "JetBrains Mono", monospace; }
//
// fontless (the engine of Nuxt Fonts, as a Vite plugin) reads the families of the CSS the project
// loads: font-family declarations, and the --ar-font-* tokens (--ar-font-sans, --ar-font-mono,
// --ar-font-heading).
// For a family no stylesheet declares with @font-face and that is not a system font, it asks the
// providers in turn (Google Fonts, Bunny Fonts, Fontshare, Fontsource; through unifont), puts its
// files in the build (assets/_fonts), adds the @font-face rules, and fallbacks with matched
// metrics (fontaine) so the text does not jump when the font arrives. The dev server serves the
// same files.
//
// Our defaults, over fontless's (each one replaced by the project's own value for that key):
//   - weights 400, 600 and 700, each upright and italic (fontless takes 400 only: bold text
//     would be faked by the browser)
//   - providers: google, bunny, fontshare, fontsource, npm (fontless's googleicons and adobe off:
//     icons come from Iconify, and Adobe needs a kit id)
//   - the --ar-font-* tokens read for families (processCSSVariables: 'ar-font')
//   - SYSTEM below never fetched (provider 'none'), on top of fontless's own list (Georgia,
//     Helvetica, Times New Roman, Segoe UI, Menlo…): fonts the operating systems ship, which no
//     provider serves under that name. A family the project configures itself is left to it.
// See docs/guide/themes.md#fonts for the limits (network, cache, Node, privacy).
import { fontless } from 'fontless'

// families the systems ship that fontless does not know as system fonts
const SYSTEM = [
  'Arial', 'Arial Black', 'Arial Narrow', 'Avenir', 'Avenir Next', 'Baskerville', 'Book Antiqua',
  'Calibri', 'Cambria Math', 'Candara', 'Comic Sans MS', 'Constantia', 'Corbel', 'DejaVu Sans',
  'DejaVu Sans Mono', 'DejaVu Serif', 'Didot', 'Franklin Gothic Medium', 'Futura', 'Garamond',
  'Geneva', 'Gill Sans', 'Hoefler Text', 'Impact', 'Lucida Sans', 'Lucida Sans Unicode', 'Optima',
  'Palatino', 'Palatino Linotype', 'SF Pro', 'SF Pro Display', 'SF Pro Text', 'Trebuchet MS',
]

/**
 * fonts: true or omitted (the defaults), false (off), or fontless's options over ours. Declared
 * here, not imported from fontless: the published types stay free of fontless's own dependencies
 * (a project type-checks without them). The common keys are named; any other of fontless's
 * options passes through as it is.
 * @typedef {{
 *   defaults?: { weights?: (number | string)[], styles?: ('normal' | 'italic' | 'oblique')[], subsets?: string[], fallbacks?: Record<string, string[]>, preload?: unknown },
 *   providers?: Record<string, false | string | ((options: any) => unknown)>,
 *   priority?: string[],
 *   families?: { name: string, provider?: string, global?: boolean, weights?: (number | string)[], styles?: string[], subsets?: string[], [key: string]: unknown }[],
 *   throwOnError?: boolean,
 *   processCSSVariables?: boolean | string,
 *   [key: string]: unknown,
 * }} FontsOptions
 * @typedef {boolean | FontsOptions} FontsOption
 */

/**
 * The fonts plugin, or none.
 * @param {FontsOption} [option]
 * @returns {import('vite').Plugin[]}
 */
export function fonts(option = true) {
  if (option === false) return []
  if (option === true) option = {}
  if (option === null || typeof option !== 'object' || Array.isArray(option)) {
    throw new Error(`[arao] fonts must be true, false or fontless's options (an object), got ${JSON.stringify(option)}`)
  }
  const options = withDefaults(option)
  const plugins = fontless(/** @type {Parameters<typeof fontless>[0]} */ (options))
  return option.throwOnError ? plugins : plugins.map(forgiving)
}

const HOOKS = ['buildStart', 'configResolved', 'configureServer', 'transform', 'transformIndexHtml', 'load', 'renderChunk', 'generateBundle', 'writeBundle', 'closeBundle']

/**
 * A fontless plugin whose hooks cannot fail the build: a font that cannot be fetched (no network,
 * a provider timing out: ETIMEDOUT) is a warning, and the deck ships with the fallback fonts of its
 * stack. With throwOnError the plugin is used as it is, so the failure stops the build.
 * @param {import('vite').Plugin} plugin
 * @returns {import('vite').Plugin}
 */
function forgiving(plugin) {
  /** @type {Record<string, unknown>} */
  const out = { ...plugin }
  for (const name of HOOKS) {
    const hook = /** @type {Record<string, any>} */ (plugin)[name]
    if (!hook) continue
    const fn = typeof hook === 'function' ? hook : hook.handler
    if (typeof fn !== 'function') continue
    /** @this {any} @param {...any} args */
    const safe = async function (...args) {
      try {
        return await fn.apply(this, args)
      } catch (e) {
        const message = `[arao] fonts: ${e instanceof Error ? e.message : String(e)}. The deck uses its fallback fonts (set fonts: { throwOnError: true } to fail instead)`
        if (this && typeof this.warn === 'function') this.warn(message)
        else console.warn(message)
        return undefined
      }
    }
    out[name] = typeof hook === 'function' ? safe : { ...hook, handler: safe }
  }
  return /** @type {import('vite').Plugin} */ (/** @type {unknown} */ (out))
}

/**
 * Ours under the project's, key by key, one level down (a value the project gives replaces ours:
 * weights [300] means 300 only; providers and defaults merge by key; families add up).
 * @param {FontsOptions} option
 * @returns {FontsOptions}
 */
function withDefaults(option) {
  const families = option.families ?? []
  const own = new Set(families.map((f) => f.name.toLowerCase()))
  return {
    processCSSVariables: 'ar-font',
    ...option,
    providers: { googleicons: false, adobe: false, ...option.providers },
    defaults: { weights: [400, 600, 700], ...option.defaults },
    families: [
      ...families,
      ...SYSTEM.filter((name) => !own.has(name.toLowerCase())).map((name) => /** @type {const} */ ({ name, provider: 'none' })),
    ],
  }
}
