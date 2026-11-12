<!-- The export view (?export, core/exporter.js): once the deck has mounted, its stage is walked
     page by page into the book, and the result is reported for the export CLI. No controls, no
     keyboard, no mouse or touch, no cursor hiding; the deck joins no other window (state/deck.js).
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

async function run() {
  const list = themes.value
  if (!list.includes(theme.value))
    return reportReady({ error: `theme "${theme.value}" is not one of the deck's themes: ${list.join(', ')}`, code: 'theme-not-listed', themes: list })
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
    reportReady({ ...result, theme: theme.value })
  } catch (e) {
    console.error('[arao] export failed', e)
    reportReady({ error: String(e?.message || e) })
  }
}
onMounted(run)
</script>
