# Arao documentation

Arao (the `araojs` package) is a slide library for technical talks on Vue 3 + Vite: a deck is a
Vue file, slides are components, and every slide is drawn on one fixed canvas, the same on every
screen and in the PDF.

**New here?** [Getting started](getting-started.md) takes you from an empty folder to a deck on
the screen and in a PDF.

## Guides

How to do things, with examples.

| Page | What it covers |
|---|---|
| [Concepts](guide/concepts.md) | the canvas, decks and slides, zones, steps, themes, Pug or HTML |
| [The project](guide/project.md) | the folders, the scripts, `createDeckApp`, the list of decks |
| [Slides and layouts](guide/slides-and-layouts.md) | layouts, the header, body and footer zones, lists and tables |
| [Steps](guide/steps.md) | revealing a slide bit by bit, reusable steps |
| [Composition](guide/composition.md) | `Cols`, `Rows`, `Grid`, `Center` |
| [Code](guide/code.md) | `Snippet`: the code window and its highlights per step |
| [Images and backgrounds](guide/images-and-backgrounds.md) | `Img`, slide backgrounds |
| [Icons](guide/icons.md) | `Icon`: sets, how they get into the build, licences |
| [Presenting](guide/presenting.md) | keys, controls, speaker notes, the presenter view and its timer |
| [Themes](guide/themes.md) | writing a theme, where themes are found, how tokens apply |
| [Export to PDF](guide/export.md) | `arao export`, export mode, printing |
| [Hosting](guide/hosting.md) | serving a built project, under any path |
| [Extending](guide/extending.md) | your own components and addons, `useDeck`, `useSlide` |

## Reference

Every prop, slot, token, option and URL, exactly.

| Page | What it lists |
|---|---|
| [Components](reference/components.md) | `Deck`, `Slide`, `Cols`, `Rows`, `Grid`, `Center`, `Img`, `Icon`, `Snippet`, `Notes`, the addons, utility classes |
| [Directives](reference/directives.md) | `v-step`, `v-step-from` |
| [Composables](reference/composables.md) | `useDeck()`, `useSlide()` |
| [Theme tokens](reference/theme-tokens.md) | every `--ar-*` token and its default |
| [Vite plugin](reference/vite-plugin.md) | `arao()` and its options |
| [CLI](reference/cli.md) | `arao export` and its options |
| [URLs](reference/urls.md) | paths, query parameters and the hash |

## Elsewhere

- [AGENTS.md](../AGENTS.md): the guide for AI agents writing decks (rules, gotchas, recipes, how
  to verify a deck). In a slides project it is at `node_modules/araojs/AGENTS.md`.
- [Architecture](architecture.md): how the engine is built, for whoever works on Arao itself.
- [CONTRIBUTING.md](../CONTRIBUTING.md): developing, testing and releasing Arao.
- [examples/](examples/): the small decks behind the pictures in these pages.
- [playground/](../playground/): a tiny slides project on the library's source.
