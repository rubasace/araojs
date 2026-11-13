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
| `components/` | what deck authors write | `Deck`, `Slide`, `Img`, `Icon`, `Snippet`, `Notes`; `internal/` holds the engine's own components, which no author names: `Stage` (the scaled canvas), `Controls`, `PresenterBar`, `Thumbnail` (a deck drawn as its cover) and `DeckCover` (a cover in the list); `layout/` holds the layout components (`Cols`, `Rows`, `Grid`, `Center`), the parsers of their props (`layout.ts`: ratio, gap, grid shape; Slide's zones use it too) and the CSS they share (`layout.css`), `directives/` holds `v-step` and `v-step-from` |
| `addons/` | drawn over every slide | `ProgressBar`, `SlideNumber` |
| `i18n/` | the UI's words | the engine's own text, one catalogue per language (`en.ts`, `es.ts`, `de.ts`, `fr.ts`, `it.ts`, `pl.ts`, `ja.ts`, `zh-Hans.ts`), and `i18n.ts`, the lookup: `t(key, ...values)` and `lang` ([Interface language](#interface-language)) |
| `env.d.ts` | types | the shapes of the virtual modules the Vite plugin gives the engine (`virtual:arao/decks`, `…/images`, `…/themes`…) |
| `styles/` | CSS | only what is global: `tokens.css` (every token and its default: the `default` theme), `base.css` (the page, the viewport, the steps). Everything else comes with its component ([CSS](#css)); no theme ships with the engine ([Themes](#themes)) |

The rule: `components/` is what an author names or imports (registered by `plugin.ts` or exported
by `index.ts`, explicitly, never by folder); `components/internal/` is the engine's components that
no author names; `views/` is full screens.

The engine is strict TypeScript. Each `state/` pair names its public face as an interface
(`DeckFace`, `SlideControls`, `TimerControls`, `ThemeControls`), its refs read-only, and keys its
provide/inject with an `InjectionKey`, so a component that injects it gets its type. The
package ships `.d.ts` files for what `index.ts` exports and for the Vite plugin
(`dist/types/`, built from `tsconfig.build.json`); `vite/` and `bin/`, which Node runs unbuilt,
stay JavaScript with JSDoc types, checked by `npm run typecheck`.

`index.ts` is the only barrel (the public API); every other module imports the file it uses.
`plugin.ts` is the Vue plugin, `app.ts` is `createDeckApp`: it renders the deck the URL's path
names (the first segment after Vite's base), or `views/DeckSelectorView.vue` (a plain page, outside
every `Deck`) when there is no deck to open. It is the one place that reads the path: it puts the
URL in its one form first (`?deck=x` → `/x`, `/X/` → `/x`, with `history.replaceState`), and
tells the deck which one it is (`provideDeckRoute(app, { name, path })`, state/deck.ts): its file
name and its path as the list writes it. The sync key and the presenter window's URL use that path,
not the address bar's, so a project's only deck, which opens at `/` and stays `/` there, is one
deck with its `/<name>` windows; the export view reports the name, which the CLI checks. An app of
its own (`createApp(MyApp).use(Arao)`) provides no route: then `location.pathname`, and no name.

## Views

`Deck.vue` makes the deck (`createDeck(props)`), turns its shortcuts on (`useShortcuts(deck)`)
and shows one view, by the URL. The shortcuts call the deck directly, as its buttons do: keys move
it, cycle the theme, toggle fullscreen and open the presenter window; touch (the audience view's
viewport) moves it. Only the audience and presenter views have them. The controls keep their own
keys (`g`, a digit, `Escape`: their lists), and the middle tap (their auto-hide).

```
Deck.vue ── createDeck(props) ── state/deck.ts: stage(s), fullscreen, URL hash, sync
   │  └ useShortcuts(deck) ── composables/useShortcuts.ts: keys, touch → the deck (audience, presenter)
                                   └ createTheme ── state/theme.ts: the deck's themes, the one it wears, ?theme=
                                   └ createTimer ── state/timer.ts: the timer, the talk's length, and their pure helpers (parseDuration, clock…)
   │
   ├─ thumbnail ───────▶ Thumbnail       Stage (role 'thumbnail', standing at the cover)
   ├─ ?export ─────────▶ ExportView      Stage (role 'export')            → core/exporter.ts book
   ├─ ?presenter ──────▶ PresenterView   PresenterBar
   │                                     Stage (role 'presenter')  + Controls (docked)
   │                                     Stage (role 'preview', one step ahead) + notes
   └─ (default) ───────▶ AudienceView    Stage (role 'audience')   + Controls (auto-hide) + blocked-window notice
                                         cursor auto-hide (its viewport is where the shortcuts read touch)
```

`?export` wins over `?presenter`. Each `Stage` (components/internal/Stage.vue) draws the deck's default
slot on the scaled canvas, so the presenter view mounts every slide twice. The presenter window
listens to no mouse or touch of its own.

Thumbnail mode is not read from the URL: a `Deck` is a thumbnail when something above it called
`provideThumbnail({ title })` (state/deck.ts). `DeckCover` does, once per card of the list, and
then renders the deck's `.vue` file inside it (lazily, when the card nears the viewport). The
deck reads nothing of the URL (its theme is the first of its list, resolved as any deck's:
`default` when it names no theme), its stage is a follower that stands at slide 1, step 1, and it
skips every effect: no hash route, no sync, no keys, no presenter window, no duration or themes
warning; its face's actions are the preview's no-ops. Its slides other than the cover
register (so the order is known) but draw no content (`drawn`, state/slide.ts), so a card mounts
one slide's pictures and snippets, not the deck's. The deck fills `title` with its cover's first
heading (else its title prop), which the card shows under the deck's title (its file name in words).

## Interface language

Every word the engine itself shows (titles, aria-labels, placeholders, the toast, the presenter
view, the list of decks, the notes pages' heads and step labels) comes from `t(key, ...values)`
(`i18n/i18n.ts`), never from a literal in a component. The language is picked once, when the
module loads, from `navigator.languages`: the first with a catalogue (matched by its language
subtag; Chinese by its script, so `zh-CN` is `zh-Hans` and `zh-TW` is skipped), else English. No
option, no switcher, no reactivity. A catalogue is a plain object: a string per key, or a
function of the message's values (word order and plurals are the language's own). English
(`en.ts`) is the reference: a key missing elsewhere would fall back to it unseen, so the library
build fails when a catalogue lacks one of its keys, has one it has not, or has a string where it
has a function (`vite.config.js`, `catalogueError`); the types say the same: every catalogue
`satisfies Catalogue`, the type of `en.ts`, and `t()` takes only its keys, with the values each
message takes. The engine's UI says its language (`lang`
on the controls, the presenter view, the toast, the list of decks), and gives back the page's
(`document.documentElement.lang`) to what is the deck's inside it: the slides, the notes, the
titles. The notes pages' step labels are CSS (`content`): ExportView sets the message's parts
before and after the number as private custom properties (`--_ar-from-step-before`…).

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
pass what their parts need as props (the controls' `docked`/`auto-hide`, the
bar's `title`). The controls read the slides' titles (`useDeck().titles()`) and the themes
(`useTheme()`) themselves; which list is open and what is typed in it are their own. No view
exposes anything, and `Deck` holds no ref to its view. `v-step` finds its slide through the DOM
(`data-ar-slide`, a map in directives/step.ts).

## Composables

| Composable | Effect |
|---|---|
| `useDeckSync(stage, …)` | every window of the deck in step through core/sync.ts: position, theme, timer, the duration set in the presenter view (the last two kept through a reload) |
| `usePresenterWindow()` | opens the presenter window or brings it forward; `blocked` when the browser blocks it |
| `useShortcuts(deck)` | the deck's shortcuts, called by `Deck.vue` (audience and presenter only): the key map (next, previous, Home, End, `t` theme, `f` fullscreen, `p` presenter but in the presenter view) and, in the audience view, edge taps and swipes, all calling the deck directly |
| `useKeyboard(handlers)` | key → handler on the window (VueUse `onKeyStroke`), with the rules every key of the deck keeps: keys inside a text field or an element marked `data-ar-own-keys` (the presenter's duration editor) are left to it, so are Ctrl/Cmd/Alt + key, a focused button keeps Space and Enter. Used by `useShortcuts` and `Controls` (`g`, digits, `Escape`) |
| `useTouchGestures(el, { tap, swipe })` | taps, by zone (left quarter, right quarter, middle), and swipes, from pointer events: touch and pen (VueUse's `useSwipe` reads touch events only, so the pen would lose its swipes). Used by `useShortcuts` (edges, swipes) and `useAutoHide` (the middle) |
| `useAutoHide({ after, tap })` | `visible`: shown on a mouse move, hidden after `after` ms without one; optionally a tap in the middle shows it for `tap` ms or hides it; ignores a tap's echo mousemove. The controls' auto-hide and the audience view's cursor (VueUse's `useIdle` counts keys too, with a fixed timeout and no tap) |
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
the length (`useTimer()`, state/timer.ts: the presenter's bar uses it; not exported), and cycling
the theme (`useTheme()`, state/theme.ts: the controls use it; not exported).
Frozen, Vue leaves it as it is inside `reactive()` or `data()`: its refs are not unwrapped there.

One rule for the preview (role `'preview'`, the presenter view's next step), and for a thumbnail
(role `'thumbnail'`): it is a copy, it cannot act. Every function of its face does nothing: `next`, `prev`, `go` (the stage is a follower,
state/stage.ts) and `setTheme`, `toggleFullscreen`, `openPresenter` (useDeck() swaps them for
no-ops, state/deck.ts). Its refs still read: its own position, the deck's theme, timer, duration
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
warnings stay in JavaScript (`layout.ts`). `Grid` with `ratio` counts its children for its
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
between two rules of the same specificity on the same element. `plugin.ts` imports in that order
and its header says why: `tokens.css`; the views (through `Deck`); `Snippet` before `Slide` (a
Snippet in an image zone takes the zone's `flex`); `Img` before `Slide`; `Slide` before `Icon`
and the layout components (they keep their own `flex` in an image zone); `Img` before the layout
components (their children clip `overflow-x`); `base.css` last (its step fade wins over Snippet's
own transitions); the library build fails if `dist/arao.css` loses three of them (Snippet's
`flex`, the `overflow-x` of an `Img` in a layout piece, the step fade), or if it holds `layout.css`
more than once (a later copy would beat the pieces' own rules): `vite.config.js`, `CSS_ORDER` and
`CSS_ONCE`. `index.ts` then adds the addons, `app.ts` the deck
selector, and last the project's themes (`virtual:arao/theme-styles`), after all of the engine's
CSS; the library build fails if that import is not the entry's last, after `./arao.css`
(`vite.config.js`, `themeStylesError`).

## Themes

The `default` theme is the defaults in `tokens.css`, and has no file. The other themes are the
CSS files directly in the folders of the theme sources (the plugin's `themes` option: folders and
installed packages, in order; default `src/themes`), which the Vite plugin turns into two virtual
modules: `virtual:arao/theme-styles` imports them all, source after source (an eager glob per
folder: Vite follows files added or removed), and `virtual:arao/themes` exports the names their
`[data-theme="<name>"]` selectors give, sorted (the plugin reads the files and the local partials
they `@import`, skips selectors inside `:not(…)`, resolves CSS escapes and warns about names with
white space; when an edit changes those names in the dev server, it reloads the module and the
page), source after source, each name once (a name a later source gives again warns). A package
source is resolved at config time (node_modules, from the root up; its `themes/` folder or the
one its `package.json` names under `"arao"`), and one not installed or giving no theme stops
Vite. `state/theme.ts` resolves a deck's list: `Deck(:themes)` without the names that are no
theme (one warning), or, without it, `default` and then every theme the sources give. Nothing
is read from the page's stylesheets: a name the plugin does not know is no theme, and the export
view, which checks `--theme` against the same list, refuses it. The library ships no theme and
no `themes/` export.
The deck selector, like the presenter view, sits in no theme: it reads its `--ar-selector-*`
tokens at the root, and each cover wears its deck's theme.
