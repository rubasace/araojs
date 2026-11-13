# CLI: arao export

The `arao` command prints decks to PDF. Run it in the slides project (its folder is the current
directory); with `"export": "arao export"` in its scripts, `npm run export -- …` (`npx arao export …`
works too). A walkthrough: [Export to PDF](../guide/export.md).

```
arao export [--deck <name>] [--theme <name>] [--per-slide | --per-step] [--notes] [--out <path>] [--url <url>]
```

| Option | Meaning |
|---|---|
| `--deck <name>` | just this deck of the decks folder, `src/decks` (default: every deck, one PDF each) |
| `--theme <name>` | one of the deck's themes (default its first); with several decks, only the decks that list it use it |
| `--per-slide` | one page per slide, each at its last step, instead of one per step |
| `--per-step` | one page per step: the default, still accepted (not together with `--per-slide`) |
| `--notes` | a page with the speaker notes after each slide that has them |
| `--out <path>` | output file or folder (default `exports/<deck>[-<theme>][-slides][-notes].pdf`); with several decks always a folder (a path ending in `.pdf` is an error) |
| `--url <url>` | print from a running server instead of building: the site's URL, its base (`http://127.0.0.1:5173/`, or `…/talks/` under a base) |
| `-h`, `--help` | print the usage and exit; an unknown option prints the error and the usage, and exits with code 1 |

## Behaviour

Without `--deck`, **every deck** of the decks folder, one
PDF each, in name order; `--deck <name>` exports that one. Builds the project once with its own
Vite config to a temp folder, serves it with `vite preview` (under the config's `base`), prints
each deck's `/<deck>?export` with one headless Chromium, checks each page count, writes each PDF
atomically. One page per step by default; `--per-slide` gives one per slide (`--per-step` is
accepted, and is an error together with `--per-slide`). Default output
`exports/<deck>[-<theme>][-slides][-notes].pdf` (before 0.4 the default was per slide and
`-steps` marked a per-step file; now `-slides` marks a per-slide one); an `--out` that is a
folder (exists, or ends in `/`) gets that name inside. With several decks `--out` is always a
folder, and a path ending in `.pdf` is an error. Output: one summary line per PDF (`<path>: <n>
pages (<s> slides, <t> steps), <w>x<h> px, theme <name>`) and, with several decks, a total
(`<n> of <m> decks exported, <p> pages[; failed: …]`). A build error stops the run; a deck that
fails once the site is up (it does not render, throws before its pages are ready, crashes its
page, cannot be printed or written) is reported and the others still export; the exit code is 1
if any failed. The decks are the plugin's (the same `*.vue` the app lists: symlinks included,
dotfiles not). Two decks never write the same file in one run: the second fails instead (names
that differ only in case, which also open as one deck and are warned about; or `Alpha` with
`--theme acme` and a deck `alpha-acme` in its first theme). `--theme` with several decks:
the decks that list it are printed in it, then the others in their first theme (their summary
line says so and their file name has no theme); a theme no deck lists is an error and nothing is
written; with `--deck`, a theme the deck does not list is an error. Chromium:
`npx playwright-core install chromium`, or `ARAO_CHROMIUM=/path/to/chrome`. Missing pictures
print as placeholders and are listed.

- `--url <url>`: no build and no server of its own; prints from the server already running at
  that URL, the site's base (`npm run dev`: `http://127.0.0.1:5173/`; under a base,
  `http://127.0.0.1:5173/talks/`). Each deck opens at `<url><deck>?export…`: the URL's own
  query and hash are dropped, and its path is taken as a folder (`/talks` is `/talks/`). The decks (the `--deck` name, or every
  deck) are still read from the project's decks folder before anything opens, so the server must
  serve the same decks. A URL whose path ends in a deck's name gets a warning, naming the base it
  would mean, and the export goes on. Either it is a deck's own URL
  (`http://127.0.0.1:5173/renovate`), under which every deck opens as that one, so every other
  deck fails, writing nothing (next point); or it is a base named like one of the decks
  (`http://127.0.0.1:5173/renovate/`, a site under `base: '/renovate/'` with a deck
  `renovate`), and the export runs as under any other base.
- Whatever the URL, a PDF is written only of the deck asked for: the export page says which deck
  it printed, and a different one (a URL under which another deck opens) fails that deck, writing
  nothing; so does a page that shows the list of decks. An app shell of your own does not say
  which deck it printed: the CLI warns once that it cannot check.

Pages are 1920x1080 px (1440x810 pt) with the default canvas: every page is exactly the canvas
size.
