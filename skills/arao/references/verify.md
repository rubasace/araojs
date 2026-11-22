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
    (`size="36"` without the colon, `fit="fill"`), and `Failed to resolve component` for a
    component Arao no longer has (`Cols`, `Rows`, `Grid`, `Center`);
  - Arao's, prefixed `[arao]`: missing files or icons, values it cannot use (`duration`),
    `v-step`, `Notes` or `Background` outside a slide, a path that names no deck, an unknown
    theme name;
- reports "removed Slide API": a slide carrying a prop older Arao had (`title`, `align`,
  `footer`, `ratio`, `bg`, `bg-*`), which is now a plain HTML attribute that does nothing, or a
  leftover `template(#background)` (a `.ar-zone-background` zone); and "removed components":
  `Cols`, `Rows`, `Grid` (rendered as plain elements of those names), each with its replacement.
  It warns, without failing, about a `center` element (the removed `Center`, or HTML's old
  `<center>`) and the class `.small` (now `.text-sm`, unless it is the deck's own); the fixes:
  [troubleshooting.md](troubleshooting.md#decks-written-for-an-older-arao);
- warns (without failing) about named templates that are no zone of their slide's layout
  (`template(#image)` on a `split`): its CSS does not place them. Fix the name, unless a theme or
  the deck's CSS places that zone on purpose: then declare it for the type check
  ([troubleshooting.md](troubleshooting.md#warnings-and-what-they-mean)). It asks
  `npx arao layouts --json` for each layout's zones; where that fails (an older araojs) it says
  the zones were not checked;
- flags quirks mode (an `index.html` without `<!doctype html>`: tables lose their theme);
- counts the slides and presses `→` until the hash stops changing, recording the highest step per
  slide: compare with what you meant;
- lists the content that does not fit: the warnings Arao gives in development, one per slide and
  step it overflows at (`deck "mytalk", slide 7 "Twelve pillars", step 3 of 4: the body overflows
  by 46px at the bottom, under the footer. To fit it: …`): what overflows, by how many px, and
  how to fix it. Fix each (below, Export);
- saves a screenshot of every step (`deck-check/s<slide>-<step>.png`): look at them.

It exits 1 on any warning, error, removed Slide API or component, quirks mode or content that does not fit, and when no slide
renders at the URL (wrong URL or port, server not running): it then prints the console problems
it collected.
Without the script, do the same with Playwright by hand.

## 3. Export

```bash
npm run export -- --deck <name>
```

Read the summary line: pages (one per step by default; `--per-slide` for one per slide), slides,
steps, missing pictures. Without `--deck` it exports every deck. Options: `docs/reference/cli.md`.

Then read the end of the output: every slide whose content does not fit is listed there, after
the total, with what overflows and by how many px:

```
2 slides do not fit (a warning: --strict makes it an error):
  mytalk, slide 7 "Twelve pillars", steps 3-4 of 4: the body overflows by 46px at the bottom, under the footer
  mytalk, slide 9 "The config": block 2 of the body (div) overflows by 120px at the right, cut off at its edge
  To fit it: Slide.fit (shrinks the body's text just enough), a .scale-90, .scale-80 or .scale-70 class on the slide or on a block, or fewer blocks.
```

Fix every one, then export again, until no such lines are left. In order of preference: cut
(fewer blocks, shorter text, two slides: one idea per slide); `Slide.fit` on the slide (its
body's text shrinks just enough, down to 60%); `.scale-90` / `.scale-80` / `.scale-70` on the
slide or on the block that overflows. "Slide.fit shrank its body to 60%, its floor" means it
cannot fit: split it. What is meant to reach past its box (a decoration): `position: absolute`,
or `data-ar-bleed` on it. The export's exit code stays 0 with overflow; `--strict` makes it 1
(for CI).

## 4. Build

`npm run build` must pass.
