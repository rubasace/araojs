<!-- The presenter view (Deck in a window opened with ?presenter): the current slide, large, with the
     controls under it; the next step as the audience will see it; the speaker notes of the slide;
     and a bar with the slide, the talk's timer and the wall clock. Its own dark look, whatever the
     deck's theme: only the slides wear the theme. The slides come in through the slots, each one
     a Stage (Deck.vue). -->
<template>
  <div class="ph-presenter">
    <PresenterBar :deck="deck" :title="title" :timer="timer" :duration="duration" @timer="$emit('timer', $event)" />
    <div class="ph-p-main">
      <section class="ph-p-current" aria-label="Diapositiva actual">
        <div class="ph-p-screen" :style="{ aspectRatio: ratio }">
          <slot name="current" />
        </div>
        <div class="ph-p-controls">
          <slot name="controls" />
        </div>
      </section>
      <div class="ph-p-side">
        <section class="ph-p-panel ph-p-next" aria-label="Siguiente">
          <header class="ph-p-label">
            <span>Siguiente</span>
            <span class="ph-p-detail">{{ nextDetail }}</span>
          </header>
          <!-- a copy of the deck: kept away from the pointer, the keyboard and screen readers -->
          <div class="ph-p-screen" :style="{ aspectRatio: ratio }" aria-hidden="true" inert>
            <slot name="next" />
            <div class="ph-p-end" v-if="next.end">Fin de la presentación</div>
          </div>
        </section>
        <section class="ph-p-panel ph-p-notes" aria-label="Notas">
          <header class="ph-p-label">
            <span>Notas</span>
            <span class="ph-p-detail" v-if="deck.steps.value > 1">Paso {{ deck.step.value }} de {{ deck.steps.value }}</span>
          </header>
          <div class="ph-p-notes-body" ref="body">
            <div
              class="ph-p-note"
              v-for="n in shown" :key="n.id"
              :class="{ fresh: n.step > 1 && n.step === deck.step.value }"
              :data-step="n.step"
            >
              <NoteBody :note="n" />
            </div>
            <p class="ph-p-empty" v-if="!shown.length">Sin notas en esta diapositiva</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import PresenterBar from './PresenterBar.vue'
import { NoteBody } from './notes'

const props = defineProps({
  deck: { type: Object, required: true }, // the audience's stage api (useDeck)
  title: String, // of the slide on screen
  next: { type: Object, required: true }, // { index, step, end }: where one more press leads
  notes: { type: Array, default: () => [] }, // the slide's Notes: { id, step, slots }
  timer: { type: Object, required: true },
  duration: Number, // ms, or none
  ratio: { type: String, default: '16 / 9' }, // of the canvas
})
defineEmits(['timer'])

// notes show from their step on, as v-step
const shown = computed(() => props.notes.filter((n) => n.step <= props.deck.step.value))

const nextDetail = computed(() => {
  const { index, step, end } = props.next
  if (end) return ''
  if (index === props.deck.index.value) return `Paso ${step} de ${props.deck.steps.value}`
  return `Diapositiva ${index + 1}`
})

// A new slide starts its notes from the top; a step brings the notes it starts into view. Only
// the notes box scrolls (scrollIntoView would also scroll the page of a narrow window).
const body = ref()
watch(() => props.deck.index.value, () => body.value && (body.value.scrollTop = 0))
watch(() => props.deck.step.value, async () => {
  await nextTick()
  const box = body.value
  const note = box?.querySelector('.ph-p-note.fresh')
  if (!note) return
  const top = note.offsetTop // the box is their offsetParent
  const h = note.offsetHeight + parseFloat(getComputedStyle(box).paddingBottom)
  const to = top < box.scrollTop ? top
    : top + h > box.scrollTop + box.clientHeight ? Math.min(top, top + h - box.clientHeight)
    : null
  if (to != null) box.scrollTo({ top: to, behavior: 'smooth' })
})
</script>

<style>
.ph-presenter {
  --p-bg: #14161b;
  --p-panel: #1c1f26;
  --p-line: #2b2f39;
  --p-fg: #eceef2;
  --p-dim: #949bab;
  --p-accent: #5b9dff;
  --p-low: #f5b13d;
  --p-over: #ff5a4f;
  position: fixed; inset: 0;
  display: grid; grid-template-rows: auto minmax(0, 1fr);
  background: var(--p-bg); color: var(--p-fg);
  font: 16px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.ph-p-main {
  display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  gap: 20px; padding: 20px; min-height: 0;
}
.ph-p-current { display: flex; flex-direction: column; align-items: center; gap: 16px; min-height: 0; }
.ph-p-screen { position: relative; flex: 0 1 auto; width: 100%; min-height: 0; }
/* the slide's own edge, drawn on top of it (in canvas px: --ph-scale is the stage's scale) */
.ph-p-screen .ph-canvas { border-radius: calc(10px / var(--ph-scale)); }
.ph-p-screen .ph-canvas::after {
  content: ''; position: absolute; inset: 0; z-index: 1000; pointer-events: none;
  border: calc(1px / var(--ph-scale)) solid rgba(255, 255, 255, .16); border-radius: inherit;
}
.ph-p-controls { flex: none; }

.ph-p-side { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 20px; min-height: 0; }
.ph-p-panel {
  display: flex; flex-direction: column; min-height: 0;
  background: var(--p-panel); border: 1px solid var(--p-line); border-radius: 14px;
}
.ph-p-label {
  display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
  padding: 12px 16px 10px;
  font-size: 13px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: var(--p-dim);
}
.ph-p-detail { font-weight: 500; letter-spacing: 0; text-transform: none; font-variant-numeric: tabular-nums; }
.ph-p-next .ph-p-screen { width: auto; margin: 0 16px 16px; }
.ph-p-end {
  position: absolute; inset: 0; display: grid; place-items: center;
  background: #0d0f13; border: 1px solid var(--p-line); border-radius: 10px;
  color: var(--p-dim); font-size: 20px;
}

.ph-p-notes-body {
  position: relative; flex: 1; min-height: 0; overflow-y: auto; padding: 0 20px 20px;
  font-size: clamp(18px, .85vw + 9px, 28px); line-height: 1.5;
  scrollbar-width: thin; scrollbar-color: #3a3f4b transparent;
}
.ph-p-note { padding: .15em 0 .15em .75em; margin: 0 0 .5em -.75em; border-left: 4px solid transparent; border-radius: 2px; }
.ph-p-note.fresh { border-left-color: var(--p-accent); }
.ph-p-note > :first-child { margin-top: 0; }
.ph-p-note :is(p, ul, ol) { margin: 0 0 .5em; }
.ph-p-note :is(ul, ol) { padding-left: 1.2em; }
.ph-p-note strong { color: #fff; }
.ph-p-note code { font: .9em ui-monospace, "SFMono-Regular", Menlo, monospace; background: #2a2e38; padding: .05em .35em; border-radius: 5px; }
.ph-p-empty { margin: 0; color: var(--p-dim); font-size: .8em; }

/* narrow windows: one column, each box at its full size, the page scrolls */
@media (max-width: 900px) {
  .ph-p-main { grid-template-columns: minmax(0, 1fr); grid-auto-rows: max-content; overflow-y: auto; }
  .ph-p-side { grid-template-rows: auto auto; }
  .ph-p-screen { flex: none; }
  .ph-p-notes { min-height: 40vh; }
}
</style>
