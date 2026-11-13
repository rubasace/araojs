<!-- The export view (?export, core/exporter.js): once the deck has mounted, its stage is walked
     page by page into the book, and the result is reported for the export CLI, with the name of
     the deck it printed (deck: the app's, null without one), so the CLI can tell a wrong one.
     No controls, no keyboard, no mouse or touch, no cursor hiding; the deck joins no other window
     (state/deck.js).
       options   exportOptions(query): { perStep, notes }
     The notes of the slide on screen (those the presenter view would show at this step) are
     drawn in a box that is never shown: the book copies them after the slide's page(s), at its
     last step.
     deck: createDeck() (state/deck.js): the stage and the export options. -->
<template>
  <div class="ar-viewport ar-export" ref="viewport" :data-theme="theme" :class="{ 'ar-export-done': done }">
    <Stage :stage="deck.stage" :width="width" :height="height">
      <slot />
    </Stage>
    <!-- the notes of the slide on screen, copied into the book after its page(s); never shown -->
    <div class="ar-export-notes" v-if="deck.exporting.notes" ref="notesBox">
      <div class="ar-note" v-for="n in shownNotes" :key="n.id" :data-step="n.step">
        <NoteBody :note="n" />
      </div>
    </div>
    <!-- filled by exporter.js, not by Vue -->
    <div class="ar-book" ref="book"></div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { buildBook, reportReady } from '../core/exporter'
import { titleOf } from '../state/stage'
import { useDeck } from '../state/deck'
import { NoteBody } from '../components/Notes'
import Stage from './parts/Stage.vue'

const props = defineProps({
  deck: { type: Object, required: true }, // createDeck()
  width: { type: Number, required: true }, // of the canvas
  height: { type: Number, required: true },
})
const { theme, themes } = useDeck()
const { stage, exporting: options } = props.deck

const viewport = ref()
const book = ref()
const notesBox = ref()
// true once the book is complete
const done = ref(false)
// the notes the presenter view would show at this step (the book takes them at the slide's last step)
const shownNotes = computed(() => (stage.current.value?.notes ?? []).filter((n) => n.step <= stage.step.value))

// every report says which deck it is of
const report = (value) => reportReady({ ...value, deck: props.deck.name })

async function run() {
  const list = themes.value
  if (!list.includes(theme.value))
    return report({ error: `theme "${theme.value}" is not one of the deck's themes: ${list.join(', ')}`, code: 'theme-not-listed', themes: list })
  try {
    const result = await buildBook({
      stage,
      canvas: viewport.value.querySelector(':scope > .ar-stage > .ar-canvas'),
      book: book.value,
      notes: options.notes ? notesBox.value : null,
      title: (i) => titleOf(stage.list[i]),
      perStep: options.perStep,
      width: props.width,
      height: props.height,
    })
    done.value = true
    report({ ...result, theme: theme.value })
  } catch (e) {
    console.error('[arao] export failed', e)
    report({ error: String(e?.message || e) })
  }
}
onMounted(run)
</script>

<style>
/* Export mode (?export, core/exporter.js): a book of pages, each exactly the canvas size (inline
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
/* a page of speaker notes (&notes): plain, for paper, whatever the theme */
.ar-notes-page {
  padding: 96px 120px; background: #fff; color: #1c1c22;
  font: 34px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.ar-notes-head {
  margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #d4d4da;
  font-size: 28px; font-weight: 600; color: #5c5c66;
}
.ar-notes-body .ar-note { margin-bottom: 28px; }
.ar-notes-body .ar-note > :first-child { margin-top: 0; }
.ar-notes-body .ar-note[data-step]:not([data-step="1"])::before {
  content: "Desde el paso " attr(data-step); display: block; margin-bottom: 6px;
  font-size: 24px; font-weight: 600; color: #8a5a00;
}
/* on screen (?export opened in a browser), the pages one under the other */
@media screen {
  .ar-viewport.ar-export { background: #2a2a2e; }
  .ar-book { display: flex; flex-direction: column; align-items: flex-start; gap: 24px; padding: 24px; }
}
</style>
