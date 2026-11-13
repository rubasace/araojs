# Presenting

Open the deck (`npm run dev`, then `/<name>`), go fullscreen with `f` and move with the arrows.
Press `p` for the presenter view: the current slide, what the next press shows, the speaker
notes, a timer with a countdown and the wall clock, in a window of its own that every window of
the deck follows.

## Controls

Built into `Deck`; nothing to add. A floating panel at the bottom centre of the audience window.

- **Touch** (phones, tablets): tap the right quarter of the screen → next, the left quarter →
  previous, the middle → show/hide the panel (it stays 4 s); swipe left/right → next/previous.
  Links, buttons and inputs inside a slide keep their taps; add `data-ar-touch="ignore"` to any
  other element that needs them. Pinch-zoom still works. Below 560 px wide the panel drops the
  first/last buttons and the jump menu fits the screen.
- **Shows on mouse movement only**, never on keyboard navigation; hides 2.5 s after the mouse
  stops (stays while hovered or while a menu is open). The cursor hides after `hideCursorAfter`.
- Buttons: first, previous, slide counter (`3 / 18`, click = jump menu), step dots (one per step
  when the slide has more than one; click = go to that step), next, last, theme picker (only with
  more than one theme), presenter view, fullscreen.
- **Jump to a slide by number**: type its number and press `Enter` (`16` `Enter` goes to slide
  16), as in PowerPoint or Keynote. Nothing shows on screen, so the audience sees no list; a
  number that is no slide does nothing; `Backspace` deletes the last digit; `Esc`, any other key,
  or 2 s without a key clears what was typed. The digits are read by their physical key too, so
  the number row works on an AZERTY keyboard without Shift.
- **Jump menu** (`g` or the counter): a search box over the slide list; a number filters by slide
  number prefix, text by title (`Slide(title)` or its first heading). `↑`/`↓`, `Enter`, `Esc`.
- **Theme picker**: the deck's `themes`, each with a swatch of its background and accent, as the
  deck would wear them (`default`'s: the defaults with the project's `:root` rules over them).
- Its look is the `--ar-controls-*` tokens ([Interface](../reference/theme-tokens.md#interface)).
- Keys (in any window of the deck): see the table below. Ctrl/Cmd/Alt combinations, and keys
  typed into inputs or anywhere in the presenter's duration field (its buttons too), are ignored.
  `AltGr` combinations count (they type characters on many layouts); on a Mac, keys typed with
  `Option` are ignored. `Space`/`Enter` on a focused button press the button. A held key
  repeats only next and previous.
- Letter keys match either case: `g` and `G` (Shift, Caps Lock) do the same. Shift does not stop
  the navigation keys: `Shift`+`→` still moves.
- Every key but `Esc` and the digits can be changed: see [Your own keys](#your-own-keys).

| Key | Action |
|---|---|
| `→` `↓` `PageDown` `Space` `Enter` | next step, then next slide |
| `←` `↑` `PageUp` `Backspace` | previous step (to the last step of the previous slide) |
| `Home` / `End` | first slide / last step of the last slide |
| `g` | toggle the jump menu |
| `0`–`9`, then `Enter` | go to that slide (reserved: cannot be remapped) |
| `Esc` | close the open panel (jump menu or theme picker); clear a typed number (reserved) |
| `t` | next theme |
| `f` | fullscreen |
| `p` | open or bring forward the presenter window (not in the presenter itself) |

### Your own keys

A clicker, a headset or a pedal that sends a key the deck does not know can drive it: name that
key in an optional `src/shortcuts.ts` (or `src/shortcuts.js`) of the project. The Vite plugin
loads it; nothing to import elsewhere. It maps a key to a command:

```ts
// src/shortcuts.ts
import { defineShortcuts } from 'araojs'

export default defineShortcuts({
  MediaTrackNext: 'next',      // the headset's "next track" button
  MediaTrackPrevious: 'prev',
  b: 'menu',                   // b opens the jump menu too (g still does)
  t: null,                     // no theme change by key during the talk
})
```

- Commands: `next`, `prev`, `first`, `last`, `theme`, `fullscreen`, `presenter`, `menu`.
- Your entries are laid over the defaults (the table above), key by key: a key the defaults have
  is remapped, `null` turns it off (the key does what the browser does with it), a new key is
  added. Several keys can run one command.
- A key is written as the browser names it: its `key` (`'g'`, `'ArrowRight'`, `'PageDown'`,
  `'MediaTrackNext'`) or its `code`, the physical key (`'KeyG'`, `'NumpadAdd'`). A press is
  looked up by its code first, then by its key. A single letter matches both cases; `'Space'`
  stands for the space bar.
- `Esc` and the digits are reserved. Mapping one, naming a command that does not exist, or
  writing one key twice (`'Space'` and `' '`, `'G'` and `'g'`) is a type error in a `.ts` file
  written with `defineShortcuts` where TypeScript can tell, and in any case an `[arao]` error
  naming the file when Vite starts: `vite`, `vite build` and `arao export` stop.
- The file is read in Node when Vite starts (and again on every edit in development): keep it a
  plain map. It may import `defineShortcuts` from `araojs` and nothing else of the package. With
  both `src/shortcuts.ts` and `src/shortcuts.js`, the `.ts` is used (with a warning).

To find what a device sends, open the deck, paste this in the browser's console and press the
button; it prints the `key` and the `code` to write:

```js
addEventListener('keydown', (e) => console.log({ key: e.key, code: e.code }))
```

### Interface language

The engine's own text (the controls' tooltips, the jump menu, the presenter view, the list of
decks, the notes pages of the export) follows the browser's language: the first of the reader's
preferred languages (`navigator.languages`) among English, Spanish, German, French, Italian,
Polish, Japanese and Simplified Chinese, else English. A regional variant counts as its language
(`es-MX` is Spanish; `zh-CN` and `zh-SG` are Simplified Chinese, while `zh-TW` falls through
to the next preferred language). There is no option and no switcher. What the slides say is
yours: nothing in a deck is translated. `arao export` prints the notes pages in the language of
the machine it runs on (its headless Chromium's).

## Speaker notes

`Notes` inside a slide holds what only the presenter sees; steps work inside it. Its rules:
[Notes](../reference/components.md#notes).

```pug
Slide
  h2 Pricing
  p(v-step="2") Three tiers
  Notes
    p Start with the story of the first customer.
    p(v-step="2") Tiers: say why there are exactly three.
```

## Presenter view

Opened with `p`, the controls' screen button, or `?presenter` in the deck's URL (`/talk?presenter`). A separate pop-up
window (named per deck: pressing `p` again brings it forward instead of reloading it). If the
browser blocks it, a notice above the controls links to it.

Layout (its own dark look, whatever the deck theme, from the `--ar-presenter-*` tokens:
[Interface](../reference/theme-tokens.md#interface); only the slides wear the theme):
- **Top bar**: slide `n / total` and title; the timer (elapsed, state, remaining) with
  play/pause and reset buttons and the talk's duration (a button); the wall clock.
- **Current slide**, large, with the controls docked under it (always visible).
- **Next**: a live preview of what one more press shows (the next step, or the next slide at step
  1); "End of the deck" at the end.
- **Notes** of the slide on screen, those whose `step` has been reached; the ones starting at
  the current step have an accent bar and are scrolled into view.

Timer:
- Idle until the first move of the deck in any window; then running. Pause/resume and reset
  (back to idle: starts again with the next move).
- With a duration: shows `m:ss left`, turns amber when the time left is at most 10 % of the
  duration and at most 5 minutes, red with `m:ss over` when over.
- Kept in `sessionStorage`: survives reloading the windows, not closing them.

Duration:
- Set in the deck with `Deck(duration="45m")`: the default, and the deck's own value.
- Changed live from the bar, without editing the deck: its duration button (it shows the duration
  in effect, or `length` when there is none) opens a field that takes the same formats as
  `Deck(duration)` (`90`, `45m`, `1h30`, `45:00`…), from 1 minute to 24 hours. `Enter` applies;
  `Esc`, a click elsewhere or moving the focus out of the field (`Tab` past it) cancels; an
  invalid value, or one out of those bounds, shows an inline error and changes nothing. Works
  without `Deck(duration)` too: it adds a countdown.
- Keyboard: the button is reachable with `Tab` and opens with `Enter`. While the focus is in the
  field (its buttons too), no deck key acts. Closed from inside (`Enter`, `Esc`, going back to the
  deck's value), the focus rests next to the button, not on it: `Space` and `Enter` move the
  slides again at once, and the next `Tab` reaches the button.
- Changed in another window while the field is open: the field takes the new value if nothing was
  typed in it, and keeps the typed text otherwise; a line under it says it changed either way, so
  `Enter` does not overwrite the new value unknowingly.
- A changed duration shows in the accent colour; the field then offers to go back to the deck's
  value (`Back to the deck's: m:ss`, or `Remove the countdown` when the deck has none). Setting the deck's own value is the same as going back.
- A changed duration wins over the deck until it is reset, even when the deck's `duration` changes
  (an edit of the deck while presenting with the dev server); if the deck's new value equals it,
  the change is dropped, as if it had been reset.
- Shared like the timer: every window of the deck takes it (`useDeck().duration`), and it is kept
  in `sessionStorage` (survives reloading the windows, not closing them). The elapsed time is not
  touched: only the countdown changes.

Code of your own that should not run twice in the presenter window: [Extending](extending.md#side-effects-and-roles).
