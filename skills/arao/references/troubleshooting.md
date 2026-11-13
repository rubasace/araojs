# Troubleshooting and gotchas

## Contents

- Props and attributes
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
- Props that take text, or a number written as text, are plain: `gap="sm"`, `ratio="2 1"`,
  `cols="3"`, `file="App.java"`, `bg-opacity="0.25"`, `Icon(size="64")`.

## Pictures and icons

- **`Img` has no size of its own.** It fills the box its container gives it (the space under the
  title, a column, a cell, a zone, `Center`) and fits the picture inside; in a plain block it is
  as wide as the block. Fixed size: a class with both sizes,
  `.avatar { flex: none; width: 320px; height: 320px; }`.
- Pictures are named, never imported: `Img(file="team.jpg")` and `Slide(bg="team.jpg")` read
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

- **The body is centred, but what fills stays full height.** `Img`, `Snippet`, an element with
  `flex: 1`, `Grid` (its rows are `1fr`) and pieces holding any of those fill the body; `Cols` of
  plain content shrinks to its content and is centred (`Cols(align="stretch")` keeps full-height
  columns).
- `.collapse` steps re-centre the body as they come and go: use plain `v-step` (keeps its space)
  when the rest must not move.
- **The footer takes the bottom margin.** On slides that show it, the body ends where the footer
  band begins (88 px from the bottom by default). `cover` and `section` hide it unless
  `:footer="true"`; `Slide(:footer="false")` hides it on one slide. With a footer, prefer
  `{{ number }} / {{ total }}` inside it to `SlideNumber`.
- Content overflows the slide: split it (one idea per slide), reveal with steps, or use
  `Slide(align="start")` for a long list. Don't shrink fonts with `%`, `vw` or media queries.
- Snippet highlights don't accumulate: each step shows only its own rules; step 1 is always plain.

## Titles, covers and the deck list

- **Headings inside `#background` are ignored for the slide's title** (jump menu, presenter, notes
  pages). Put the heading in the content, or use `Slide(title="…")`.
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
| `[arao] src/shortcuts.ts: …` (Vite stops) | reserved key, unknown command or duplicate key | see [shortcuts.md](shortcuts.md) |

Don't edit `node_modules/araojs` to make a deck look right: an engine change belongs in Arao's
own repository.
