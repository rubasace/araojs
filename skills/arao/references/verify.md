# Verify a deck

Do all four before calling a deck done.

## 1. Walk it in the browser

`npm run dev` and open `http://127.0.0.1:5173/<name>`; walk it with `→`. Check `#/<slide>/<step>`
in the URL and the step dots (move the mouse to show the controls). Open `http://127.0.0.1:5173/`
too: the deck's card shows its cover, its file name in words and, under it, the cover's heading.

## 2. Headless check

With the dev server running, from the slides project:

```bash
npx playwright-core install chromium          # once
node <skill>/scripts/check-deck.mjs http://127.0.0.1:5173/<name> deck-check
```

`<skill>` is this skill's folder (where `SKILL.md` is). The script, at a 1920x1080 viewport:

- collects `console` warnings/errors and page errors: expect none. Two kinds:
  - Vue's own, `[Vue warn]: Invalid prop: …`, when a prop fails its type or validator
    (`gap="huge"`, `size="36"` without the colon, `fit="fill"`);
  - Arao's, prefixed `[arao]`: missing files or icons, values it cannot use (`bg`, `duration`),
    `v-step` or `Notes` outside a slide, a path that names no deck, an unknown theme name;
- counts the slides and presses `→` until the hash stops changing, recording the highest step per
  slide: compare with what you meant;
- flags slides whose content overflows (`scrollHeight`/`scrollWidth` over the client size);
- saves screenshots of each slide's first and last step: look at them.

It exits 1 on any warning, error or overflow. Without the script, do the same with
Playwright by hand.

## 3. Export

```bash
npm run export -- --deck <name>
```

Read the summary line: pages (one per step by default; `--per-slide` for one per slide), slides,
steps, missing pictures. Without `--deck` it exports every deck. Options: `docs/reference/cli.md`.

## 4. Build

`npm run build` must pass.
