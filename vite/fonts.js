// Web fonts for themes: a theme names a font family in a font token, and the build fetches it and
// serves it with the deck. Nothing to download, @font-face or link by hand.
//
//   [data-theme="venue"] { --ar-font-sans: "Inter", sans-serif; --ar-font-mono: "JetBrains Mono", monospace; }
//
// fontless (the engine of Nuxt Fonts, as a Vite plugin) reads the families of the CSS the project
// loads: font-family declarations, and the --ar-font-* tokens (--ar-font-sans, --ar-font-mono).
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
 * fonts: true or omitted (the defaults), false (off), or fontless's options over ours.
 * @typedef {boolean | Parameters<typeof fontless>[0]} FontsOption
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
  return fontless(withDefaults(option))
}

/**
 * Ours under the project's, key by key, one level down (a value the project gives replaces ours:
 * weights [300] means 300 only; providers and defaults merge by key; families add up).
 * @param {NonNullable<Parameters<typeof fontless>[0]>} option
 * @returns {NonNullable<Parameters<typeof fontless>[0]>}
 */
export function withDefaults(option) {
  const families = option.families ?? []
  const own = new Set(families.map((f) => f.name.toLowerCase()))
  return {
    processCSSVariables: 'ar-font',
    ...option,
    providers: { googleicons: /** @type {false} */ (false), adobe: /** @type {false} */ (false), ...option.providers },
    defaults: { weights: [400, 600, 700], ...option.defaults },
    families: [
      ...families,
      ...SYSTEM.filter((name) => !own.has(name.toLowerCase())).map((name) => /** @type {const} */ ({ name, provider: 'none' })),
    ],
  }
}
