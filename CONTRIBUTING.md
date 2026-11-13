# Contributing to Arao

How to work on Arao itself: the library, its tests, its docs and its releases. To write decks
with it, start at the [docs](docs/index.md); how the engine is built is in
[docs/architecture.md](docs/architecture.md).

## Development

Node 20.19 or newer.

| Script | What it does |
|---|---|
| `npm run dev` | the playground, on the library's source, on 127.0.0.1:5173 (`ARAO_PUBLIC_HOST` allows a tunnel host) |
| `npm run build` | the library into `dist/`: `index.js` (ESM, imports its CSS) and `arao.css`; also run by `npm pack` / `npm publish` |
| `npm run smoke [-- <file.tgz>]` | the packaged-consumer smoke test (below) |
| `npm run docs:dev` / `npm run docs:build` | the docs site (VitePress on `docs/`), live or built into `docs/.vitepress/dist` with an `llms.txt` |
| `npm run shots` | the screenshots of `docs/examples/` into `docs/assets/shots/`, and their source into the `<!-- example:… -->` blocks of the README and the guides |
| `npm run hero-gif` | `docs/assets/hero.gif`, the README's animation |

## Repository layout

```
src/
  index.js          what 'araojs' exports (the only barrel: every other module imports a file)
  plugin.js         the Vue plugin: global components and directives, the global CSS (in CSS order)
  app.js            createDeckApp
  state/            the deck, its stages, its slides, the talk's timer: createDeck/useDeck, createStage/useStage, createSlide/useSlide, createTimer/useTimer
  composables/      the effects (internal): useDeckSync, usePresenterWindow, useKeyboard, useTouchNav, useMouseIdle, useFullscreen
  core/             plain modules: sync, exporter, image, icons, flip
  views/            full screens: AudienceView, PresenterView, ExportView; DeckSelectorView (createDeckApp's list of decks)
  components/       what authors write: Deck, Slide, Img, Icon, Snippet, Notes; layout/: Cols, Rows, Grid, Center, layout.js (their props' parsers), layout.css
    internal/       the engine's components, which no author names: Stage (the scaled canvas), Controls, PresenterBar, Thumbnail, DeckCover (a deck's cover in the list)
  directives/       v-step and v-step-from (step.js)
  addons/           ProgressBar, SlideNumber: things drawn over every slide
  styles/           only what is global: tokens.css (every token and its default: the default theme),
                    base.css (page, viewport, steps); every component brings its own CSS in its .vue file
vite/               the Vite plugin (araojs/vite; icons.js resolves the icons)
bin/                the arao command (arao export)
playground/         a tiny slides project on the library's source, for developing it
scripts/            smoke.mjs (the smoke test), shots.mjs and hero-gif.mjs (the docs' pictures)
docs/               the user docs (shipped in the package, and the source of the docs site):
  index.md          their map; getting-started.md, guide/, reference/
  architecture.md   how the engine is built: folders, views, provide/inject, useDeck's face
  examples/         small decks behind the docs' pictures (with their snippets and theme)
  assets/           the pictures: shots/ (npm run shots), hero.gif (npm run hero-gif)
  .vitepress/       the docs site's config (its cache and build are not committed)
dist/               the build (npm run build): index.js, arao.css
```

## Docs

The docs are plain Markdown that reads the same on GitHub, raw from `node_modules/araojs/docs`
and on the docs site: relative `.md` links, GitHub alerts (`> [!NOTE]`), no VitePress-only
syntax. They follow a light [Diátaxis](https://diataxis.fr/): a tutorial
(`getting-started.md`), guides (how to do something, with examples) and a reference (every prop,
slot, token, option and URL). Each fact has one home; other pages link to it.

The pictures come from real decks, so code and picture never drift:

- `docs/examples/<name>.vue` is a small deck (one slide), with its snippets in
  `docs/examples/snippets/` and its themes in `docs/examples/themes/`. A comment
  `<!-- shots: 2 3 -->` at its top names the steps to capture (default: its last step); the last
  one is `<name>.png`, the others `<name>-<step>.png`.
- `<!-- example:<name> -->…<!-- /example -->` in the README or a docs page is filled with that
  example's source (`<name>` may also be a file of `docs/examples/` with its extension, such as
  `themes/ocean.css`).
- `npm run shots` (and `npm run hero-gif`) run on demand, not in CI: after changing an example,
  an engine change that shows on them, or the default theme, run them and commit the result.
  They drive Chromium through `playwright-core` like the smoke test (below), and `hero-gif` needs
  `ffmpeg` on the `PATH` (or `FFMPEG=/path/to/ffmpeg`).

The site deploys to GitHub Pages from `main` (`.github/workflows/docs.yml`), once Pages is set to
"GitHub Actions" in the repository's settings.

## Smoke test

`scripts/smoke.mjs` checks the package the way a user gets it. It packs the library (or takes the
tarball it is given), installs it into a new slides project in a temporary folder with the
playground's decks, images and snippets, a theme of its own in `src/themes` (with a second one in a
partial it `@import`s; its `src/main.js` imports no theme), and four tiny decks of its own: the
second with a duration and a list of themes, the third with neither, the fourth with a file name
and a cover heading far too long for a card (listing that theme first), the fifth listing first a
theme from outside `src/themes`, declared in its own `<style>`. Then it:

1. runs `vite build`, which must also write `dist/404.html`, a copy of `dist/index.html`;
2. opens every deck at its path under the dev server (Vue's own warnings only show up in dev) and
   under `vite preview`, and walks each one with ArrowRight to its last step. Any console warning
   or error, any page error, or a deck with no slides fails the test;
3. opens `/` under both servers: it must list every deck, each card with its cover drawn in it,
   its title the file name in words (written out in the test) from the list's first render, and
   the same once the covers are in, the second and the fourth deck's cover heading under its
   title, its path shown as its link's (decoded), every card as tall as the others, its title,
   cover heading and path on one line each (the fourth deck's cut), each cover in its deck's first
   theme (the fifth's from outside `src/themes`, the others' discovered), and the page's URL
   untouched;
   each link must open its deck (the first one followed with the keyboard) and keep the page's
   query, and the covers stay covers on `/?presenter`; `?deck=<name>` must move to `/<name>`
   keeping the rest of the query and the hash; an unknown path, and an unknown `?deck=`, must show
   the list with a notice and one warning;
4. checks `useDeck()` on the second deck, under the dev server: the object is frozen, writes
   through its refs change nothing, `setTheme` of a name the deck has not gives one `[arao]`
   warning, and in the presenter view's preview no function acts; and the themes, on the third
   deck: it lists `default` and the project's two themes, `t` and `?theme=` wear the first, the
   defaults reach the presenter view (outside every theme), and a `:root` rule of the project's
   wins over a default (`default`'s swatch shows it, and `--ar-controls-accent` reaches the
   docked controls) while a theme wins over that rule; the fifth deck wears its theme from outside
   `src/themes` with no warning;
5. changes the talk's duration in the presenter view of the second deck (`duration="15m"`), under
   the dev server: `1h30` typed with real keys moves no slide and opens no jump menu, the
   countdown follows and an audience window gets it; after an apply or `Esc` from the keyboard,
   `Space` and `→` move the slides; an invalid value and one outside 1 minute – 24 hours show
   their error; no key moves the slides with the focus on the field's button, and `Tab` out of
   the field closes it; an open field follows a change made in another presenter window (or keeps
   typed text) and says so; a reload keeps the duration, a new audience window takes it, and going
   back restores the deck's 15:00 everywhere. On the third deck (no duration), one set adds the
   countdown and going back removes it;
6. presses `p` on the second deck under the dev server: the presenter window must open at
   `/<second>?presenter` and move with the audience's window, either way, while a window of the
   other deck stays put;
7. opens the second deck at `/<second>#/2/1`, under the dev server, and `/` in another window of
   the same browser, then reloads `/`: the deck's window must keep its hash and its timer;
8. rewrites the project's `vite.config.js` and `src/main.js` for createDeckApp's other cases,
   under the dev server. On a decks folder holding one deck: it opens at `/` and at its path,
   and windows at `/` and `/<second>` move together, either way, `/` staying `/` (`p` there
   opens `/<second>?presenter`); `createDeckApp({ deckList: 'always' })` lists it at `/`, with
   its cover; `createDeckApp({ deckList: 'sometimes' })` opens it, with one `[arao]` warning. On a
   decks folder holding a deck that lists a theme there is not before the project's, and one that
   lists no theme there is: `/` lists them with no warning, their covers in the project's theme
   and in `default`, and each opens in that theme with one `[arao]` warning. On a decks folder
   of 14 decks, at 390x844: the covers far
   below the screen are not drawn until scrolled to, a deck that throws as it is drawn shows "Sin
   vista previa" (one `[arao]` warning), and `/café` is shown as such;
9. runs `<bin> export` with no `--deck` and checks one PDF per deck at its default name, each with
   as many pages (counted in the PDF itself) as steps, as its summary line says and as the walk
   counted, plus the total line (the fifth deck's line says it is printed in its theme from outside
   `src/themes`); then `<bin> export --deck <name> --per-slide`, whose PDF must have as many
   pages as slides;
10. runs `<bin> export --deck <other> --url` against `vite preview`: with a deck's own URL it must
   warn, naming the base meant, and then fail on the deck printed; with a URL under which the
   second deck opens, it must fail on the deck printed, with no warning; both exit 1 and write
   nothing;
11. builds the project under a sub-path (`base: '/sub/'`): `dist/404.html` again; under `vite
   preview` the list at `/sub/` (the same checks as in 3), a deck at `/sub/<name>`, and
   `<bin> export --deck <name>` printing it;
12. runs the CLI's other cases on small decks folders of their own, into `--out <folder>`:
   `--url` at a site built under a base named like one of its decks (`/talks/`, a deck `Talks`),
   which warns and exports every deck; `--theme` over a deck that lists it and one that falls back
   (a symlinked deck, next to a dotfile that must not count), a theme no deck lists (exit 1,
   nothing written), a deck that throws at runtime (the others exported, exit 1), and decks that
   resolve to the same file (the second fails), and `--theme` with a theme from outside
   `src/themes` (in the deck's `<style>`) over a deck that lists it.

The package name and the CLI's name come from `package.json`. CI runs it on every pull request and
on every push to `main`. To run it locally:

```bash
npx playwright-core install chromium   # once; or ARAO_CHROMIUM=/path/to/chrome
npm run smoke                          # or: node scripts/smoke.mjs path/to/package.tgz
```

It needs network access (`npm install`). Anything Chromium needs on your machine (shared
libraries through `LD_LIBRARY_PATH`, `FONTCONFIG_FILE`) is passed through to the browser.
`SMOKE_KEEP=1` keeps the temporary project and prints its path.

## Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please) and
npm trusted publishing (`.github/workflows/release-please.yml`):

1. Commit to `main` using [Conventional Commits](https://www.conventionalcommits.org/):
   `feat:` (minor while below 1.0), `fix:`, `perf:`, `refactor:` and `docs:` (patch), and `feat!:`
   or `BREAKING CHANGE:` (minor while below 1.0). `ci:`, `chore:`, `test:` and similar don't
   trigger a release.
2. On every push to `main`, release-please opens or updates a release pull request that bumps
   `package.json` and `.release-please-manifest.json` and writes `CHANGELOG.md`.
3. Merging that pull request tags the version (`0.3.1`, no `v`, like the existing tags) and
   creates the GitHub release.
4. The `publish` job in the same workflow builds the package and runs `npm stage publish`. It
   authenticates through OIDC, so there is no npm token. npm adds provenance on its own when the
   repository is public.
5. The version waits in npm's staging queue until the owner approves it with 2FA, on npmjs.com or
   with `npm stage approve`. Nothing goes live without that approval.

The release pull request is opened with `GITHUB_TOKEN`, and GitHub doesn't start other workflows
for events made with that token. As a result, CI doesn't run on the release PR by itself. To get
CI on it, give the action a fine-grained PAT or a GitHub App token through its `token` input.

One-time setup by the owner:

- **GitHub**: Settings → Actions → General → Workflow permissions: select "Read and write
  permissions" and tick "Allow GitHub Actions to create and approve pull requests".
- **npm**: the package (published as `araojs`) has to exist on npmjs.com first. Then, under the
  package's Settings → Trusted publisher → GitHub Actions, set organization or user `rubasace`,
  repository `araojs`, workflow filename `release-please.yml`, and leave the environment empty.
  Under "Allowed actions", keep only `npm stage publish` (the default): CI stages, the owner
  approves. Every field is case-sensitive. If you rename the package or the repository, update the
  trusted publisher and `repository.url` in `package.json` too: they have to match.
