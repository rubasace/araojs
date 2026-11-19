# Troubleshooting and gotchas

## Contents

- Props and attributes
- Decks written for an older Arao
- Pictures and icons
- Layout surprises
- Titles, covers and the deck list
- Themes and fonts
- Warnings and what they mean

## Props and attributes

- **A plain attribute is a string; a `:`-bound one is JavaScript.** Numbers, booleans, arrays
  and objects need the colon: `:size="36"`, `:line-numbers="false"`, `:themes="['default']"`,
  `:highlights='{ "2-3": 2 }'` (JSON in single quotes). Without it, `size="36"` is the string
  `"36"` and `line-numbers="false"` the string `"false"`: Vue warns and the line numbers stay.
- Props that take text, or a number written as text, are plain: `gap="sm"`, `Cols(ratio="2 1")`,
  `cols="3"`, `file="App.java"`, `Background(opacity="0.25")`, `Icon(size="64")`.

## Decks written for an older Arao

`Slide` has one prop, `layout`. What a deck for araojs 0.4 or older wrote:
- **A removed prop is silently an HTML attribute on the slide**, no warning: `title`, `align`,
  `footer`, `ratio`, `bg`, `bg-opacity`, `bg-position`, `bg-blur`, `bg-fit` do nothing (a
  `title` even shows as a tooltip). `check-deck.mjs` reports them as "removed Slide API". Fix:
  - `title="…"` → drop it; the slide's first heading names it.
  - `align="start"` → drop it (the default now); `align="center"` → `Slide.center`
    (it centres the text too); `align="end"` → `Slide.bottom`.
  - `:footer="false"` → `Slide.no-footer`; `:footer="true"` → `Slide.with-footer`.
  - `ratio="3 2"` → `columns="3fr 2fr"`, the layout's parameter (`image-left`, `image-right`,
    `split`: `--ar-layout-<layout>-columns`).
  - `bg="city.jpg" bg-opacity="0.4"` → `Background(src="city.jpg" opacity="0.4")` inside the
    slide (`position`, `blur`, `fit` likewise); `bg="#1d2b4a"` or a gradient →
    `style="background: …"` on the slide.
- **A leftover `template(#background)` renders as a zone** (`.ar-zone-background`, in the flow,
  under the body) instead of behind the slide: put its content in a `Background`.
- **Slides start at the top now.** The body sits right under the title on every slide (it used to
  be centred): `Slide.center` centres one, or a theme sets `--ar-body-align: center`.
- `layout="two-cols"` is gone: use `Cols` or `layout="split"`.
- **`split` has no `#left`/`#right` now** (they render below the body, and fail `vue-tsc`): its
  sides are the body's two children, a `div` each, each starting with its `h3` if it has one. A
  lead line under the title is its subtitle: an `h3` right after the `h2`.
- **An `h1` title looks like an `h2` one now**: the title's look is the tokens' and the layout's,
  never the tag's (`h1` on a cover or a section, `h2` elsewhere). A bigger title on one slide:
  `style="--ar-title-size: 80px"`. An `h3` right after the title is its subtitle (muted, smaller):
  to have it as a heading of the body, put something before it.
- A theme's `--ar-layout-cover-title` / `--ar-layout-section-title` does nothing now: they are
  `--ar-layout-cover-title-size` / `--ar-layout-section-title-size` (`title-size` on the slide).
- A hand-written `declare module 'araojs' { interface SlideLayouts { wide: true } }` fails the type
  check now: it is `interface ProjectLayouts { wide: {} }`. A generated `src/arao-layouts.d.ts`
  of an older Arao is rewritten the next time Vite starts.
- A theme's `--ar-image-inset` does nothing now: it is `--ar-layout-image-left-inset` and
  `--ar-layout-image-right-inset`, one per layout.
- A theme's `--ar-pad` does nothing now: it is two tokens, `--ar-pad-y` (top and bottom) and
  `--ar-pad-x` (both sides). The bottom padding is always at least `--ar-footer-height`.
- `.center` on a block used to set `text-align: center` only; it now also centres the block's
  content vertically when the block is taller than it (`align-content`), and on a `Slide` it
  centres the body both ways. For the old effect alone, `style="text-align: center"`.

## Pictures and icons

- **`Img` has no size of its own.** It fills the box its container gives it (the space under the
  title, a column, a cell, a zone, `Center`) and fits the picture inside; in a plain block it is
  as wide as the block. Fixed size: a class with both sizes,
  `.avatar { flex: none; width: 320px; height: 320px; }`.
- Pictures are named, never imported: `Img(file="team.jpg")` and `Background(src="team.jpg")` read
  `src/images/` (subfolders ok, case-sensitive). A missing file warns `[arao]`.
- **Icon names must be written out in the source.** The build includes only the icons whose full
  name (`lucide:rocket`) appears in `src/`, in a template or in data (`{ icon: 'lucide:rocket' }`
  with `Icon(:name="it.icon")` is fine). A name put together at runtime (`` `lucide:${kind}` ``)
  is not: it shows a dashed box and warns. List such names in the source, or in
  `arao({ icons: [...] })` in `vite.config.js`.
- Lucide and Simple Icons come with the package; another set needs
  `npm install -D @iconify-json/<prefix>`. Names: icon-sets.iconify.design, lucide.dev,
  simpleicons.org. Don't put icon files in `src/images/` or paste SVG into a deck. More:
  `docs/guide/icons.md`.

## Layout surprises

- **What fills stays full height, whatever the body's placement.** `Img`, `Snippet`, an element
  with `flex: 1`, `Grid` (its rows are `1fr`) and pieces holding any of those fill the body;
  `Cols` of plain content is as tall as its content (`Cols(align="stretch")` keeps full-height
  columns), so `.center` on the slide centres it.
- `.collapse` steps in a `.center` slide re-centre the body as they come and go: use plain
  `v-step` (keeps its space) when the rest must not move.
- **The footer sits in the bottom margin.** Where it shows, that margin is at least the band's
  height, so the content never runs under it. `cover` and `section` hide it (their layout's
  token); `.no-footer` hides it on one slide, `.with-footer` shows it. In `image-left`/`image-right` it shows over the
  picture. With a footer, prefer `{{ number }} / {{ total }}` inside it to `SlideNumber`.
- Content overflows the slide: split it (one idea per slide) or reveal with steps. Don't shrink
  fonts with `%`, `vw` or media queries.
- **A `layout` with no CSS is the default layout**, silently: a typo (`layout="covr"`, `"Cover"`: names are case-sensitive)
  or a project layout whose file is not `src/layouts/<name>.css`. Vite warns about a layout file
  that names no `.layout-<name>`. In a TypeScript project, `vue-tsc` turns such a name down (in
  Pug templates only with `@vue/language-plugin-pug` in the `tsconfig`'s
  `vueCompilerOptions.plugins`); a project layout it does not know means a stale or missing
  `src/arao-layouts.d.ts`: run `npm run dev` or `npm run build` once to write it.
- **A named template that shows in the wrong place** (under the body, or in a grid cell): it is
  not one of the layout's zones, which only its CSS places (`npx arao layouts` lists each
  layout's zones); in a TypeScript project `vue-tsc` turns it down, and `check-deck.mjs` warns.
  When a theme or the deck's CSS places it on purpose (`.layout-split > .ar-zone-caption`), declare
  it for the type check (the warnings table, below).
- **A layout parameter that does nothing**: it is another layout's (`columns` on a `cover`), so it
  lands on the slide as a plain HTML attribute; or the value is no valid CSS for its token. A
  slide's own `style` setting the same token loses to the attribute.
- Snippet highlights don't accumulate: each step shows only its own rules; step 1 is always plain.

## Titles, covers and the deck list

- **The slide's name (jump menu, presenter, notes pages) is its first heading**, never one inside a
  `Background` or the footer. A slide with no heading has no name: give it one.
- A content slide with something before its heading (a kicker line) has no header: use
  `template(#title)`.
- **The list of decks (`/`) draws each deck's cover.** Its card is titled by the file name in
  words (`my-talk.vue` → "My talk"), with the cover's `h1` under it. A deck's code that runs when
  it mounts runs there too: anything that plays or fetches checks `useDeck().role`
  (`'thumbnail'` in the list; `onMounted(() => deck.role === 'audience' && video.value.play())`).

## Themes and fonts

- A theme name in `Deck(:themes)` that no source gives is skipped with an `[arao]` warning: check
  the selector `[data-theme="<name>"]` and that its folder or package is in `arao({ themes })`.
- Theme CSS imported by hand is not a theme a deck can wear. See [themes-and-fonts.md](themes-and-fonts.md).
- A web font not showing: the first build needs the network; a font no provider has needs its own
  `@font-face`; `--ar-ui-font` is never fetched.

## Warnings and what they mean

| Message | Cause | Fix |
|---|---|---|
| `[Vue warn]: Invalid prop: type check failed …` | a number/boolean/array written without `:` | `:size="36"`, `:line-numbers="false"` |
| `[Vue warn]: Invalid prop: custom validator check failed …` | a value the prop doesn't take (`gap="huge"`, `fit="fill"`) | see the prop in `docs/reference/components.md` |
| `[arao] … not found` (image, snippet) | wrong file name or folder, or case | names are relative to `src/images/` / `src/snippets/`, case-sensitive |
| `[arao]` icon warning, dashed box | icon name not written out, or set not installed | write the full name in the source; install `@iconify-json/<prefix>` |
| `[arao] v-step outside a Slide` / `Notes outside a Slide` | directive or notes outside any `Slide` | move it inside the slide |
| `[arao] Deck themes: no theme …` | theme name no source gives | fix the name or add its source |
| `[arao] … duration …` | `Deck(duration)` not a length | `duration="30m"`, `"1h30"`, `"45:00"` |
| `[arao] src/layouts/x.css: --ar-layout-x-title is no attribute of Slide…` | a layout token named as an attribute a slide already has (`title`, `id`…) or not lower-case kebab-case | rename it (`--ar-layout-x-title-size`); until then it works in `style` and themes only |
| `[arao] src/layouts/x.css: @param y names no token …` (or another doc block problem) | the layout's doc block describes a token its CSS does not read, has an unknown tag, a zone twice, or no first line | fix the doc block (or the token's name); `npx arao layouts` lists each layout's problems |
| `Property 'image' does not exist on type '{ default?: SlideSlot …` (`vue-tsc`, the editor) | a named template that is not a zone of the slide's layout | use the layout's zones (`npx arao layouts`); in a project layout, declare it in its doc block (`@zone image …`); a zone a theme or the deck's CSS places on a library layout: declare it in a `.d.ts` of the project, the layout's own zones restated: `declare module 'araojs' { interface ProjectLayoutZones { split: { left: true; right: true; caption: true } } }` |
| `[arao] src/shortcuts.ts: …` (Vite stops) | reserved key, unknown command or duplicate key | see [shortcuts.md](shortcuts.md) |

Don't edit `node_modules/araojs` to make a deck look right: an engine change belongs in Arao's
own repository.
