# Architecture

How the engine in `src/` is laid out, for whoever works on Arao itself. Deck authors need none of
this: [reference.md](reference.md) is their API, [../AGENTS.md](../AGENTS.md) their guide.

## Folders

| Folder | Role | What is in it |
|---|---|---|
| `state/` | what there is | the deck, its stages and its slides: reactive state, made by a `create…` and read by a `use…` (the pair shares a provide/inject key private to its file) |
| `composables/` | effects | small internal composables, one per file, that tie the state to the browser: the URL, other windows, keys, touch, the mouse |
| `core/` | the pure how | plain modules with no Vue component state: sync, timer, exporter, flip, image, icons |
| `views/` | what Arao draws | the three views of a deck and their parts (the scaled canvas, the controls, the presenter's bar) |
| `components/` | what deck authors write | `Deck`, `Slide`, `Img`, `Icon`, `Snippet`, `Notes`, the layout components (`layout.js`); `directives/` holds `v-step` and `v-step-from` |
| `addons/` | drawn over every slide | `ProgressBar`, `SlideNumber` |
| `styles/`, `themes/` | CSS | engine.css and layouts.css; the shipped themes |

`index.js` is the only barrel (the public API); every other module imports the file it uses.
`plugin.js` is the Vue plugin, `app.js` is `createDeckApp`.

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
`title`/`duration`/`setTimer`). `v-step` finds its slide through the DOM (`data-ar-slide`, a map
in directives/step.js).

## Composables

| Composable | Effect |
|---|---|
| `useHashRoute(stage)` | the URL hash is the position (`#/slide/step`): read on mount and on `hashchange`, written on every move |
| `useDeckSync(stage, …)` | every window of the deck in step through core/sync.js: position, theme, timer |
| `usePresenterWindow()` | opens the presenter window or brings it forward; `blocked` when the browser blocks it |
| `useKeyboard(actions)` | the deck's keys on the window (VueUse `onKeyStroke`) |
| `useTouchNav(el, …)` | taps (edges, middle) and swipes, from pointer events: touch and pen (VueUse's `useSwipe` reads touch events only, so the pen would lose its swipes) |
| `useMouseIdle(el, ms)` | whether the mouse has been still over the element; ignores a tap's echo mousemove, `wake(ms)` for a time of its own (VueUse's `useIdle` has neither) |

VueUse (`@vueuse/core`, a dependency, external in the build) also gives `useEventListener` and
`useFullscreen`.

## useDeck()

What any component inside a `Deck` gets. The position is that of the stage the caller is drawn
in; outside every stage (the controls, the presenter's bar) it is the deck's own stage.

| Field | Kind |
|---|---|
| `index`, `step`, `total`, `steps`, `progress` | read-only refs, of the caller's stage |
| `role` | string: `'audience'`, `'presenter'`, `'preview'` or `'export'` |
| `theme`, `themes`, `fullscreen`, `timer` | read-only refs |
| `next()`, `prev()`, `go(i, step)` | moves (do nothing in the preview) |
| `setTheme(name)`, `toggleFullscreen()`, `openPresenter()` | actions |

Internals stay off it: slide registration, sync, the writable timer, the export.
