<!-- The export view (?export, core/exporter.ts): once the deck has mounted, its stage is walked
     page by page into the book, and the result is reported for the export CLI, with the name of
     the deck it printed (deck: the app's, null without one), so the CLI can tell a wrong one.
     No controls, no keyboard, no mouse or touch, no cursor hiding; the deck joins no other window
     (state/deck.ts).
       options   exportOptions(query): { perStep, notes }
     The Notes of the slide on screen are drawn in a box that is never shown (their outlet,
     state/notes.ts): the book copies them after the slide's page(s), every step of them shown.
     deck: createDeck() (state/deck.ts): the stage and the export options. -->
<template>
  <div class="ar-viewport ar-export" ref="viewport" :data-theme="theme" :class="{ 'ar-export-done': done }" :style="stepLabels">
    <Stage :stage="deck.stage" :width="width" :height="height">
      <slot />
    </Stage>
    <!-- the notes of the slide on screen, copied into the book after its page(s); never shown -->
    <div class="ar-export-notes" v-if="options.notes" ref="notesOutlet"></div>
    <!-- filled by exporter.ts, not by Vue -->
    <div class="ar-book" ref="book"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, type PropType } from 'vue'
import { buildBook, reportReady } from '../core/exporter'
import { titleOf } from '../state/stage'
import { useDeck, type Deck } from '../state/deck'
import { useNotesOutlet } from '../state/notes'
import Stage from '../components/internal/Stage.vue'
import { t } from '../i18n/i18n'

const props = defineProps({
  deck: { type: Object as PropType<Deck>, required: true }, // createDeck()
  width: { type: Number, required: true }, // of the canvas
  height: { type: Number, required: true },
})
const { theme, themes } = useDeck()
// the export view is only drawn in export mode, where the options are read from the URL
const { stage } = props.deck
const options = props.deck.exporting!

const viewport = ref<HTMLElement>()
const book = ref<HTMLElement>()
const notesOutlet = useNotesOutlet()
// true once the book is complete
const done = ref(false)

// the labels of a step's notes on paper, in the reader's language (the CSS below draws them
// around the step's number, attr(data-ar-step)): what each message says before and after it
// (the message is called with a marker instead of its number, to split it around the number)
const around = (key: 'fromStep' | 'atStep') => (t as (k: string, ...v: unknown[]) => string)(key, '\u0000').split('\u0000').map((s) => JSON.stringify(s))
const [fromBefore, fromAfter] = around('fromStep')
const [atBefore, atAfter] = around('atStep')
const stepLabels = { '--_ar-from-step-before': fromBefore, '--_ar-from-step-after': fromAfter, '--_ar-at-step-before': atBefore, '--_ar-at-step-after': atAfter }

// every report says which deck it is of
const report = (value: Record<string, unknown>) => reportReady({ ...value, deck: props.deck.name })

async function run() {
  // the deck's themes, as state/theme.ts resolves them (from the plugin's theme sources only):
  // arao export --theme takes one of them
  const list = themes.value
  if (!list.includes(theme.value))
    return report({ error: `theme "${theme.value}" is not one of the deck's themes: ${list.join(', ')}`, code: 'theme-not-listed', themes: list })
  try {
    const result = await buildBook({
      stage,
      canvas: viewport.value!.querySelector<HTMLElement>(':scope > .ar-stage > .ar-canvas')!,
      book: book.value!,
      notes: options.notes ? notesOutlet.value : null,
      title: (i: number) => titleOf(stage.list[i]),
      perStep: options.perStep,
      width: props.width,
      height: props.height,
    })
    done.value = true
    report({ ...result, theme: theme.value })
  } catch (e) {
    console.error('[arao] export failed', e)
    report({ error: String((e as Error)?.message || e) })
  }
}
onMounted(run)
</script>

<style>
/* Export mode (?export, core/exporter.ts): a book of pages, each exactly the canvas size (inline
   width/height; @page gets the same size), in document order, for printing. */
html:has(.ar-export), html:has(.ar-export) body, html:has(.ar-export) #app { height: auto; }
.ar-viewport.ar-export { position: static; overflow: visible; background: none; }
/* the deck itself, walked while the book fills: on screen until the book is done, never printed */
.ar-export > .ar-stage { position: fixed; }
.ar-export-done > .ar-stage, .ar-export-notes { display: none; }
@media print { .ar-export > .ar-stage { display: none; } }
/* every page as it stands: nothing moves, nothing fades */
.ar-export, .ar-export *, .ar-export *::before, .ar-export *::after {
  transition: none !important; animation: none !important;
}
/* contain: size makes a page one piece for the printer (monolithic). Without it Chromium splits
   at the page's bottom edge whatever is laid out across it, clipped or not, and draws the part
   above as a box of its own (no bottom border or rounded bottom corners, percentages of its
   height taken from that part): a ring placed with top: 50% and transform: translateY(-50%)
   printed as an arch. The page has its size from its own width and height, so nothing moves. */
.ar-page {
  position: relative; overflow: hidden; box-sizing: border-box; contain: size;
  break-after: page; break-inside: avoid;
  print-color-adjust: exact; -webkit-print-color-adjust: exact;
}
.ar-page:last-child { break-after: auto; }
/* the canvas copy fills its page, unscaled (and says so, to whatever sizes itself by the scale) */
.ar-book { --ar-scale: 1; }
.ar-page > .ar-canvas { top: 0; left: 0; transform: none !important; }
/* a page of speaker notes (&notes): plain, for paper, the same whatever the deck theme unless the
   theme sets the --ar-notes-page-* tokens */
.ar-notes-page {
  padding: 96px 120px; background: var(--ar-notes-page-bg); color: var(--ar-notes-page-fg);
  font: var(--ar-notes-page-text)/1.45 var(--ar-ui-font);
}
.ar-notes-head {
  margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid var(--ar-notes-page-line);
  font-size: var(--ar-notes-page-head-size); font-weight: 600; color: var(--ar-notes-page-muted);
}
.ar-notes-body .ar-note { margin-bottom: 28px; }
.ar-notes-body .ar-note > :first-child { margin-top: 0; }
/* on paper every step of the notes shows, each labelled with its step (v-step, directives/step.ts) */
.ar-notes-body .ar-step-hidden { opacity: 1 !important; }
.ar-notes-body .ar-step-collapsed { display: revert !important; }
.ar-notes-body :is([data-ar-step]:not([data-ar-step="1"]), [data-ar-step-only])::before {
  content: var(--_ar-from-step-before) attr(data-ar-step) var(--_ar-from-step-after); display: block; margin-bottom: 6px;
  font-size: var(--ar-notes-page-step-size); font-weight: 600; color: var(--ar-notes-page-step);
}
.ar-notes-body [data-ar-step][data-ar-step-only]::before { content: var(--_ar-at-step-before) attr(data-ar-step) var(--_ar-at-step-after); }
/* on screen (?export opened in a browser), the pages one under the other */
@media screen {
  .ar-viewport.ar-export { background: var(--ar-export-bg); }
  .ar-book { display: flex; flex-direction: column; align-items: flex-start; gap: 24px; padding: 24px; }
}
</style>
