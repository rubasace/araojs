# Verify a deck

Do all four before calling a deck done.

## 1. Walk it in the browser

`npm run dev` and open the deck at the URL Vite prints (`Local: http://localhost:5173/`, or
another port if that one is taken), plus `/<name>`; walk it with `→`. Check `#/<slide>/<step>` in
the URL and the step dots (move the mouse to show the controls). Open `/` too: the deck's card
shows its cover, its file name in words and, under it, the cover's heading.

## 2. Headless check

Chromium once, from the slides project:

```bash
npx playwright-core install chromium
```

Chromium also needs system libraries. Where you have root (CI, a container), install them with
it: `npx playwright-core install --with-deps chromium`. Without root and with libraries missing,
Chromium fails to launch with an error naming the missing `.so`: ask for them to be installed.

Then, with the dev server running, from the slides project:

```bash
node <skill>/scripts/check-deck.mjs <the URL Vite printed><name> deck-check
# e.g. node .claude/skills/arao/scripts/check-deck.mjs http://localhost:5173/mytalk deck-check
```

`<skill>` is this skill's folder (where `SKILL.md` is). The script, at a 1920x1080 viewport:

- collects `console` warnings/errors and page errors: expect none. Two kinds:
  - Vue's own, `[Vue warn]: Invalid prop: …`, when a prop fails its type or validator
    (`gap="huge"`, `size="36"` without the colon, `fit="fill"`);
  - Arao's, prefixed `[arao]`: missing files or icons, values it cannot use (`bg`, `duration`),
    `v-step` or `Notes` outside a slide, a path that names no deck, an unknown theme name;
- flags quirks mode (an `index.html` without `<!doctype html>`: tables lose their theme);
- counts the slides and presses `→` until the hash stops changing, recording the highest step per
  slide: compare with what you meant;
- flags slides whose content overflows (`scrollHeight`/`scrollWidth` over the client size);
- saves a screenshot of every step (`deck-check/s<slide>-<step>.png`): look at them.

It exits 1 on any warning, error, quirks mode or overflow, and when no slide renders at the URL
(wrong URL or port, server not running): it then prints the console problems it collected.
Without the script, do the same with Playwright by hand.

## 3. Export

```bash
npm run export -- --deck <name>
```

Read the summary line: pages (one per step by default; `--per-slide` for one per slide), slides,
steps, missing pictures. Without `--deck` it exports every deck. Options: `docs/reference/cli.md`.

## 4. Build

`npm run build` must pass.
