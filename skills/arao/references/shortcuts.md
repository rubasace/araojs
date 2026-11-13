# Keys while presenting, and your own keys

Full guide: `docs/guide/presenting.md`.

## Default keys

| Key | Action |
|---|---|
| `→` `↓` `PageDown` `Space` `Enter` | next step, then next slide |
| `←` `↑` `PageUp` `Backspace` | previous step |
| `Home` / `End` | first slide / last step of the last slide |
| `g` | toggle the jump menu (search slides by number or title) |
| `0`–`9`, then `Enter` | go to that slide, invisibly (reserved) |
| `Esc` | close the open panel; clear a typed number (reserved) |
| `t` | next theme |
| `f` | fullscreen |
| `p` | open or bring forward the presenter window |

- Letters match either case. Ctrl/Cmd/Alt combinations and keys typed in inputs are ignored;
  `AltGr` counts. A held key repeats only next and previous.
- Touch: tap the right quarter → next, the left quarter → previous, the middle → show/hide the
  controls; swipe left/right.
- Most clickers send `PageDown`/`PageUp` or the arrows: they work with no setup.

## A device that sends another key

Write an optional `src/shortcuts.ts` (or `src/shortcuts.js`). The Vite plugin loads it; nothing
to import elsewhere:

```ts
// src/shortcuts.ts
import { defineShortcuts } from 'araojs'

export default defineShortcuts({
  MediaTrackNext: 'next',      // a headset's "next track" button
  MediaTrackPrevious: 'prev',
  b: 'menu',                   // b opens the jump menu too
  t: null,                     // no theme change by key during the talk
})
```

- Commands: `next`, `prev`, `first`, `last`, `theme`, `fullscreen`, `presenter`, `menu`.
- Entries are laid over the defaults key by key: an existing key is remapped, `null` turns it off
  (the browser gets it), a new key is added. Several keys may run one command.
- A key is its `key` (`'g'`, `'PageDown'`, `'MediaTrackNext'`) or its `code` (`'KeyG'`,
  `'NumpadAdd'`); the code is checked first. `'Space'` stands for the space bar.
- `Esc` and the digits are reserved. Mapping one, an unknown command, or the same key twice
  (`'Space'` and `' '`, `'G'` and `'g'`) stops `vite`, `vite build` and `arao export` with an
  `[arao]` error naming the file.
- Keep the file a plain map: it is read in Node when Vite starts. It may import `defineShortcuts`
  from `araojs` and nothing else.

To find what a device sends, open the deck, paste this in the browser console and press the
button:

```js
addEventListener('keydown', (e) => console.log({ key: e.key, code: e.code }))
```
