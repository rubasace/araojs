# Export to PDF

`arao export` prints every deck of the project to PDF, one page per step (or per slide), text
kept as text, with optional notes pages. In a slides project (`"export": "arao export"` in its
scripts; `npx arao export …` works too):

```bash
npx playwright-core install chromium      # once: the Chromium that playwright-core drives
npm run export                            # every deck: exports/<deck>.pdf each
npm run export -- --deck mytalk           # exports/mytalk.pdf
npm run export -- --deck mytalk --theme acme --per-slide --notes --out talk.pdf
```

The command builds the project (with its own Vite config, base included) into a temporary
folder, serves it, opens each deck at `/<deck>?export` in headless Chromium and prints it, one
deck after the other, with one summary line per PDF. `ARAO_CHROMIUM=/path/to/chrome` uses a
browser you already have. Every option and what happens on errors: [CLI](../reference/cli.md).

Opening `/<deck>?export` in a normal browser and printing to PDF gives the same pages.

## Export mode

`?export` on a deck's URL (`/talk?export`) renders the deck as a book of pages for printing: no
controls, no keyboard, no transitions, no sync with other windows; `useDeck().role` is `'export'`.

| Parameter | Effect |
|---|---|
| `export` | one page per step of every slide |
| `per-slide` | one page per slide instead, each at its **last** step (everything revealed, last snippet highlight); `v-step.only` content of earlier steps is not on it |
| `per-step` | one page per step: the default, accepted and ignored (`per-step=0` does not make it per slide; only `per-slide` does, and wins if both are given) |
| `notes` | after the page(s) of a slide with notes, a white page with its notes |
| `theme=<name>` | must be one of the deck's `themes`, else an error |

A flag set to `0`, `false`, `no` or `off` counts as unset. Every page is exactly the canvas size.

## Late content

The export waits for elements with the attribute `data-ar-busy` inside the slide
(or in addons) before copying each page, up to 15 s. Snippet and Img set it while loading. A
component that loads something may do the same:

```pug
div(:data-ar-busy="loading ? '' : undefined")
```

A named value (Img uses its URL) is given up on once, for all later pages; an empty value is
waited for on every page. When done, `window.__araoReady` is
`{ pages, slides, steps, width, height, missing, stalled, theme }` or `{ error }`; for a theme the
deck does not list, `{ error, code: 'theme-not-listed', themes }`.

## Printing

Printing goes through Chromium's print path; the deck on screen is untouched.

The book works around what
Chromium prints differently from what it shows:

- A page prints in one piece (`contain: size` on `.ar-page`). Otherwise Chromium splits whatever is
  laid out across the bottom edge of a page that has a page after it, clipped or not, and prints the
  part above the break as a box of its own: no bottom border, no rounded bottom corners, percentages
  of its height taken from that part. A ring placed with `top: 50%; transform: translateY(-50%)`
  (its box, before the transform, reaches past the bottom) printed as an arch on every page but the
  last.
- Blurred `box-shadow`s (outer and inset) are drawn on a canvas and painted as the element's
  `border-image`, outset over the shadow: Chromium prints a blurred shadow as a soft mask of the
  graphics state, which macOS Preview and Quick Look ignore, drawing the shadow's whole box as a
  solid square of its colour (pdf.js, PDFium/Chrome and MuPDF draw it right). A picture with
  transparency every reader draws. Same place, transforms, opacity and clipping as the shadow; a
  visible solid border is drawn into the picture too. Left as Chromium prints them: elements with a
  `border-image` of their own, a border that is not `solid` in one colour, a `filter`, and inline or
  table-part boxes.
- Pictures with a `filter` of blur and colour functions (`Img(blur)`, `Slide(bg-blur)` on a picture)
  are drawn with that filter on a canvas, fitted by `object-fit`/`object-position`, and printed
  unfiltered: Chromium blurs only what is inside the clip, so the soft edge of the blur showed inside
  the box (a dark frame around a blurred background). Left as Chromium prints them: pictures from
  another origin without CORS (a canvas cannot read them), `drop-shadow()` and `url()` filters.

Known limitation: a **blurred `text-shadow`** still prints as a soft mask, so macOS Preview and Quick
Look draw a solid box of the shadow's colour behind the text. Use a `text-shadow` without blur, or
`filter: drop-shadow(0 8px 20px …)` on the element instead of the `text-shadow`: Chromium prints a
filtered element as a picture with transparency, which every reader draws (its text is then part of
that picture, not selectable).

> [!WARNING]
> Pages are static DOM copies: canvas/WebGL drawings, video frames, iframes, shadow DOM and
> `url(#id)` references (ids repeat) are not printed faithfully.
