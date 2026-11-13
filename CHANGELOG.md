# Changelog

## [0.5.0](https://github.com/rubasace/araojs/compare/0.4.0...0.5.0) (2026-11-13)


### ⚠ BREAKING CHANGES

* **themes:** a deck without a themes list now offers the five built-in themes too (after default and the project's themes), and t goes through them. A project theme named aurora, carbon, folio, meridian or terminal now replaces the built-in theme of that name (Vite says so). Every build now fetches and ships the built-in themes' fonts (thirteen families, about 2.6 MB in assets/_fonts; a viewer downloads only those of the theme on screen): arao({ builtinThemes: false }), or the list of the ones the decks wear, keeps them out.
* **skill:** node_modules/araojs/AGENTS.md no longer exists; its content is the skill at node_modules/araojs/skills/arao/.
* digits no longer open the jump list; letter shortcuts now also act with Shift or Caps Lock.
* **themes:** a theme imported by hand (main.js, a deck's <style>, .scss) is no longer listable in Deck(:themes); put its folder or its package in arao({ themes }). A bare name in `themes` is a package; a folder at the root is written './themes'.
* Notes no longer takes `step`. Write one Notes per slide and put v-step on what shows from a later step: Notes(step="2") p … becomes p(v-step="2") … inside the slide's Notes.

### Features

* configurable shortcuts, invisible jump by slide number, first()/last() ([e1e087c](https://github.com/rubasace/araojs/commit/e1e087c67450a90a6966fe0d3a8d12973ce40b9e))
* **fonts:** fetch the web fonts themes name, with fontless ([f3f93db](https://github.com/rubasace/araojs/commit/f3f93dbe7e58c673486453f1b9c4488c0afc74bc))
* **fonts:** fetch the web fonts themes name, with fontless ([466ac95](https://github.com/rubasace/araojs/commit/466ac95195a63282b61d34108fe6b75e58cc558c))
* Notes draw themselves where notes are shown; their steps are v-steps ([57d42cc](https://github.com/rubasace/araojs/commit/57d42cc09fd69fb2632b556e8651673bd64e49cc))
* **skill:** an Arao skill for coding agents replaces AGENTS.md ([8ed6c4e](https://github.com/rubasace/araojs/commit/8ed6c4e610ceb30b3dcf1bc9539a6474a874a759))
* **themes:** the library ships its themes: default and five curated ones ([5cafa63](https://github.com/rubasace/araojs/commit/5cafa63848032f799cd55776af66bd4861c244c8))
* **themes:** themes come only from declared sources, folders or packages ([341be3b](https://github.com/rubasace/araojs/commit/341be3b722794691fd79f932ce95e53c1a14e10b))
* **tokens:** --ar-code-hl-bg, the code highlight's background ([07ad318](https://github.com/rubasace/araojs/commit/07ad318f28ffad4f80a908edac32e1df37a8a765))
* **tokens:** --ar-font-heading, the headings' own font ([3062107](https://github.com/rubasace/araojs/commit/30621072b9b6c50072f30882aa4d76f5590c9810))
* UI strings in the browser's language, English by default ([a956117](https://github.com/rubasace/araojs/commit/a956117d6f9d34e5586b56747cedde2d992cf9eb))
* UI strings in the browser's language, English by default ([79ca648](https://github.com/rubasace/araojs/commit/79ca648b4033289e5c5139b40df8f9e265d0559b)), closes [#36](https://github.com/rubasace/araojs/issues/36)


### Bug Fixes

* **fonts:** published types free of fontless's dependencies ([9e91771](https://github.com/rubasace/araojs/commit/9e91771cc9c94b3bbdbfc2ae51d8551d2b5ea3cd))
* **fonts:** weights 400-700, system fonts left alone, honest limits ([8b84421](https://github.com/rubasace/araojs/commit/8b84421097d20ac3afdb024daf2b8d49550ff508))
* **shortcuts:** check the project's file when Vite starts; review fixes ([c477351](https://github.com/rubasace/araojs/commit/c4773516611b0f0b0213fc7e8bd9ca4aa46d72d5))
* **skill:** review fixes; quirks-mode warning; font fetch failures non-fatal ([8863f7c](https://github.com/rubasace/araojs/commit/8863f7ce43a05642db034958b35aa5e85fbbb0c4))
* **snippet:** the window's name stays centred and clear of its lights ([ce7d4f3](https://github.com/rubasace/araojs/commit/ce7d4f378f0ff054759b7512a5263df487b66251))
* **themes:** real paths for linked packages, dedupe sources, stricter package rules ([46db987](https://github.com/rubasace/araojs/commit/46db9874249cd2a47ff9d02c385086c3d3342620))
* **types:** named arao export, public-only vite types, per-export type checks, unresolvable-import guard ([241a67c](https://github.com/rubasace/araojs/commit/241a67ccc307a58b980eb1a6d9c2cf9f3bbd5238))
* **types:** one self-contained declaration file per entry, typed global components, CI on the Node floors ([3c632a5](https://github.com/rubasace/araojs/commit/3c632a515e53efa9d65eabfd212b1c296eef38f8))
* **types:** self-contained declarations, typed global components, CI on the Node floors ([ec8500f](https://github.com/rubasace/araojs/commit/ec8500f5c1e7f29dfce44567c56510e0eba93666))


### Refactoring

* **controls:** useAutoHide replaces useMouseIdle ([4e5dd2b](https://github.com/rubasace/araojs/commit/4e5dd2b38bd174a1f7cd88a07cfb73763a0ff3a1))
* **controls:** useAutoHide replaces useMouseIdle ([4b328ca](https://github.com/rubasace/araojs/commit/4b328ca0d031127fd9b68b15ee53d50d5fe27be1))
* **layout:** CSS does the layout, helpers next to their components ([aafb4b6](https://github.com/rubasace/araojs/commit/aafb4b66e0a15ca1c396d82616015d5b8cbc04a0))
* **layout:** CSS does the layout, helpers next to their components ([ab0a500](https://github.com/rubasace/araojs/commit/ab0a500acba7024bbcba6dcc2877f15dfe61f75f))
* **shortcuts:** the deck's keys and touch in one place, turned on by Deck ([c6cd611](https://github.com/rubasace/araojs/commit/c6cd6110a2e7179bcb62fe797c25995807929afa))
* **shortcuts:** the deck's keys and touch in one place, turned on by Deck ([eb91262](https://github.com/rubasace/araojs/commit/eb91262638f119a36a50d12ae3aab912a88c1b51))
* the controls own their lists and the keys, the theme gets its own state ([9e34d6b](https://github.com/rubasace/araojs/commit/9e34d6be2f2794bfb2db88b1c7b6bafbc96bfee4))
* the controls own their lists and the keys, the theme gets its own state ([923400b](https://github.com/rubasace/araojs/commit/923400b721065365314a9fea266648a9f82ce1a5))
* the library in strict TypeScript ([2656a92](https://github.com/rubasace/araojs/commit/2656a9266d1ae573ec9049257de2eda25f8b2246))
* the library in strict TypeScript ([d8abbd1](https://github.com/rubasace/araojs/commit/d8abbd155cedf01ae0d702ee832887c598b3052f))
* **timer:** fold core/timer.js into state/timer.js ([3bd61cf](https://github.com/rubasace/araojs/commit/3bd61cf65ffe151c934f60327674b416647f1286))
* **timer:** fold core/timer.js into state/timer.js ([6af6fa2](https://github.com/rubasace/araojs/commit/6af6fa28f0698f188ae00ec5c5a5938204bf2aa6))
* **timer:** the talk's timer and its length get their own state ([336745e](https://github.com/rubasace/araojs/commit/336745e67e812953d63876d27160878afb4ca678))
* **timer:** the talk's timer and its length get their own state ([14c773f](https://github.com/rubasace/araojs/commit/14c773f12ea321994a6061bcb0d43663f4051188))
* views hold only screens, engine components go to components/internal ([d6c3da2](https://github.com/rubasace/araojs/commit/d6c3da2d7ee0139f67964bec5bfdf26774735d68))
* views hold only screens, engine components go to components/internal ([5383502](https://github.com/rubasace/araojs/commit/5383502ca84a758be263fe46cd323dd4142541d7))


### Documentation

* add the README's hero animation and the script that makes it ([a5d4db1](https://github.com/rubasace/araojs/commit/a5d4db145727eb3e1ffe335eeb92780340458e6d)), closes [#27](https://github.com/rubasace/araojs/issues/27)
* build a docs site from docs/ with VitePress ([bbf847f](https://github.com/rubasace/araojs/commit/bbf847f1c91e38efb266115a179586dd0c00f003)), closes [#27](https://github.com/rubasace/araojs/issues/27)
* coloured badge logos, feature pictures that fit ([21d3ef9](https://github.com/rubasace/araojs/commit/21d3ef985632be481415198fba8f25bd799b6b82))
* draw the docs' pictures from example decks ([67bd18f](https://github.com/rubasace/araojs/commit/67bd18f8566258cd24d6de1ac143dc0852240bb6)), closes [#27](https://github.com/rubasace/araojs/issues/27)
* **examples:** brand-coloured logos, two more themes and a small project of talks ([c41a5f9](https://github.com/rubasace/araojs/commit/c41a5f92dd45a973c60f12e0f2b56f99ee51e71c))
* feature GIFs in one light theme, roomier presenter view ([3c887d1](https://github.com/rubasace/araojs/commit/3c887d1732e443e564aab7bb4fb5e3fdbc023eb8))
* feature GIFs in the default theme, roomier presenter view ([6b25e48](https://github.com/rubasace/araojs/commit/6b25e489dcd30cbdce13ed1b8e4dd5be90297282))
* Getting started gains a coding-agent section; README's first steps are Getting started ([9d2ac5a](https://github.com/rubasace/araojs/commit/9d2ac5a328f5e9e00ee391e194ab88107475bcc6))
* Getting started with a coding-agent section ([613abba](https://github.com/rubasace/araojs/commit/613abbabe1c04ae05ac9806389ebe19879825c5e))
* hero GIF without steps ([6ac43b3](https://github.com/rubasace/araojs/commit/6ac43b389be72b2c82cbdc4fabc6a8a3d6ef6097))
* hero GIF without steps: the slide appears as it is typed ([478454f](https://github.com/rubasace/araojs/commit/478454fb1f4dd6f4f9d337ab8aa447cda834d191))
* new logo in the README header ([ac5ea04](https://github.com/rubasace/araojs/commit/ac5ea04ef653bbb22d42ae83d71741718889bf14))
* new logo: the guillemot alone, in the README header ([1e1ed2a](https://github.com/rubasace/araojs/commit/1e1ed2ab91c7ba55f45b1f4a1abd58b4c39ebbf5))
* README badges with coloured logos; feature pictures sized to fit GitHub's column ([def2269](https://github.com/rubasace/araojs/commit/def22698bd3d5a6342cbcdf697e4d622ac3f211f))
* README decks and agents features ([4c5e87b](https://github.com/rubasace/araojs/commit/4c5e87b4acd497345072b7055598502a12cd565b))
* README features, each with its own picture or GIF ([b7572e0](https://github.com/rubasace/araojs/commit/b7572e0e7744c5aec2d040a4953961c58457dec8))
* README features, each with its own picture or GIF ([8eccc86](https://github.com/rubasace/araojs/commit/8eccc8685c76701ac10d3356ff4990308ae7ad27))
* README keyboard feature: jump by number, search with g ([2dfd6f7](https://github.com/rubasace/araojs/commit/2dfd6f7dca049dc8c4a1042f40f3a9c12fd984b2))
* README keyboard: jump by number, search with g ([5d83c5c](https://github.com/rubasace/araojs/commit/5d83c5c78e77f135dbb24587501fde9a486dfb4d))
* README pictures in English, calmer colours ([0babee2](https://github.com/rubasace/araojs/commit/0babee2b8620f8f211ef7a4bb6718234d53d00f2))
* README pictures in English, calmer colours ([64c984e](https://github.com/rubasace/araojs/commit/64c984e386f53c6a5cbbcd0952972e5725ae5444)), closes [#27](https://github.com/rubasace/araojs/issues/27)
* README sells several talks in one project, and the agent row gets its picture ([607a240](https://github.com/rubasace/araojs/commit/607a24010242189e8071c31c39fec6809c08c6e9))
* README: why first, a cover to start, a features gallery, the stepped GIF back ([4c9df1d](https://github.com/rubasace/araojs/commit/4c9df1d71756891f3e2f1ffc1e0e4f7cb6a8cadb))
* README: why first, cover pair, features gallery, stepped GIF ([d0bf1c2](https://github.com/rubasace/araojs/commit/d0bf1c2581e7395ef51cfb4f4d2b1520090689da))
* restructure docs, slim visual README, docs site ([c84daea](https://github.com/rubasace/araojs/commit/c84daeaebb8b7211dea055b36f702cd4be0f0d97))
* simpler hero GIF ([53e7ea5](https://github.com/rubasace/araojs/commit/53e7ea5ebba73c2299aa70f431f21b85ada43aac))
* simpler hero GIF: typing and the live slide, default theme ([321fcc3](https://github.com/rubasace/araojs/commit/321fcc3ee5ce34e8c090630430cc7d5ce27b3a8c))
* **slide:** wrap the centred-body comment ([c70247f](https://github.com/rubasace/araojs/commit/c70247f49d609cc910fdb0415cb9e8e6ad4d7ad5))
* slim, visual README ([426c309](https://github.com/rubasace/araojs/commit/426c309a462827c8388406082c3ef994c62f9c30)), closes [#27](https://github.com/rubasace/araojs/issues/27)
* split the reference into a tutorial, guides and reference pages ([ca03c6e](https://github.com/rubasace/araojs/commit/ca03c6e0751e37c8c0872aabd1f84fd22b52a766)), closes [#27](https://github.com/rubasace/araojs/issues/27)

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
