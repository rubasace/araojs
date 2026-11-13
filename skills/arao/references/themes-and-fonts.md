# Themes and fonts

Slides say *what*; themes say *how it looks*. Change the look in a theme, never in the slides.
Full guide: `docs/guide/themes.md`; every token with its default: `docs/reference/theme-tokens.md`.

## Contents

- Writing a theme
- Choosing themes per deck
- Where themes come from (folders, packages)
- Fonts
- Styling inside a deck without breaking themes

## Writing a theme

A theme is a `[data-theme="<name>"] { --ar-…: …; }` block in a CSS file of `src/themes/`
(`src/themes/<name>.css`), declaring only the tokens it changes over the defaults:

```css
/* src/themes/midnight.css: a dark venue, an orange accent and a dark code window */
[data-theme="midnight"] {
  --ar-bg: #11151b;
  --ar-fg: #e9e6df;
  --ar-muted: #8e99a6;
  --ar-accent: #ff6a3d;
  --ar-accent-fg: #11151b;
  --ar-letterbox: #0a0d11;
  --ar-font-sans: "Inter", system-ui, sans-serif;
  --ar-title-align: center;
  /* the code window: its defaults are light */
  --ar-code-theme: github-dark-default;
  --ar-code-bg: #0d1117;
  --ar-code-bar: #1b2129;
  --ar-code-fg: #e6edf3;
  --ar-code-muted: #6e7681;
  --ar-code-title: #c9d1d9;
  --ar-code-hl: #58a6ff;
}
```

- **A dark theme sets the code tokens too**: the code window's defaults are light
  (`--ar-code-theme: github-light`, a white `--ar-code-bg`), so a dark page with them shows a
  white window. `--ar-code-theme` is a Shiki theme name (`github-dark-default`,
  `material-theme-darker`…). Tables follow `--ar-fg` (their lines are the text colour at 15 %),
  so they need nothing unless you want a header background (`--ar-table-head-bg`) or stripes
  (`--ar-table-stripe`).

- Nothing to import: the plugin loads every CSS file there and takes the theme's name from the
  selector, not the file name. One file may hold several themes.
- Every token has a default, and the defaults are the `default` theme (no file; always valid).
- Title colour, size and gap, list spacing, table look, footer position: tokens
  (`--ar-title-*`, `--ar-list-gap`, `--ar-table-*`, `--ar-footer-*`), set in the theme.
- A token whose default is another token follows it (`--ar-footer-color` defaults to
  `--ar-muted`): change the base one unless you mean to split them.
- No theme ships with the package besides `default`; there is no `araojs/themes/…` to import.

## Choosing themes per deck

- A deck without `themes` offers every theme: `default` first, then each source's, in order.
- `Deck(:themes="['venue', 'default']")` picks some, in order; the first is the one it opens in.
  The colon matters: it is an array.
- A name no theme source gives is skipped with an `[arao]` warning.
- While presenting: `t` cycles themes, the controls' picker chooses one, `?theme=<name>` opens in
  one.

## Where themes come from

Only from **theme sources**, `arao({ themes })` in `vite.config.js` (default `'src/themes'`):

```js
arao({ themes: ['src/themes', 'src/styles/venues', 'arao-themes'] })
```

- **A folder**: a path from the project's root. A bare lowercase name is a package, so a folder
  right at the root is written `'./themes'`.
- **A package**: an installed npm package (`npm i -D arao-themes`) with plain CSS in a `themes/`
  folder at its root, or in the folder its `package.json` names with `"arao": { "themes": "dist" }`.
  Missing, or with no theme in it: the build stops with an `[arao]` error.
- **Never import theme CSS by hand** (from `src/main.js`, a `.scss`, a deck's `<style>`): its rules
  apply, but its `[data-theme]` is not a theme a deck can wear. Put its folder or package in
  `themes`.
- A name two sources give is offered once; both files apply, and at equal specificity the later
  source wins (Vite warns).

## Fonts

Fonts are fetched, not installed. A theme names a web font in `--ar-font-sans` / `--ar-font-mono`
and the build downloads it (Google Fonts, Bunny, Fontshare, Fontsource, or an installed npm font
package) and serves it with the deck, with matched fallbacks:

```css
[data-theme="venue"] {
  --ar-font-sans: "Inter", sans-serif;
  --ar-font-mono: "JetBrains Mono", monospace;
}
```

- No `@font-face`, no font files, no `<link>` for a font a provider has.
- System fonts (Georgia, Arial, Helvetica, Menlo…) and generic names are never fetched.
- Weights 400, 600 and 700, upright and italic, are fetched by default.
- The first build needs the network; the catalogue cache lasts a week, and `npm ci` starts empty.
  Offline or on a provider timeout the build still passes with an `[arao] fonts:` warning and the
  stack's fallback fonts. For CI that must fail instead: `arao({ fonts: { throwOnError: true } })`.
- A font no provider has: write its own `@font-face` in the theme file, pointing at its files.
- `--ar-ui-font` (controls, presenter view) is not fetched: use a system font there.
- Off: `arao({ fonts: false })`; per family: `fonts: { families: [{ name: 'Brand', provider: 'none' }] }`.

Options and limits: `docs/guide/themes.md#fonts`, `docs/reference/vite-plugin.md`.

## Styling inside a deck without breaking themes

When a deck needs a local class, use tokens so every theme still works:

```css
.hot { color: var(--ar-accent); }
.card { background: color-mix(in srgb, var(--ar-fg) 8%, var(--ar-bg)); }
```

- No literal colours or font names in decks; no `vw`/`vh`/`%` font sizes or media queries.
- A venue-specific look is a new theme, not edits to slides.
