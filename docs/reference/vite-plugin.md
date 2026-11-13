# Vite plugin

`arao()` from `araojs/vite` is all a slides project puts in its Vite config. It includes
`@vitejs/plugin-vue` (do not add `vue()` as well: Vite stops with an error) with Pug for the
templates (no need to install `pug`; HTML templates need nothing), and exposes the project's
folders as virtual modules, so slides name files and need no imports, and themes (from folders or
packages) need no import either. It also resolves the [icons](../guide/icons.md) the source uses.

```js
// vite.config.js
import arao from 'araojs/vite'
export default defineConfig({
  plugins: [arao({ decks: 'src/decks', snippets: 'src/snippets', images: 'src/images', themes: 'src/themes' })],
})
```

| Option | Default | Used by | Contents |
|---|---|---|---|
| `decks` | `'src/decks'` | `createDeckApp()`, `arao export` | the `.vue` files directly in it (not in subfolders), one lazily loaded chunk each, each opened at `/<file name>` |
| `snippets` | `'src/snippets'` | `Snippet(file)` | every file, as raw text, loaded lazily |
| `images` | `'src/images'` | `Img(file)`, `Slide(bg)` | `png jpg jpeg gif webp avif svg` (any case), as URLs, eager |
| `themes` | `'src/themes'` | `Deck(:themes)`, `?theme=`, `t` | the theme sources, one or a list, in order: a folder (`'src/themes'`, `'./themes'`) or an installed package's name (a bare lowercase name, `'arao-themes'`, `'@acme/arao-themes'`: its `themes/` folder, or the folder inside it that its `package.json` names in `"arao": { "themes": "<folder>" }`); anything that is not a bare lowercase name is a folder. Symlinks are resolved, and a folder named twice counts once. The `.css` files directly in each folder are loaded after the engine's CSS; their `[data-theme="<name>"]` selectors, and those of the local partials they `@import`, name the themes ([Themes](../guide/themes.md)). A package not installed, or one that gives no theme, stops the build |
| `icons` | `[]` | `Icon` | names (`'lucide:sun'`) built in even when the source does not spell them out (built at runtime); one that is in no installed set is reported when the module is built |
| `vue` | `{}` | — | options for `@vitejs/plugin-vue`, passed through |

- A folder is relative to the Vite root, or absolute. One outside the root (`../shared/images`)
  works too: it is added to `server.fs.allow` and watched.
- A folder that was set explicitly but does not exist is reported when Vite starts.
- Subfolders are allowed (snippets, images); files are named by their path inside the folder;
  names are case-sensitive.
- Adding or removing a picture during development updates the slides in place.
- Modules: `virtual:arao/decks` exports `decks` (file name → loader) and `decksDir`;
  `virtual:arao/snippets` exports `snippets` (path → loader) and `snippetsDir`;
  `virtual:arao/images` exports `images` (path → URL) and `imagesDir`;
  `virtual:arao/themes` exports `themes` (the theme names, source after source, sorted in each)
  and `themeSources` (the sources, as messages name them), and `virtual:arao/theme-styles`
  imports every source's CSS files, in order;
  `virtual:arao/icons` exports `icons` (`prefix:name` → `{ body, width, height }`, only the icons
  the source uses, plus the `icons` option).
- It also keeps `araojs` out of Vite's dependency prebundling (it imports those virtual
  modules), prebundles what it imports (`vue`, `shiki`, `@vueuse/core`), and dedupes `vue`, so a
  linked copy of the library (`npm link`, `file:`) uses the project's Vue.
