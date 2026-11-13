// Web fonts for themes: a theme names a font family in a font token, and the build fetches it and
// serves it with the deck. Nothing to download, @font-face or link by hand.
//
//   [data-theme="venue"] { --ar-font-sans: "Inter", sans-serif; --ar-font-mono: "JetBrains Mono", monospace; }
//
// fontless (the engine of Nuxt Fonts, as a Vite plugin) reads the families of the CSS the project
// loads: font-family declarations, and the --ar-font-* tokens (--ar-font-sans, --ar-font-mono).
// For a family no stylesheet declares with @font-face and that is not a system font (Georgia,
// Arial, system-ui…), it asks the providers in turn (Google Fonts, Bunny, Fontshare, Fontsource;
// unifont), downloads its files into the build (assets/_fonts), adds the @font-face rules, and
// fallbacks with matched metrics (fontaine) so the text does not jump when the font arrives.
// The dev server serves the same files.
//
// Limits:
//   - Only families a provider has. Another font: an @font-face rule in a theme file, pointing at
//     its files (a family declared with @font-face is left alone).
//   - The first build needs the network; then the files are cached (node_modules/.cache/fontless)
//     and builds work offline. Without network and without a cache, the build still passes with a
//     warning, and the text falls back to the family's next fonts.
//   - --ar-ui-font (the controls and the presenter view) is not fetched: a system font, or one a
//     theme declares with @font-face.
//   - The licence is the font's: the providers above serve open fonts.
//
// Options: arao({ fonts: false }) turns it off; arao({ fonts: { … } }) passes fontless's own options
// (providers, priority, defaults: { weights, styles, subsets }, families, cache…), over ours.
import { fontless } from 'fontless'

/**
 * fonts: false, or fontless's options.
 * @typedef {false | Parameters<typeof fontless>[0]} FontsOption
 */

/**
 * The fonts plugin, or none.
 * @param {FontsOption} [option]
 * @returns {import('vite').Plugin[]}
 */
export function fonts(option = {}) {
  if (option === false) return []
  if (option === null || typeof option !== 'object' || Array.isArray(option)) {
    throw new Error(`[arao] fonts must be false or fontless's options (an object), got ${JSON.stringify(option)}`)
  }
  // the theme tokens that name families: --ar-font-sans, --ar-font-mono (and any --ar-font-*)
  return fontless({ processCSSVariables: 'ar-font', ...option })
}
