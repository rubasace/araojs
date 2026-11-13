# Architecture

How the engine in `src/` is laid out, for whoever works on Arao itself. Deck authors need none of
this: [the docs](index.md) are their manual, [../AGENTS.md](../AGENTS.md) their guide.

## Folders

| Folder | Role | What is in it |
|---|---|---|
| `state/` | what there is | the deck, its stages, its slides, its theme and the talk's timer: reactive state, made by a `create…` and read by a `use…` (the pair shares a provide/inject key private to its file) |
| `composables/` | effects | small internal composables, one per file, that tie the state to the browser: the URL, other windows, keys, touch, the mouse, fullscreen |
| `core/` | the pure how | plain modules with no Vue component state: sync, exporter, flip, image, icons |
| `views/` | full screens | what a window shows: the deck's `AudienceView`, `PresenterView` and `ExportView`, and `DeckSelectorView`, the list of decks `createDeckApp` shows at `/` |
| `components/` | what deck authors write | `Deck`, `Slide`, `Img`, `Icon`, `Snippet`, `Notes`; `internal/` holds the engine's own components, which no author names: `Stage` (the scaled canvas), `Controls`, `PresenterBar`, `Thumbnail` (a deck drawn as its cover) and `DeckCover` (a cover in the list); `layout/` holds the layout components (`Cols`, `Rows`, `Grid`, `Center`), the parsers of their props (`layout.js`: ratio, gap, grid shape; Slide's zones use it too) and the CSS they share (`layout.css`), `directives/` holds `v-step` and `v-step-from` |
| `addons/` | drawn over every slide | `ProgressBar`, `SlideNumber` |
| `styles/` | CSS | only what is global: `tokens.css` (every token and its default: the `default` theme), `base.css` (the page, the viewport, the steps). Everything else comes with its component ([CSS](#css)); no theme ships with the engine ([Themes](#themes)) |

The rule: `components/` is what an author names or imports (registered by `plugin.js` or exported
by `index.js`, explicitly, never by folder); `components/internal/` is the engine's components that
no author names; `views/` is full screens.

`index.js` is the only barrel (the public API); every other module imports the file it uses.
`plugin.js` is the Vue plugin, `app.js` is `createDeckApp`: it renders the deck the URL's path
names (the first segment after Vite's base), or `views/DeckSelectorView.vue` (a plain page, outside
every `Deck`) when there is no deck to open. It is the one place that reads the path: it puts the
URL in its one form first (`?deck=x` → `/x`, `/X/` → `/x`, with `history.replaceState`), and
tells the deck which one it is (`provideDeckRoute(app, { name, path })`, state/deck.js): its file
name and its path as the list writes it. The sync key and the presenter window's URL use that path,
not the address bar's, so a project's only deck, which opens at `/` and stays `/` there, is one
deck with its `/<name>` windows; the export view reports the name, which the CLI checks. An app of
its own (`createApp(MyApp).use(Arao)`) provides no route: then `location.pathname`, and no name.

## Views

`Deck.vue` makes the deck (`createDeck(props)`) and shows one view, by the URL. The keys are the
controls' (`Controls` calls `useKeyboard`): only the audience and presenter views draw controls,
so only they have keys.

```
Deck.vue ── createDeck(props) ── state/deck.js: stage(s), fullscreen, URL hash, sync
                                   └ createTheme ── state/theme.js: the deck's themes, the one it wears, ?theme=
                                   └ createTimer ── state/timer.js: the timer, the talk's length, and their pure helpers (parseDuration, clock…)
   │
   ├─ thumbnail ───────▶ Thumbnail       Stage (role 'thumbnail', standing at the cover)
   ├─ ?export ─────────▶ ExportView      Stage (role 'export')            → core/exporter.js book
   ├─ ?presenter ──────▶ PresenterView   PresenterBar
   │                                     Stage (role 'presenter')  + Controls (docked) + keys
   │                                     Stage (role 'preview', one step ahead) + notes
   └─ (default) ───────▶ AudienceView    Stage (role 'audience')   + Controls (auto-hide) + keys + blocked-window notice
                                         mouse idle (cursor), touch nav (a middle tap shows/hides the controls)
```

`?export` wins over `?presenter`. Each `Stage` (components/internal/Stage.vue) draws the deck's default
slot on the scaled canvas, so the presenter view mounts every slide twice. The presenter window
listens to no mouse or touch of its own.

Thumbnail mode is not read from the URL: a `Deck` is a thumbnail when something above it called
`provideThumbnail({ title })` (state/deck.js). `DeckCover` does, once per card of the list, and
then renders the deck's `.vue` file inside it (lazily, when the card nears the viewport). The
deck reads nothing of the URL (its theme is the first of its list, resolved as any deck's:
`default` when it names no theme), its stage is a follower that stands at slide 1, step 1, and it
skips every effect: no hash route, no sync, no keys, no presenter window, no duration or themes
warning; its face's actions are the preview's no-ops. Its slides other than the cover
register (so the order is known) but draw no content (`drawn`, state/slide.js), so a card mounts
one slide's pictures and snippets, not the deck's. The deck fills `title` with its cover's first
heading (else its title prop), which the card shows under the deck's title (its file name in words).

## Provide / inject channels

| Channel | Provided by | Read by | Carries |
|---|---|---|---|
| deck | `createDeck` (in `Deck`) | `useDeck()` | the public face (below), never the internals |
| theme | `createTheme` (in `createDeck`) | `useTheme()` (the controls: the themes list, "t") | the deck's themes, the one it wears, setTheme, cycle |
| timer | `createTimer` (in `createDeck`) | `useTimer()` (the presenter's bar) | the timer and the talk's length, with what changes them: start, pause, toggle, reset, setDuration |
| thumbnail | `provideThumbnail` (in `DeckCover`) | `createDeck` | that the deck inside is a thumbnail, and the ref its cover's title goes in |
| route | `provideDeckRoute` (`createDeckApp`, on the app) | `createDeck` (not in a thumbnail) | the deck's file name and path: the sync key, the presenter window's URL, the name the export reports |
| stage | `provideStage` (in the `Stage` part) | `useStage()`: `createSlide`, and `useDeck()` (which merges the stage's position into the face) | the stage a component is drawn in |
| slide | `createSlide` (in `Slide`) | `useSlide()`, `useSlideForNotes()` (Notes) | the slide's step, its step registry |
| notes | `useNotesOutlet` (presenter view, export) | `useNotesTarget()` (Notes) | where the Notes of the slide on screen draw themselves (a Teleport target) |
| footer | `provideFooter` (in `Deck`) | `createSlide` | the Deck's `#footer` slot, drawn by every slide |

Nothing else is provided. The views get the deck's internals from `Deck` as a prop (`deck`), and
pass what their parts need as props (the controls' `docked`/`auto-hide`/`v-model:shown`, the
bar's `title`). The controls read the slides' titles (`useDeck().titles()`) and the themes
(`useTheme()`) themselves; which list is open and what is typed in it are their own. No view
exposes anything, and `Deck` holds no ref to its view. `v-step` finds its slide through the DOM
(`data-ar-slide`, a map in directives/step.js).

## Composables

| Composable | Effect |
|---|---|
| `useDeckSync(stage, …)` | every window of the deck in step through core/sync.js: position, theme, timer, the duration set in the presenter view (the last two kept through a reload) |
| `usePresenterWindow()` | opens the presenter window or brings it forward; `blocked` when the browser blocks it |
| `useKeyboard(actions)` | the deck's keys on the window, called by `Controls` (VueUse `onKeyStroke`); keys inside a text field or an element marked `data-ar-own-keys` (the presenter's duration editor) are left to it |
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
| `role` | string: `'audience'`, `'presenter'`, `'preview'`, `'export'` or `'thumbnail'` |
| `theme`, `themes`, `fullscreen`, `timer` | read-only refs, deeply (`themes.value`, `timer.value` cannot be edited in place) |
| `duration` | computed: the talk's length in effect, in ms, or null (the presenter's, else `Deck(duration)`) |
| `next()`, `prev()`, `go(i, step)` | moves |
| `titles()` | every slide's title, in order (`''` for one without): the controls' jump list |
| `setTheme(name)`, `toggleFullscreen()`, `openPresenter()` | actions; `setTheme` with a name not in `themes` warns and is ignored |

The face, and each stage's copy of it, is frozen: no component can reassign `go`, `setTheme` or
any other field. Internals stay off it: slide registration, sync, the export, and what changes the timer and
the length (`useTimer()`, state/timer.js: the presenter's bar uses it; not exported), and cycling
the theme (`useTheme()`, state/theme.js: the controls use it; not exported).
Frozen, Vue leaves it as it is inside `reactive()` or `data()`: its refs are not unwrapped there.

One rule for the preview (role `'preview'`, the presenter view's next step), and for a thumbnail
(role `'thumbnail'`): it is a copy, it cannot act. Every function of its face does nothing: `next`, `prev`, `go` (the stage is a follower,
state/stage.js) and `setTheme`, `toggleFullscreen`, `openPresenter` (useDeck() swaps them for
no-ops, state/deck.js). Its refs still read: its own position, the deck's theme, timer, duration
and fullscreen.

## CSS

Every component carries its own CSS, in the `<style>` block of its `.vue` file: the layout
components, `Img`, `Icon`, `Snippet`, `Slide` (its zones, its footer, the slide's content and the
layouts: `layout-cover`, `layout-section`, `layout-image-left`… are Slide's classes), the addons,
the views and their parts. Not scoped: a theme or a deck must be able to override any of it, so
the selectors are the `ar-` classes at the specificity they always had (zero, with `:where()`,
where a deck's own rule must win); they are hooks for that, not classes a deck writes. `Notes` has
none: its content is drawn, and styled, where it is teleported (the presenter's notes panel,
`PresenterView`; the export's notes pages, `ExportView`).

The layout components share one file, `layout/layout.css` (filling their container, the gap,
children clipped at their track), which each links as its first style block,
`<style src="./layout.css">` (the build keeps one copy), and add their own rules after it. They
do no layout in JavaScript: a component turns its props into private custom properties set inline
on its element (`--_ar-gap`, `--_ar-tracks`, `--_ar-cols`…), whose defaults its own rule declares
(so a piece inside another never inherits them), and its CSS lays it out; validation and its
warnings stay in JavaScript (`layout.js`). `Grid` with `ratio` counts its children for its
columns and rows, and centres an incomplete last row with an `::after` spacer before it.

`styles/` keeps what no component owns: `tokens.css` and `base.css`. `tokens.css` declares every
token the engine reads, with its default, and nowhere else is a default written: no component
holds a literal colour, font, font size, radius, shadow or duration (its header gives the rule for
what stays literal: structural values, proportions of a token, weights, a part's inner geometry).
The defaults sit at the root with zero specificity (`:where(:root)`), so they reach what is drawn
outside every theme (the presenter view, its notes, the deck list) and any rule of the project's
wins over them; an element that shows a theme apart from the one around it (a swatch of the theme
picker) carries `data-ar-theme-root` and takes the slide's colours as the root has them (the
defaults with the project's `:root` rules: private `--_ar-root-…` copies, resolved at the root),
not the theme it sits in. A token whose default is
another token cannot sit at the root (var() is resolved where it is declared: the root's
`--ar-muted` would stick to `--ar-footer-color` whatever the theme), so its default is resolved on
every element (`:where(*)`) into a private `--_ar-…` that the components read: the footer colour,
the table's border and head colour, the code highlight, the controls' accent (with a block of
its own for the docked controls, whose default is their text colour), the slide title's size,
colour and gap (one each for an `h1` and an `h2` title, and for the gap under a header band). `base.css` holds the page (`html`, `body`, `#app`), the viewport the audience and
export views share, and the classes `v-step` sets.

The library build concatenates it all into `dist/arao.css` in import order, and order decides
between two rules of the same specificity on the same element. `plugin.js` imports in that order
and its header says why: `tokens.css`; the views (through `Deck`); `Snippet` before `Slide` (a
Snippet in an image zone takes the zone's `flex`); `Img` before `Slide`; `Slide` before `Icon`
and the layout components (they keep their own `flex` in an image zone); `Img` before the layout
components (their children clip `overflow-x`); `base.css` last (its step fade wins over Snippet's
own transitions); the library build fails if `dist/arao.css` loses three of them (Snippet's
`flex`, the `overflow-x` of an `Img` in a layout piece, the step fade), or if it holds `layout.css`
more than once (a later copy would beat the pieces' own rules): `vite.config.js`, `CSS_ORDER` and
`CSS_ONCE`. `index.js` then adds the addons, `app.js` the deck
selector, and last the project's themes (`virtual:arao/theme-styles`), after all of the engine's
CSS; the library build fails if that import is not the entry's last, after `./arao.css`
(`vite.config.js`, `themeStylesError`).

## Themes

The `default` theme is the defaults in `tokens.css`, and has no file. A project's themes are the
CSS files directly in its themes folder (`src/themes`, the plugin's `themes` option), which the
Vite plugin turns into two virtual modules: `virtual:arao/theme-styles` imports them all (an eager
glob: Vite follows files added or removed), and `virtual:arao/themes` exports the names their
`[data-theme="<name>"]` selectors give, sorted (the plugin reads the files and the local partials
they `@import`, skips selectors inside `:not(…)`, resolves CSS escapes and warns about names with
white space; when an edit changes those names in the dev server, it reloads the module and the
page). `state/deck.js` resolves a deck's list: `Deck(:themes)` without the names that are no
theme (one warning), or, without it, `default` and then every project theme. A listed name the
plugin does not know is looked for in the page's stylesheets (`document.styleSheets`, their
grouping rules and `@import`s) before it is skipped: a theme the project imports itself, from
outside the themes folder, is worn when a deck lists it, and the export view, which checks
`--theme` against the same list, prints it. The library ships no theme and no `themes/` export.
The deck selector, like the presenter view, sits in no theme: it reads its `--ar-selector-*`
tokens at the root, and each cover wears its deck's theme.
