# Architecture

How the engine in `src/` is laid out, for whoever works on Arao itself. Deck authors need none of
this: [reference.md](reference.md) is their API, [../AGENTS.md](../AGENTS.md) their guide.

## Folders

| Folder | Role | What is in it |
|---|---|---|
| `state/` | what there is | the deck, its stages and its slides: reactive state, made by a `create…` and read by a `use…` (the pair shares a provide/inject key private to its file) |
| `composables/` | effects | small internal composables, one per file, that tie the state to the browser: the URL, other windows, keys, touch, the mouse, fullscreen |
| `core/` | the pure how | plain modules with no Vue component state: sync, timer, exporter, flip, image, icons, layout (the parsers of the layout props: ratio, gap, grid shape) |
| `views/` | what Arao draws | the three views of a deck and their parts (the scaled canvas, the controls, the presenter's bar); `DeckSelector`, the list of decks `createDeckApp` shows when the URL names none |
| `components/` | what deck authors write | `Deck`, `Slide`, `Img`, `Icon`, `Snippet`, `Notes`; `layout/` holds the layout components (`Cols`, `Rows`, `Grid`, `Center`), `directives/` holds `v-step` and `v-step-from` |
| `addons/` | drawn over every slide | `ProgressBar`, `SlideNumber` |
| `styles/`, `themes/` | CSS | only what is global: `tokens.css` (every token and its default), `base.css` (the page, the viewport, the steps); the shipped themes. Everything else comes with its component ([CSS](#css)) |

`index.js` is the only barrel (the public API); every other module imports the file it uses.
`plugin.js` is the Vue plugin, `app.js` is `createDeckApp`: it renders the deck `?deck=` names,
or `views/DeckSelector.vue` (a plain page, outside every `Deck`) when there is no deck to open.

## Views

`Deck.vue` makes the deck (`createDeck(props)`), wires the keys (every view but the export's) and
shows one view, by the URL:

```
Deck.vue ── createDeck(props) ── state/deck.js: stage(s), theme, timer, fullscreen, URL, sync
   │
   ├─ ?export ─────────▶ ExportView      Stage (role 'export')            → core/exporter.js book
   ├─ ?presenter ──────▶ PresenterView   PresenterBar
   │                                     Stage (role 'presenter')  + Controls (docked)
   │                                     Stage (role 'preview', one step ahead) + notes
   └─ (default) ───────▶ AudienceView    Stage (role 'audience')   + Controls + blocked-window notice
                                         mouse idle (controls 2.5 s, cursor), touch nav
```

`?export` wins over `?presenter`. Each `Stage` (views/parts/Stage.vue) draws the deck's default
slot on the scaled canvas, so the presenter view mounts every slide twice. The presenter window
listens to no mouse or touch of its own.

## Provide / inject channels

| Channel | Provided by | Read by | Carries |
|---|---|---|---|
| deck | `createDeck` (in `Deck`) | `useDeck()` | the public face (below), never the internals |
| stage | `provideStage` (in the `Stage` part) | `useStage()`: `createSlide`, and `useDeck()` (which merges the stage's position into the face) | the stage a component is drawn in |
| slide | `createSlide` (in `Slide`) | `useSlide()`, `useSlideNotes()` (Notes) | the slide's step, its step registry, its notes |
| footer | `provideFooter` (in `Deck`) | `createSlide` | the Deck's `#footer` slot, drawn by every slide |

Nothing else is provided. The views get the deck's internals from `Deck` as a prop (`deck`), and
pass what their parts need as props (the controls' `docked`/`shown`/`titles`, the bar's
`title`/`setTimer`/`deckDuration`/`setDuration`). `v-step` finds its slide through the DOM
(`data-ar-slide`, a map in directives/step.js).

## Composables

| Composable | Effect |
|---|---|
| `useHashRoute(stage)` | the URL hash is the position (`#/slide/step`): read on mount and on `hashchange`, written on every move |
| `useDeckSync(stage, …)` | every window of the deck in step through core/sync.js: position, theme, timer, the duration set in the presenter view (the last two kept through a reload) |
| `usePresenterWindow()` | opens the presenter window or brings it forward; `blocked` when the browser blocks it |
| `useKeyboard(actions)` | the deck's keys on the window (VueUse `onKeyStroke`); keys inside a text field or an element marked `data-ar-own-keys` (the presenter's duration editor) are left to it |
| `useTouchNav(el, …)` | taps (edges, middle) and swipes, from pointer events: touch and pen (VueUse's `useSwipe` reads touch events only, so the pen would lose its swipes) |
| `useMouseIdle(el, ms)` | whether the mouse has been still over the element; ignores a tap's echo mousemove, `wake(ms)` for a time of its own (VueUse's `useIdle` has neither) |
| `useFullscreen(el)` | `fullscreen` is true while anything in the window is fullscreen; `toggle()` leaves it if so, else makes the element fullscreen; the standard API only (VueUse's `useFullscreen` counts only its own element and falls back to prefixed APIs) |

VueUse (`@vueuse/core`, a dependency, external in the build, prebundled by the Vite plugin) also
gives `useEventListener`, which every composable here listens with.

## useDeck()

What any component inside a `Deck` gets. The position is that of the stage the caller is drawn
in; outside every stage (the controls, the presenter's bar) it is the deck's own stage.

| Field | Kind |
|---|---|
| `index`, `step`, `total`, `steps`, `progress` | read-only refs, of the caller's stage |
| `role` | string: `'audience'`, `'presenter'`, `'preview'` or `'export'` |
| `theme`, `themes`, `fullscreen`, `timer` | read-only refs, deeply (`themes.value`, `timer.value` cannot be edited in place) |
| `duration` | computed: the talk's length in effect, in ms, or null (the presenter's, else `Deck(duration)`) |
| `next()`, `prev()`, `go(i, step)` | moves |
| `setTheme(name)`, `toggleFullscreen()`, `openPresenter()` | actions; `setTheme` with a name not in `themes` warns and is ignored |

The face, and each stage's copy of it, is frozen: no component can reassign `go`, `setTheme` or
any other field. Internals stay off it: slide registration, sync, the writable timer and
duration (`setTimer`, `setDuration`: the presenter view hands them to its bar), the export.
Frozen, Vue leaves it as it is inside `reactive()` or `data()`: its refs are not unwrapped there.

One rule for the preview (role `'preview'`, the presenter view's next step): it is a copy, it
cannot act. Every function of its face does nothing: `next`, `prev`, `go` (the stage is a follower,
state/stage.js) and `setTheme`, `toggleFullscreen`, `openPresenter` (useDeck() swaps them for
no-ops, state/deck.js). Its refs still read: its own position, the deck's theme, timer, duration
and fullscreen.

## CSS

Every component carries its own CSS, in the `<style>` block of its `.vue` file: the layout
components, `Img`, `Icon`, `Snippet`, `Slide` (its zones, its footer, the slide's content and the
layouts: `layout-cover`, `layout-section`, `layout-image-left`… are Slide's classes), the addons,
the views and their parts. Not scoped: a theme or a deck must be able to override any of it, so
the selectors are the `ar-` classes at the specificity they always had (zero, with `:where()`,
where a deck's own rule must win). `Notes` draws nothing and has none; the export's notes pages
are `ExportView`'s.

`styles/` keeps what no component owns: `tokens.css`, the tokens' defaults, declared with zero
specificity wherever a theme is applied (`:where([data-theme])`), and the list of the tokens it
cannot declare (no default, or one that depends on where it is read); and `base.css`, the page
(`html`, `body`, `#app`), the viewport the audience and export views share, and the classes
`v-step` sets.

The library build concatenates it all into `dist/arao.css` in import order, and order decides
between two rules of the same specificity on the same element. `plugin.js` imports in that order
and its header says why: `tokens.css`; the views (through `Deck`); `Snippet` before `Slide` (a
Snippet in an image zone takes the zone's `flex`); `Img` before `Slide`; `Slide` before `Icon`
and the layout components (they keep their own `flex` in an image zone); `Img` before the layout
components (their children clip `overflow-x`); `base.css` last (its step fade wins over Snippet's
own transitions); the library build fails if `dist/arao.css` loses three of them (Snippet's
`flex`, the `overflow-x` of an `Img` in `Cols`, the step fade: `vite.config.js`,
`CSS_ORDER`). `index.js` then adds the addons, and `app.js` the deck selector.
