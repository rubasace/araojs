# Changelog

## [0.4.0](https://github.com/rubasace/araojs/compare/0.3.0...0.4.0) (2026-11-13)


### ⚠ BREAKING CHANGES

* **themes:** araojs/themes/vigojug.css (and the ./themes/* export) no longer exists. A project whose decks list 'vigojug' copies that file into its src/themes; any other theme file of the project goes in src/themes too (or the themes option points at its folder), and the imports of theme CSS in src/main.js can go. A deck's themes list may only name 'default' and the themes found there: any other name is skipped with a warning (it used to be applied, unstyled).
* **tokens:** the default theme looks like vigojug (it was dark, Inter, an orange accent and a dark code window), and so does any theme where it leaves a token unset; araojs/themes/default.css no longer exists: drop its import. A theme that relied on the former defaults sets them itself: --ar-letterbox: #000, --ar-text-base: 40px, --ar-pad: 96px 120px, --ar-code-theme: material-theme-darker, --ar-code-size: 44px, --ar-code-bg: #2b2b2b, --ar-code-bar: #383a40, --ar-code-fg: #eeffff, --ar-code-muted: #8a8f98, --ar-code-title: rgba(255, 255, 255, .92), --ar-code-radius: 22px (and, where it did not set them, the former default theme's --ar-bg: #0f1115, --ar-fg: #e8e8ea, --ar-muted: #9aa0a6, --ar-accent: #ff6a3d, --ar-accent-fg: #0f1115, --ar-font-sans: "Inter", system-ui, sans-serif, --ar-font-mono: "JetBrains Mono", ui-monospace, monospace, --ar-title: 88px, --ar-radius: 16px).
* **tokens:** the undocumented --c-* and --p-* custom properties of the controls and the presenter view are gone; set the --ar-controls-* and --ar-presenter-* tokens instead.
* **selector:** createDeckApp({ deck }) and the createDeckApp('name') shorthand are removed (an unknown option now warns and is ignored): link to /<name> instead. Deck URLs are paths (/<name>, /<name>?presenter, /<name>?export); ?deck=<name> is still accepted and redirected. Whatever serves a build must answer a deck's path with index.html: the build's 404.html covers GitHub Pages and similar hosts.
* **export:** arao export without --deck exports every deck instead of the first by name; ?export and arao export print one page per step instead of one per slide (use ?export&per-slide / --per-slide for the old output); default file names drop the -steps suffix and mark per-slide exports with -slides (exports/<deck>[-<theme>][-slides][-notes].pdf).
* the package is now araojs (was phoenyxjs): import from 'araojs', 'araojs/vite', 'araojs/themes/*.css' and 'araojs/style.css' (dist/arao.css). The Vite plugin is arao() (default export of araojs/vite; the named export phoenyx is now arao) and registers as 'arao'. The CLI is arao (arao export). Virtual modules virtual:phoenyx/* are virtual:arao/*. CSS classes ph-* are ar-*, theme tokens --ph-* are --ar-*, data attributes data-ph-* are data-ar-*. Console messages use the [arao] prefix, the export ready flag is window.__araoReady, and the environment variables are ARAO_PUBLIC_HOST and ARAO_CHROMIUM (were PHOENYX_*). The presenter window name, the sync channel and sessionStorage keys use arao.

### Features

* deck selector when a project has several decks ([adbdc3a](https://github.com/rubasace/araojs/commit/adbdc3a136b037922f994f57f181ea3cd790c98c))
* deck selector when a project has several decks ([a0bcecb](https://github.com/rubasace/araojs/commit/a0bcecb58afc27271bfb72db4992f1805dcce8c9)), closes [#25](https://github.com/rubasace/araojs/issues/25)
* **export:** export every deck and one page per step by default ([0302020](https://github.com/rubasace/araojs/commit/0302020cb3aad23ab0252140c72f4f195abfcc59))
* **presenter:** edit the talk's duration live ([f633c28](https://github.com/rubasace/araojs/commit/f633c2848808af80fbb09c2dba7c17c932fd2cde))
* **presenter:** edit the talk's duration live ([edc53a4](https://github.com/rubasace/araojs/commit/edc53a4dcbc7744e2700ee1c1c3937b170a183a7)), closes [#24](https://github.com/rubasace/araojs/issues/24)
* **selector:** decks as paths and a grid with cover previews ([e839937](https://github.com/rubasace/araojs/commit/e839937f8a6ac1026a9d74bbb4840d223b783828))
* **themes:** the project's themes are discovered in src/themes, and vigojug leaves the package ([af0828f](https://github.com/rubasace/araojs/commit/af0828f5e96aecf1ab5606d88938720109fe6a0f))


### Bug Fixes

* **deck:** a frozen, read-only useDeck(); setTheme only of the deck's themes; an inert preview ([d879ca6](https://github.com/rubasace/araojs/commit/d879ca62724f3b3598b90faa31c671a726e1252c))
* **deck:** fullscreen as on main: any element counts, f leaves it, standard API ([a81bbab](https://github.com/rubasace/araojs/commit/a81bbabd54ca1ede3041dd011b546b3cd24eaa7c))
* **export:** a --url ending in a deck's name warns and goes on; the selector's checks can fail ([7bd5624](https://github.com/rubasace/araojs/commit/7bd5624241f3912ce1c0576582ecee15a14cf0a0))
* **export:** one owner for the deck list, no output collisions, per-deck failures ([4731c56](https://github.com/rubasace/araojs/commit/4731c568bd43f556aae35be99a9e121e643972c3))
* **presenter:** duration editor keys, focus, stale values and bounds ([c49e134](https://github.com/rubasace/araojs/commit/c49e1348085332bfe9ad30095379bce357f47e4b))
* **selector:** createDeckApp options, query forwarding, sorting and lang ([553d7aa](https://github.com/rubasace/araojs/commit/553d7aaf2b76c04ecff87841b51ded8627db72fa))
* **selector:** one deck per export, / and /&lt;name&gt; in step, stable card titles ([ccb628d](https://github.com/rubasace/araojs/commit/ccb628d12e6e7d5d624f4d0ff628af6b3060fd03))
* **themes:** a listed theme whose rule a loaded stylesheet declares is worn, and exported ([646c3c3](https://github.com/rubasace/araojs/commit/646c3c3bb4090534db2c5a09dbdb2c8e4a6e770b))
* **themes:** theme names skip :not(), read CSS escapes and keep white space out; local [@import](https://github.com/import) partials are followed ([a83b739](https://github.com/rubasace/araojs/commit/a83b73953431c0eddb3b4c29b72887a9809ee176))
* **tokens:** :root overrides reach the docked controls' accent, default's swatch and the presenter shadow ([483747a](https://github.com/rubasace/araojs/commit/483747a3e1175f9426a8cc2fe684c1f5c9ca790c))
* **touch:** read swipes from pointer events again, so a pen swipes as on main ([22b6ee1](https://github.com/rubasace/araojs/commit/22b6ee1c2a0858ac4033f1dca05e3a1739e596af))
* **vite:** prebundle @vueuse/core with the engine's other npm imports ([6201046](https://github.com/rubasace/araojs/commit/6201046206945a99c5e6150e65b8fcd03225a221))


### Refactoring

* **components:** Cols, Rows, Grid and Center as SFCs; their props' parsers in core/layout.js ([6b9300d](https://github.com/rubasace/araojs/commit/6b9300d31ddc9f62767e746b573cdde66fc62307))
* composables on VueUse (useEventListener, useFullscreen, onKeyStroke, useSwipe) ([da1aee1](https://github.com/rubasace/araojs/commit/da1aee162f417a4079ee1a3da1666df6838ce7b6))
* **css:** every component carries its own CSS; styles/ keeps tokens.css and base.css ([7c9459c](https://github.com/rubasace/araojs/commit/7c9459c31b60530368f530aa74d0fe72ca1d74e4))
* **css:** the token defaults gathered in tokens.css ([d2c6ea0](https://github.com/rubasace/araojs/commit/d2c6ea0c2f340f45c9f687e68e19faa149a342d2))
* **deck:** a per-Deck context for its controls and presenter view ([ae6420f](https://github.com/rubasace/araojs/commit/ae6420f2210c89f1014e07a06d6131c4d4d4ce18))
* **deck:** split Deck.vue into composables ([695eafe](https://github.com/rubasace/araojs/commit/695eafeb46162f5db01611ab4ddb55740ac3aacb))
* folders by role, composables and a per-Deck context ([5f09b22](https://github.com/rubasace/araojs/commit/5f09b22a4ba2dc4401cac83b1292dd0e33509a89))
* folders by role, one barrel ([e86eda9](https://github.com/rubasace/araojs/commit/e86eda9d79c87b560470c6fe695b648faa5dd453))
* layout components as SFCs, CSS with each component ([c175112](https://github.com/rubasace/araojs/commit/c175112170bad9ead4c06380c66e8171115133ef))
* rename Phoenyx to Arao (package araojs) ([63825ca](https://github.com/rubasace/araojs/commit/63825caed30d208959d584f5ab4836ca6986474d))
* **selector:** its CSS as [#33](https://github.com/rubasace/araojs/issues/33) writes a component's: one ar- class a rule, states in :where(), a private palette ([4e69316](https://github.com/rubasace/araojs/commit/4e693162afeb960354016c20b5791ba823d1fb8a))
* state, views and composables (agreed architecture) ([0c72343](https://github.com/rubasace/araojs/commit/0c723432c9452176dacfbad39d0a387085a351fc))
* state, views and parts for the deck (createDeck, createStage, createSlide) ([66b9b36](https://github.com/rubasace/araojs/commit/66b9b3662ff299f346edf4094c7358f09424bf50))
* **tokens:** every value the engine draws with is a token, declared once in tokens.css ([95f2d9e](https://github.com/rubasace/araojs/commit/95f2d9eea1a5025ddd836fb62c9c40919c4107d7))
* **tokens:** the deck selector's palette and type are tokens ([b19e4c7](https://github.com/rubasace/araojs/commit/b19e4c7ff9f07a3c78dfaeb96729b9927ea54ee2))
* **tokens:** the defaults take the vigojug look, and default is a theme without a file ([90b6a97](https://github.com/rubasace/araojs/commit/90b6a97c045e912020c8605f37ea962ec389fac9))


### Documentation

* Apache-2.0 license and a rewritten README ([b70332c](https://github.com/rubasace/araojs/commit/b70332c1c6b1e0964f8c2218816a20c8df916daa))
* architecture.md, useDeck's new fields and the new file paths ([7ac753c](https://github.com/rubasace/araojs/commit/7ac753caac705372e9637cbb56245502c5bb47f2))
* DeckSelector in views/, in architecture.md and the README's layout ([391ebbe](https://github.com/rubasace/araojs/commit/391ebbeb09c5cc827988345b543be3460374a6e6))
* license under Apache-2.0 ([d961c8c](https://github.com/rubasace/araojs/commit/d961c8c503eee8ecf9baed6e8b5611e1a1aa3042))
* **readme:** header, badges and a rewritten README ([fc310db](https://github.com/rubasace/araojs/commit/fc310db6164613d4c893699f301d0e91240fce6b))
* smoke test, releasing and one-time owner setup ([22d04f9](https://github.com/rubasace/araojs/commit/22d04f9ea96ae316d456c372d32558cb6c93d546))
* the CSS with each component, in architecture.md, the README and the reference ([a642a5d](https://github.com/rubasace/araojs/commit/a642a5d5623252febb3d23e160dd3625ec4aa3fe))
* themes as the defaults plus the project's src/themes, and every token with its default ([c3ae10e](https://github.com/rubasace/araojs/commit/c3ae10eb1245fc1effd0a872a1d2ee1066102bf9))
* trusted publisher for araojs with release-please.yml ([022befe](https://github.com/rubasace/araojs/commit/022befef13fd11fe06043f0ae8fd08f7d94de881))
* where themes can come from, theme-name rules, and the theme styles guard ([8de6ebb](https://github.com/rubasace/araojs/commit/8de6ebb2018f55a43aaf65404ff9c4065f003b90))
