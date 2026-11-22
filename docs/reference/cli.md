# CLI

The `arao` command, run in the slides project (its folder is the current directory): `arao export`
prints decks to PDF, `arao layouts` lists the layouts a slide can name, each with its doc, then the
utility classes. Each
command reads the project the way its build does: its Vite config, and the options it gives the
`arao()` plugin (its folders, its layouts folder among them). `arao --help` lists the commands,
`arao <command> --help` a command's options.

## arao export

Prints decks to PDF. With `"export": "arao export"` in the project's scripts, `npm run export -- …`
(`npx arao export …` works too). A walkthrough: [Export to PDF](../guide/export.md).

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

### Behaviour

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

## arao layouts

Lists every layout a slide of the project can name, with what each one says of itself: what it is
for, an example, its zones and its parameters, each described; then the
[utility classes](components.md#utility-classes), by group, each described. For a person by
default; `--json` for a program, an agent learning the project's layouts and classes without
reading their CSS.

```
npx arao layouts [--json]
```

| Option | Meaning |
|---|---|
| `--json` | the same as JSON (below) |
| `-h`, `--help` | print the usage and exit; an unknown option prints the error and the usage, and exits with code 1 |

The layouts, in this order: `default` (a `Slide` without a layout), the library's (those a project
file replaces left out), then every file of the project's layouts folder (`src/layouts`, or the
plugin's `layouts` option), each by name; a file whose name is no layout's is listed too, saying
that no slide can name it. Each one's description, example, zones and parameter
descriptions come from the doc block its file starts with
([Its doc block](../guide/slides-and-layouts.md#its-doc-block)); its parameters are the tokens its
CSS reads, its zones its `@zone` tags and the `.ar-zone-<name>` its CSS styles. A project layout
says so, and whether it replaces the library's of its name; one with no doc block says that. A
project layout's problems are listed with it: what its doc block gets wrong (a `@param` naming no
token, an unknown tag…), a token that is no attribute, a name that is no layout's, a file that
styles no slide (the warnings the Vite plugin gives). It reads the files and writes nothing; it exits with 0 whatever the
problems (1 only when the project's Vite config cannot be loaded or has no `arao()` plugin).
What the project's Vite config prints as it loads goes to stderr, so stdout holds the command's
output alone (the JSON, with `--json`).

```
quote (project, src/layouts/quote.css)
  One big quote, centred on the slide, its author under it.
  The quote is a `blockquote`, opened by a mark in the accent; whatever follows it (its author, a
  source) sits under it. The deck's footer is hidden.

  Example:
    Slide(layout="quote" size="72px")
      blockquote Simplicity is prerequisite for reliability.
      p.muted Edsger W. Dijkstra

  Zones: none
  Parameters:
    footer  the deck's footer: `none` hides it, `flex` shows it (default `none`)
    mark    the opening mark's colour (default `--ar-accent`)
    size    the quote's size (default .8 x `--ar-title`)
```

After the layouts, a block per group of utility classes (`Placement`, `Alignment`, `Spacing`,
`Size`, `Colour and marks`, `On a Slide`): what they do, an example, and each class described. They
are the library's, read from the doc comments of its stylesheet (`src/styles/utilities.css` in the
package); a project adds none.

`--json` prints one object, `{ "version": "…", "layouts": [ … ], "classGroups": [ … ] }`:
`version` is the araojs that printed it; `classGroups` a member per group, in the order above,
`{ "name", "summary", "description", "example", "classes": [{ "name", "description" }] }` (a class
two groups document, as `center` on a block and on a `Slide`, is in each of them; within a group no
name repeats); and `layouts` a member per layout in the same order as above:

| Field | Value |
|---|---|
| `name` | what `Slide(layout)` names |
| `source` | `"engine"` (`default`), `"library"` or `"project"` |
| `file` | its CSS file: a path from the project's folder, or an absolute one outside it; `null` for `default` |
| `replaces` | `true` for a project layout named like a library one |
| `validName` | `false` for a file whose name is no layout's (letters, digits, `-` and `_`): loaded, but no slide can name it |
| `documented` | whether its file has a doc block |
| `summary`, `description` | its first line, and the lines after it (line breaks kept); `""` when none |
| `example` | its `@example`, Pug, as written; `""` when none |
| `zones` | `[{ "name", "description" }]`: its named templates, `template(#<name>)` |
| `params` | `[{ "name", "token", "description", "values" }]`: its attributes (`name`, as written in a template), the token each sets, and what it takes as its doc block lists it (`{a\|b\|0..1}`: words, and ranges of numbers written `from..to`; `overlay`'s `position` takes its nine places, its `scrim` `["0..1", "none"]`), `[]` when it takes any value |
| `problems` | strings, what its file gets wrong (a project layout's) |
