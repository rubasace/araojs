# URLs

A deck is a path; how it shows is the query; where it stands is the hash:
`/framework?presenter#/12/3`.

| Part | Example | Effect |
|---|---|---|
| path | `/framework` | the deck file in the decks folder (`src/decks/Framework.vue`; case-insensitive), the first path segment after the app's base. `/` (the base) → the list of decks, or the project's only deck (`createDeckApp`'s `deckList`); a name that is no deck → the list, with a notice and a console warning. The list's links keep the page's query (`theme`, `presenter`, `export`…) |
| `theme` | `?theme=acme` | the theme; also keeps this window's theme when it joins other windows |
| `presenter` | `?presenter` | the presenter view |
| `export` | `?export` | export mode (wins over `presenter`); `export=0\|false\|no\|off` = off |
| `per-slide` | `?export&per-slide` | export: one page per slide, each at its last step (default: one per step) |
| `per-step` | `?export&per-step` | export: one page per step (the default) |
| `notes` | `?export&notes` | export: notes pages |
| hash | `#/12/3` | slide 12, step 3 (1-based); kept up to date while presenting |

- The address bar always shows a deck's path in one form, without reloading: `/Framework/` and
  `/framework/anything` become `/framework`, the query and the hash kept. Every window of a deck
  (audience, presenter) then has the same path, which is what keeps them in step (and keeps two
  decks apart).
- `?deck=framework`, the URL of Arao before 0.4, still opens the deck: the address bar turns it
  into `/framework`, keeping the rest of the query and the hash (`/?deck=framework&theme=x#/3` →
  `/framework?theme=x#/3`).
- Under a base (Vite's `base: '/talks/'`) every path is under it: `/talks/` is the list,
  `/talks/framework` the deck. With a relative base (`base: './'`) the base is the page's folder,
  so the deck must be the last segment of the path (`…/framework`, no trailing slash).
- `index.html` as the first segment is the base itself (the list).

How a server or a static host must answer these paths: [Hosting](../guide/hosting.md).
