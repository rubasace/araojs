# The project

Decks live in a **slides project** of their own: a Vite app that depends on the `araojs` package
(the engine, its components, addons, its default theme, a Vite plugin and the PDF export). The
engine is the library: nothing of it is copied into the project. Setting one up from nothing:
[Getting started](../getting-started.md).

## Layout

```
package.json        depends on araojs; scripts dev, build, export
vite.config.js      plugins: [arao()]
index.html          <div id="app"> and /src/main.js
src/
  main.js           createDeckApp().mount('#app')
  decks/            one .vue file per deck (/<file name>)
    <talk>/         components only that talk uses
  slides/           components shared by several decks
  snippets/         code files shown by Snippet(file="…"), by name (subfolders allowed)
  images/           pictures used by Img(file="…") and Slide(bg="…"), by name (subfolders allowed)
  themes/           the project's themes, if any: CSS files, each [data-theme="<name>"] a theme
```

Paths like `src/decks` are the plugin's default folders; each one is an option of `arao()`
([Vite plugin](../reference/vite-plugin.md)).

A component written for one talk goes in `src/decks/<talk>/`; one that several decks use goes in
`src/slides/`. Neither is registered globally: the deck imports it
(`import Card from '../slides/Card.vue'`).

## Scripts

```json
"scripts": { "dev": "vite", "build": "vite build", "export": "arao export" }
```

`npm run dev` is the Vite dev server with hot reload, `npm run build` a static build into `dist/`
(every deck, each at its path; with a `404.html` for static hosts, see [Hosting](hosting.md)) and
`npm run export` the PDF ([Export to PDF](export.md)).

## createDeckApp

`createDeckApp(options?)` creates the Vue app with the engine installed and renders the deck the
URL's path names, `/<name>` ([URLs](../reference/urls.md)), or at `/` the list of decks.

| Option | Default | Meaning |
|---|---|---|
| `deckList` | `'auto'` | `'auto'`: a project with one deck opens it at `/`, with several `/` lists them. `'always'`: `/` lists the decks even when there is one |

A project's only deck, opened at `/`, stays `/` in the address bar, and is the same deck as at
`/<name>`: windows at either stay in step, and its presenter window opens at `/<name>?presenter`.

Any other option, or a value that is none of these, warns in the console and is ignored.

## The list of decks

At `/` the app lists the decks: a card per deck, in alphabetical order, with the deck's cover
(its first slide at step 1, in the first theme of its list: [Themes](themes.md)) drawn live and
small in it, its title and its path.

- The title is the file name in words (`my-talk` → "My talk", `MyTalk` → "My Talk"), there from
  the start; under it, once the cover is drawn, its first heading (else its `Slide(title)`),
  unless it says the same. Name the file after the talk, and give the cover the talk's name as
  its heading.
- Title, heading and path take one line each (cut with an ellipsis), so every card has the same
  height. A deck whose canvas is not 16:9 shows in the card's frame, letterboxed in the frame's
  colour.
- A cover is drawn when its card nears the viewport, and is a picture: nothing in it reacts,
  nothing plays, it touches neither the URL nor other windows (`useDeck().role` is `'thumbnail'`
  there; only the cover slide draws its content, but code a deck runs when it mounts runs there
  too).
- The page has its own dark look, like the presenter view: its `--ar-selector-*` tokens
  ([Interface](../reference/theme-tokens.md#interface)), which a `:root` rule restyles (the page
  sits in no theme).
- A deck that cannot be drawn (its code fails to load, or throws as it is drawn) shows "Sin
  vista previa" in its card, with one console warning.
- Each card is a link that keeps the page's query, not its hash: on `/?presenter&theme=acme`
  they lead to `/<name>?presenter&theme=acme`.
- A path that names no deck warns in the console and shows the list, with a notice.
- Two deck files whose names differ only in case (`Talk.vue`, `talk.vue`) are one deck to the
  path: the first in code-point order (`Talk`) is kept, with a warning in the dev server.

## CSS

The engine's CSS (structure, layouts, controls, and the tokens' defaults, which are the
`default` theme) comes with `'araojs'`; the plugin loads the [built-in themes](built-in-themes.md)
(`arao({ builtinThemes })` says which) and the project's (the CSS files of `src/themes/`), with
nothing to import ([Themes](themes.md)).

## An app shell of your own

Instead of `createDeckApp`: `createApp(MyApp).use(Arao)` with `import Arao from 'araojs'`; it
registers the global components and directives.

## Package entry points

`araojs` (engine, `createDeckApp`, components, `step`/`stepFrom`, composables, addons),
`araojs/vite` (the plugin), `araojs/style.css` (the engine's CSS, already imported by `araojs`);
the `arao` command ([CLI](../reference/cli.md)).
