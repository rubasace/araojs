# Composables

`useDeck()` and `useSlide()`, imported from `'araojs'` in a component's `<script setup>`. How to
use them in your own components and addons: [Extending](../guide/extending.md).

## useDeck()

For components inside `Deck` (addons, or anything in a slide) to read where the deck is and move
it. Throws outside a `Deck`.

```js
import { useDeck } from 'araojs'
const deck = useDeck()
```

| Field | Type | Meaning |
|---|---|---|
| `index` | readonly ref, Number | current slide, **0-based** |
| `step` | readonly ref, Number | current step of that slide, 1-based |
| `total` | computed, Number | number of slides |
| `steps` | computed, Number | steps of the current slide |
| `progress` | computed, 0..1 | position over every step of the deck |
| `theme` | readonly ref, String | current theme name |
| `themes` | readonly ref, Array of strings | the deck's themes: its `themes` prop (names that are no theme left out), or every theme there is |
| `fullscreen` | readonly ref, Boolean | the window is fullscreen (whatever element is: `f` then leaves it) |
| `timer` | readonly ref, Object | the talk's timer: `{ state: 'idle' \| 'running' \| 'paused', acc, since }` (ms counted before `since`, and when it last started running) |
| `duration` | computed, Number or `null` | the talk's length in effect, in ms: the one set in the presenter view, else `Deck(duration)`; `null` when there is none |
| `next()`, `prev()` | functions | move one step |
| `go(i, step = 1)` | function | go to slide `i` (0-based) at `step` (clamped; `Infinity` = last step); out-of-range `i` is ignored |
| `titles()` | function | every slide's title, in order (`''` for a slide without one): what the jump list (`g`) shows |
| `setTheme(name)` | function | wear another of the deck's `themes` (written in the URL, followed by the other windows); any other name warns and is ignored |
| `toggleFullscreen()` | function | enter or leave fullscreen (as `f`) |
| `openPresenter()` | function | open the presenter window, or bring it forward (as `p`) |
| `role` | String (not a ref) | which rendering this is: `'audience'` (the audience window), `'presenter'` (presenter view, current slide), `'preview'` (presenter view, next-step preview), `'export'` (?export), `'thumbnail'` (the deck's cover in the list of decks at `/`: its actions do nothing, as the preview's) |

In the `'preview'` copy the refs read the preview's position and no function does anything
(`next`, `prev`, `go`, `setTheme`, `toggleFullscreen`, `openPresenter`): the preview is a copy, it
cannot act. The object is frozen and its refs read-only, all the way down (`themes.value`,
`timer.value`): change things through the functions. Being frozen, Vue does not make it reactive:
don't put it inside `reactive()` or `data()` (its refs are not unwrapped there); read its refs
directly (`deck.index.value`).

## useSlide()

For components inside a `Slide` that change *within* the slide (highlight, count, dim) rather
than just appear. Throws outside a `Slide`.

| Field | Meaning |
|---|---|
| `step` | readonly ref: this slide's current step (1-based; the last step once passed, 1 before reached) |
| `requireSteps(n)` | the slide has at least `n` steps (same as a `v-step="n"`). `n` may be a number, a ref or a getter; changes are followed; released on unmount. Returns a function that releases it early. |
