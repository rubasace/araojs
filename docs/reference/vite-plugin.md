# Vite plugin

`arao()` from `araojs/vite` is all a slides project puts in its Vite config. It includes
`@vitejs/plugin-vue` (do not add `vue()` as well: Vite stops with an error) with Pug for the
templates (no need to install `pug`; HTML templates need nothing), and exposes the project's
folders as virtual modules, so slides name files and need no imports, and themes (from folders or
packages) and layouts need no import either. It also resolves the [icons](../guide/icons.md) the source uses, and fetches the
[web fonts](../guide/themes.md#fonts) the themes name.

```js
// vite.config.js
import arao from 'araojs/vite'
export default defineConfig({
  plugins: [arao({ decks: 'src/decks', snippets: 'src/snippets', images: 'src/images', themes: 'src/themes', layouts: 'src/layouts' })],
})
```

| Option | Default | Used by | Contents |
|---|---|---|---|
| `decks` | `'src/decks'` | `createDeckApp()`, `arao export` | the `.vue` files directly in it (not in subfolders), one lazily loaded chunk each, each opened at `/<file name>` |
| `snippets` | `'src/snippets'` | `Snippet(file)` | every file, as raw text, loaded lazily |
| `images` | `'src/images'` | `Img(file)`, `Background(src)` | `png jpg jpeg gif webp avif svg` (any case), as URLs, eager |
| `themes` | `'src/themes'` | `Deck(:themes)`, `?theme=`, `t` | the project's theme sources, one or a list, in order, beside the library's own (its `themes/` folder: the [built-in themes](../guide/built-in-themes.md), `builtinThemes`): a folder (`'src/themes'`, `'./themes'`) or an installed package's name (a bare lowercase name, `'arao-themes'`, `'@acme/arao-themes'`: its `themes/` folder, or the folder inside it that its `package.json` names in `"arao": { "themes": "<folder>" }`); anything that is not a bare lowercase name is a folder. Symlinks are resolved, and a folder named twice counts once. The `.css` files directly in each folder are loaded after the engine's CSS; their `[data-theme="<name>"]` selectors, and those of the local partials they `@import`, name the themes ([Themes](../guide/themes.md)). A package not installed, or one that gives no theme, stops the build |
| `builtinThemes` | `true` | `Deck(:themes)`, `?theme=`, `t` | the [built-in themes](../guide/built-in-themes.md) to load: all (`true`), none but `default` (`false`), or their names (`['folio', 'carbon']`; a name that is none stops the build). One left out is not in the build: no CSS, no fonts, no name to offer. A project theme of the same name replaces a built-in one (its file is not loaded), with a message |
| `layouts` | `'src/layouts'` | `Slide(layout)` | the project's [layouts](../guide/slides-and-layouts.md#a-layout-of-your-own), one folder: each `.css` file directly in it is one layout, named as the file (`epigraph.css` styles `Slide(layout="epigraph")`), loaded after the library's own (its `layouts/` folder: `cover`, `section`, `split`, `grid`, `quote`, `statement`, `overlay`, `caption`, `image-left`, `image-right`) and before the themes, with nothing to import. A file named like a library layout replaces it (the library's file is not loaded), with a message. A file whose name is no layout's (letters, digits, `-` and `_`), or that never names `.layout-<name>`, is loaded all the same, with a warning. Subfolders hold what the layouts use and are not loaded on their own. Each layout's tokens, every `--ar-layout-<name>-<thing>` its file declares or reads, are attributes of its slides, `<thing>` ([Layout parameters](../guide/slides-and-layouts.md#layout-parameters)); a token of a project file whose `<thing>` is an attribute a slide already has (an HTML global attribute such as `title` or `id`, Vue's `key`/`ref`/`is`, `layout`, `on` and `on-…` (Vue's listeners), anything starting with `data-`, `aria-` or `v-`) or is not lower-case kebab-case is none, with a warning, once, naming the file. Each file starts with a doc block saying what the layout is for, an example, its zones and its parameters ([Its doc block](../guide/slides-and-layouts.md#its-doc-block)): what one gets wrong (a `@param` naming no token, an unknown tag…) is a warning, once, naming the file; a file without one is a layout all the same. Its colours and sizes are theme tokens: a declaration that writes a literal colour (`#fff`, `rgb()`, `white`) or a fixed length (`px`, `pt`, `rem`, `vw`… but `0`) is a warning, once, naming the file, the line and the value ([Its values](../guide/slides-and-layouts.md#its-values)). `arao layouts` prints every layout with it ([CLI](cli.md#arao-layouts)) |
| `dts` | `true` | the editor, `vue-tsc` | the declaration file that adds the project's layouts, each one's parameters and its zones, to what `Slide` accepts in a type-checked template, with what each one's doc block says for the editor's hover (the interfaces `ProjectLayouts` and `ProjectLayoutZones`: [Layouts in the editor](../guide/slides-and-layouts.md#layouts-in-the-editor)): `true` writes `src/arao-layouts.d.ts`, a path (from the Vite root) writes it there instead, `false` writes none. Written when Vite starts (the dev server, a build), and again when a layout file is added, removed or edited, only if its text changes; not at all while the project has no layout of its own. Only valid names go in it. A file that cannot be written, or one that exists and is not the generated one, is a warning, never a failed build (and never overwritten). Turning it off or moving it leaves the old file behind: delete it |
| `icons` | `[]` | `Icon` | names (`'lucide:sun'`) built in even when the source does not spell them out (built at runtime); one that is in no installed set is reported when the module is built |
| `fonts` | `true` | themes' font tokens | web fonts the CSS names (`font-family`, `--ar-font-*`) fetched at build time from Google Fonts, Bunny Fonts, Fontshare, Fontsource or an installed font package, and served with the deck: weights 400, 600 and 700, upright and italic; system fonts never ([Fonts](../guide/themes.md#fonts)). The `default` theme's Gelasio is fetched in every build unless it sets `false` or `families: [{ name: 'Gelasio', provider: 'none' }]`, so the build contacts the providers: a CI build without network should set one of them (with the second, the built-in themes' fonts are still fetched unless `builtinThemes` leaves them out). `false` turns it off; an object is passed to [fontless](https://github.com/unjs/fontaine/tree/main/packages/fontless#configuration) over those defaults (a font that cannot be fetched is a warning and the deck uses its fallback fonts; `throwOnError: true` fails the build instead) |
| `vue` | `{}` | — | options for `@vitejs/plugin-vue`, passed through |

- A folder is relative to the Vite root, or absolute. One outside the root (`../shared/images`)
  works too: it is added to `server.fs.allow` and watched.
- A folder that was set explicitly but does not exist is reported when Vite starts.
- Subfolders are allowed (snippets, images); files are named by their path inside the folder;
  names are case-sensitive.
- Adding, editing or removing a layout file during development applies at once (the page
  reloads when the file replaces a library layout, or stops replacing one, and when its tokens,
  the layout's parameters, change), and rewrites `src/arao-layouts.d.ts` (`dts`) when the
  layouts, their parameters, their zones or their doc blocks change.
- Adding or removing a picture during development updates the slides in place.
- Modules: `virtual:arao/decks` exports `decks` (file name → loader) and `decksDir`;
  `virtual:arao/snippets` exports `snippets` (path → loader) and `snippetsDir`;
  `virtual:arao/images` exports `images` (path → URL) and `imagesDir`;
  `virtual:arao/themes` exports `themes` (the theme names, `default` first, then the project's,
  source after source, then the built-in ones, sorted in each) and `themeSources` (the sources, as messages name
  them), and `virtual:arao/theme-styles` imports every source's CSS files, in order;
  `virtual:arao/layout-styles` imports the layouts' CSS files, the library's then the project's;
  `virtual:arao/layout-tokens` exports `layoutTokens` (layout → the `<thing>` of each of its
  parameters, which `Slide` sets as `--ar-layout-<layout>-<thing>`);
  `virtual:arao/shortcuts` exports `shortcuts`, the key map in effect (key → command): the
  engine's keys with the project's optional `src/shortcuts.ts` (else `src/shortcuts.js`) over them,
  checked when Vite starts, which fails on a mistake naming the file
  ([Your own keys](../guide/presenting.md#your-own-keys));
  `virtual:arao/icons` exports `icons` (`prefix:name` → `{ body, width, height }`, only the icons
  the source uses, plus the `icons` option).
- It also keeps `araojs` out of Vite's dependency prebundling (it imports those virtual
  modules), prebundles what it imports (`vue`, `shiki`, `@vueuse/core`), and dedupes `vue`, so a
  linked copy of the library (`npm link`, `file:`) uses the project's Vue.
