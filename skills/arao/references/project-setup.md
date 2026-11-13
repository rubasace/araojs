# Setting up an Arao slides project

A slides project is a Vite app that depends on `araojs` (with `vue` and `vite`, its peers). The
engine is the library: nothing of it is copied into the project. Needs Node 20.19 or newer.

## From an empty folder

```bash
mkdir my-talks && cd my-talks && npm init -y && npm pkg set type=module
npm install araojs vue && npm install -D vite
npm pkg set scripts.dev=vite scripts.build="vite build" scripts.export="arao export"
```

Three files:

```js
// vite.config.js
import { defineConfig } from 'vite'
import arao from 'araojs/vite'

export default defineConfig({ plugins: [arao()] })
```

```js
// src/main.js
import { createDeckApp } from 'araojs'

createDeckApp().mount('#app')
```

```html
<!-- index.html -->
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

- `arao()` is the only Vite plugin: it brings `@vitejs/plugin-vue` and Pug along. Don't add
  `vue()` too; Vue's options go in `arao({ vue: { … } })`.
- `createDeckApp()` renders the deck the URL's path names, or the list of decks at `/`. With only
  one deck, `/` opens it; `createDeckApp({ deckList: 'always' })` lists it anyway.
- The engine's CSS comes with `'araojs'`; the project's themes are loaded by the plugin. Nothing
  else to import.

Then write `src/decks/<Name>.vue` (start from [recipes.md](recipes.md)) and run `npm run dev`.

## The layout

```
package.json       depends on araojs; scripts dev (vite), build (vite build), export (arao export)
vite.config.js     plugins: [arao()], from 'araojs/vite'
index.html         <div id="app"> and /src/main.js
src/main.js        createDeckApp().mount('#app')
src/decks/         one .vue file per deck (/<file name>)
src/decks/<talk>/  components only that talk uses
src/slides/        components several decks share
src/snippets/      code files, by name, for Snippet(file="…")
src/images/        pictures, by name, for Img(file="…") and Slide(bg="…")
src/themes/        the project's themes, if any: CSS files, loaded by the plugin (no import)
src/shortcuts.ts   optional: keys remapped/added/turned off (see shortcuts.md)
```

Folders can be moved with plugin options:
`arao({ decks: 'src/decks', snippets: 'src/snippets', images: 'src/images', themes: 'src/themes' })`.
Every option: `docs/reference/vite-plugin.md`.

## URLs

- `/<name>`: the deck (file name, case-insensitive). `/` alone: the list of decks.
- `?presenter`: presenter view; `?theme=<name>`: wear a theme; `?export`: print layout.
- `#/<slide>/<step>`: position, both 1-based.
- The old `/?deck=<name>` still works and turns into `/<name>`.
- Under a Vite `base` (`/talks/`) every path is under it; hosting a build: `docs/guide/hosting.md`.

All of them: `docs/reference/urls.md`.

## Naming decks

The list at `/` titles each card by the file name in words (`my-talk.vue` → "My talk") with the
cover's first heading under it: name the file after the talk and give the cover the talk's name
as its `h1`.
