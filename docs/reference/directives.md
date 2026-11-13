# Directives

`v-step` and `v-step-from`, registered globally. How to use them, with examples:
[Steps](../guide/steps.md).

## v-step

Reveals an element at a step of its slide.

| Form | Meaning |
|---|---|
| `v-step="n"` | visible from step `n` on; hidden before (keeps its space: `opacity: 0`) |
| `v-step.only="n"` | visible only at step `n` |
| `v-step.collapse="n"` | like `v-step`, but while hidden it takes no space (`display: none`) |
| `v-step.only.collapse="n"` | both |

Numbering rules:
- Steps start at 1 and `n` is **absolute** within the slide (not relative to the previous
  element). Step 1 is what shows when the slide arrives; `v-step="1"` is always visible.
- A slide's step count is the **largest** `n` over every `v-step` inside it (any depth, any
  component) and every `useSlide().requireSteps(n)` (Snippet highlights use this). There is
  nothing to declare. Gaps are allowed: a slide with only `v-step="3"` has 3 steps, and step 2
  changes nothing.
- A slide already passed shows its last step; a slide not reached yet shows step 1.
- Several elements may share a number: they appear together.

Behaviour:
- Works in nested components (it finds its slide through the DOM) and in `#background`.
- Outside a `Slide` it warns and does nothing.
- Fade duration: `--ar-step-duration` (default `.35s`).
- With `.collapse`, the elements around it glide to their new place (FLIP). Slides not on screen,
  `prefers-reduced-motion`, and export mode switch without the glide.
- Inside `Cols`/`Rows`/`Grid`, a collapsed child frees its track and the children after it shift
  back one track until it shows.

## v-step-from: relative steps for reusable components

`v-step-from="n"` on any element or component makes every `v-step` and `useSlide()` inside it
**relative**: their step 1 is step `n` of the slide. A component can number its own steps from 1
and the deck decides where they land, so the same component (or the same "animation") is reused
at any point of any slide.

- Value: an integer ≥ 1 (anything else warns and counts as 1). `v-step-from="1"` changes nothing.
- Scopes nest and add up: `v-step-from="3"` inside `v-step-from="2"` starts at step 4.
- A `v-step` on the same element as `v-step-from` is **not** shifted by it (it places the element
  itself, relative to the outer scopes); its descendants are.
- `useSlide()` inside a scope: `step` is relative (it can be ≤ 0 before the scope starts) and
  `requireSteps(n)` declares `n` relative steps. Snippet highlights follow, since they use it.
- The slide's total is still the highest absolute step.
