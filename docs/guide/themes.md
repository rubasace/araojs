# Themes

Every token the engine reads has a default ([Theme tokens](../reference/theme-tokens.md), declared in
`styles/tokens.css`), and the defaults are the `default` theme: a light page, Georgia, a blue
accent, a light code window. It has no file; `default` is always a valid theme name.

A project theme declares only what it changes. This one is the examples' (`docs/examples/themes/`;
in a slides project, `src/themes/ocean.css`), with a deck that wears it:

<!-- example:themes/ocean.css -->

```css
/* docs/examples/themes/ocean.css: a theme declares only the tokens it changes */
[data-theme="ocean"] {
  --ar-bg: #1b2a3a;
  --ar-fg: #edf1f4;
  --ar-muted: #9aabbb;
  --ar-accent: #6aaee8;
  --ar-accent-fg: #1b2a3a;
  --ar-letterbox: #111c27;
  --ar-font-sans: "Inter", system-ui, sans-serif;
  --ar-title-align: center;
  --ar-footer-color: var(--ar-accent);
}
```

<!-- /example -->

<!-- example:theme -->

```vue
<template lang="pug">
Deck(:themes="['ocean', 'sage', 'midnight', 'default']")
  template(#footer="{ number, total }")
    span ACME · DevConf 2026
    span {{ number }} / {{ total }}

  Slide
    h2 Same slides, another venue
    Cols(gap="lg")
      div
        h3 #[Icon(name="lucide:palette")] Colours
        p.muted Background, text, accent
      div
        h3 #[Icon(name="lucide:type")] Type
        p.muted Fonts and their sizes
      div
        h3 #[Icon(name="lucide:panel-bottom")] Zones
        p.muted Title, body, footer
</template>

<style scoped>
h3 .ar-icon { color: var(--ar-accent); }
</style>
```

<!-- /example -->

![The theme example: the same components in the ocean theme](../assets/shots/theme.png)

Every token, with its default: [Theme tokens](../reference/theme-tokens.md).

## Where themes are found

A theme is a CSS rule `[data-theme="<name>"] { --ar-…: …; }` in a CSS file of a **theme source**:
the project's themes folder (`src/themes`), or any folder or package named in the
[plugin](../reference/vite-plugin.md)'s `themes` option. It declares only the tokens it changes,
over the defaults. The plugin loads every CSS file directly in each source's folder, after the
engine's CSS, with nothing to import, and names the themes by their selectors:

- a theme's name is the one in `[data-theme="<name>"]` (quoted or not), not the file's: one file
  may hold several themes (`[data-theme="venue"]` and `[data-theme="venue-dark"]`), and rules for
  several at once (`[data-theme^="venue"] { … }`, which names none by itself); comments do not
  count;
- a file that names no theme is still loaded (shared rules, `@font-face`) and Vite warns about
  it;
- a selector inside `:not(…)` names no theme; a name is read as the browser reads it (CSS escapes
  resolved, nothing trimmed), and one with white space in it is no theme's (Vite warns and it is
  skipped);
- subfolders hold what the themes use (pictures, `@import`-ed partials) and are not loaded on
  their own. The plugin follows a file's `@import` of a local partial (a path relative to the file,
  or from the project's root, `/styles/x.css`), all the way down, and its selectors name themes
  too; an `@import` of a package or a URL is not followed;
- a file added, removed or renamed while `npm run dev` runs is picked up, and so is an edit of a
  partial it imports (the page reloads when the theme names change).

**Where a theme can come from.** Only from the theme sources, `arao({ themes })` in
`vite.config.js`: one, or a list, in order (default `'src/themes'`):

```js
// vite.config.js
import arao from 'araojs/vite'
export default defineConfig({
  plugins: [arao({ themes: ['src/themes', 'src/styles/venues', 'arao-themes'] })],
})
```

- **a folder**: a path from the project's root, or absolute (`'src/themes'`, `'../shared/themes'`).
  The rule: a bare lowercase name (`'themes'`, `'@acme/x'`) is a package; anything else is a folder,
  so a folder right at the root is written `'./themes'`.
- **a package**: an npm name (`'arao-themes'`, `'@acme/arao-themes'`), installed in the project
  (`npm i -D arao-themes`). A theme package publishes plain CSS files, no build step needed
  (minified is fine), in a `themes/` folder at its root; one that keeps them elsewhere says so in
  its `package.json`: `"arao": { "themes": "dist" }` (a folder inside the package). A linked
  package (`file:`, `npm link`, a workspace) works the same, watched where its files really are.
  A package that is not installed, or whose folder gives no theme, stops the build with an
  `[arao]` error.

Every theme the sources give is offered, after `default`, source after source (alphabetical in
each). A name two sources give is offered once, where it comes first, and Vite warns: both files
are loaded, source after source, and both apply; at equal specificity the later source wins. A CSS
file the project imports itself (from `src/main.js`, a `.scss` file, a deck's own `<style>`) is
no theme source: its rules apply, but a `[data-theme]` in it is not a theme a deck can list.
Put its folder, or its package, in `themes` instead.

`Deck(:themes)` picks the themes a deck can wear, in its order (the first is the one it opens in);
without it, the deck offers every theme there is: `default`, then the project's in alphabetical
order. A name there that is neither `default` nor a theme a source gives (above) is skipped,
with one `[arao]` warning. `?theme=<name>` and `t`
(or the controls' picker) change the theme while presenting; `useDeck().themes` is the deck's
list.

Where tokens apply, from weakest to strongest:

1. the defaults, declared at the root with zero specificity (`:where(:root)`): they reach
   everything Arao draws, inside a theme or not (the presenter view and its notes, the deck
   list);
2. any rule of the project's own, `:root { --ar-accent: … }` included, which wins over a default;
3. the theme's rule, on the element that wears it (the audience's window, each slide area of the
   presenter view, the export's book);
4. a token set on any element inside (a layout, a slide, a table, `style="--ar-…"`).

A token whose default is another token (`--ar-footer-color` is `--ar-muted`, the slide title's
colour is `--ar-accent`) follows that token wherever it is read: a theme that changes `--ar-muted`
changes the footer too, unless it sets `--ar-footer-color`. The deck's own interface (the
controls, the presenter view, the export's notes pages) has tokens too: a theme restyles the
controls and the notes pages (they sit inside it); the presenter view sits outside every theme,
so its tokens are set at `:root`.

## Another theme

```css
/* src/themes/venue.css: found and loaded by the plugin; Deck(:themes) may name 'venue' */
[data-theme="venue"] {
  --ar-letterbox: #111; --ar-bg: #fff; --ar-fg: #222; --ar-muted: #777;
  --ar-accent: #0a7;
  --ar-font-sans: system-ui, sans-serif;
  --ar-title: 88px; --ar-radius: 12px;
  --ar-code-bg: #f6f8fa; --ar-code-bar: #e6e8eb;
}
```

In a slide, style through tokens (`color: var(--ar-accent)`,
`background: color-mix(in srgb, var(--ar-fg) 8%, var(--ar-bg))`) rather than fixed colours or
fonts: a venue-specific look is a new theme, not edits to slides.

## Fonts

A theme names its fonts in its tokens, and the build fetches them:

```css
[data-theme="venue"] {
  --ar-font-sans: "Inter", sans-serif;
  --ar-font-mono: "JetBrains Mono", monospace;
}
```

The [Vite plugin](../reference/vite-plugin.md) reads the families in `font-family` declarations
and in the `--ar-font-*` tokens. For a family that no stylesheet declares with `@font-face` and
that is not a system font, it asks the font providers in turn: **Google Fonts, Bunny Fonts,
Fontshare, Fontsource** and **npm** (a font package the project installed). It puts the files in
the build (`assets/_fonts`) and adds the `@font-face` rules, plus fallbacks with matched metrics
so the text does not jump when the font arrives. The dev server serves the same files, and the PDF
export waits for them. This is [fontless](https://github.com/unjs/fontaine/tree/main/packages/fontless), the engine of Nuxt Fonts.

It is on by default: a theme that already names a web font (Inter, Roboto…) now gets it, where
before the text fell back to a font of the machine.

What it fetches: weights 400, 600 and 700, each upright and italic, in every subset the provider
splits the font into (the browser downloads only the subsets a page uses). With a variable font,
one file covers the weights.

System fonts are never fetched: fontless's own list (Georgia, Helvetica, Times New Roman,
Segoe UI, Menlo, Courier New, Verdana, Tahoma…) and the plugin's (Arial, Calibri, Futura,
Gill Sans, Palatino, Trebuchet MS, SF Pro… in `vite/fonts.js`). Generic names (`sans-serif`,
`system-ui`, `ui-monospace`) never are either.

**Limits**

- **Only families a provider has.** For another font, write its `@font-face` in the theme file,
  pointing at its files: a family declared with `@font-face` is left alone.
- **The build asks the providers.** Each family name goes to Google, Bunny, Fontshare and
  Fontsource at build time (the deck's viewers never contact them: the files are served with the
  deck). Turn it off for a family, or altogether, below.
- **Network at build time.** The files are cached in `node_modules/.cache/fontless`, but the
  providers' catalogues are cached for a week only (and again on a new version), and a fresh
  install (`npm ci` in CI) starts empty. Offline, a build still passes: fontless warns (the
  plugin cannot quiet it, not even `arao export`), and the text uses the family's next fonts. To
  fail the build instead (CI), set `fonts: { throwOnError: true }`.
- **Behind a proxy** (`HTTPS_PROXY`), fetching goes through it on Node 22.19 or later only (the
  proxy support needs a newer `undici` than Node 20 runs; npm may warn about its engine on
  install). On older Node a build behind a proxy gets no fonts, as offline.
- **`--ar-ui-font`** (the controls and the presenter view) is not read: use a system font, or
  name the family in `families` with `global: true` (`fonts: { families: [{ name: 'Inter', global: true }] }`),
  which loads it on every page.
- **The licence is the font's.** The providers above serve open fonts.

**Options**: `arao({ fonts: false })` turns it off. An object is passed to
[fontless](https://github.com/unjs/fontaine/tree/main/packages/fontless#configuration), over the plugin's defaults, key by key: `defaults`
(`weights`, `styles`, `subsets`), `providers`, `priority`, `families`, `throwOnError`…

```js
arao({
  fonts: {
    defaults: { weights: [400, 700] },
    families: [
      { name: 'Brand Sans', provider: 'none' },     // never fetched (its @font-face is ours)
      { name: 'Inter', provider: 'bunny' },          // from Bunny only
    ],
    throwOnError: true,                              // a font that cannot be fetched fails the build
  },
})
```

## Sizes

Rules of thumb for a 1920x1080 canvas (and what the defaults do):

- **Safe margin** ≈ 5–7 % of each side, for projectors that crop the edges: `--ar-pad`
  (110 x 140 px).
- **Header** ≈ 12–15 % of the height for the title zone (a band, if any: `--ar-header-height`).
- **Footer** ≈ 5–8 % of the height: the default band is 88 px, in place of the bottom padding,
  with 24 px text.
- **Body text** 36–44 px (`--ar-text-base`: 42 px); nothing under ≈ 28 px except the footer and
  dense code.
