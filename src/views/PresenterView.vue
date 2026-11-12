<!-- The presenter view (Deck in a window opened with ?presenter): the current slide, large, with the
     controls under it; the next step as the audience will see it; the speaker notes of the slide;
     and a bar with the slide, the talk's timer and the wall clock. Its own dark look, whatever the
     deck's theme: only the slides wear the theme.
     The deck's slides (its default slot) are drawn twice, each copy a Stage: the deck's stage, and
     its preview one step ahead. A second copy of every slide: each slide and addon mounts again
     there, so its side effects run twice in this window and its element ids repeat (useDeck().role
     is 'preview' in that copy, 'presenter' in the current one).
     Where the deck is comes from useDeck(); deck (state/deck.js) brings the internals: the stages,
     where one more press leads, the notes, the titles, the timer's setter, and the talk's length as
     the deck sets it with its setter (the bar edits it for every window). The presenter window
     listens to no mouse or touch of its own: only its controls and the keys (Deck.vue) move it. -->
<template>
  <div class="ar-presenter">
    <PresenterBar
      :title="title"
      :set-timer="deck.setTimer"
      :deck-duration="deck.deckDuration.value"
      :set-duration="deck.setDuration"
    />
    <div class="ar-p-main">
      <section class="ar-p-current" aria-label="Diapositiva actual">
        <div class="ar-p-screen" :style="{ aspectRatio: ratio }">
          <Stage :stage="deck.stage" :width="width" :height="height" :theme="theme">
            <slot />
          </Stage>
        </div>
        <div class="ar-p-controls">
          <Controls ref="controls" docked :titles="titles" />
        </div>
      </section>
      <div class="ar-p-side">
        <section class="ar-p-panel ar-p-next" aria-label="Siguiente">
          <header class="ar-p-label">
            <span>Siguiente</span>
            <span class="ar-p-detail">{{ nextDetail }}</span>
          </header>
          <!-- a copy of the deck: kept away from the pointer, the keyboard and screen readers -->
          <div class="ar-p-screen" :style="{ aspectRatio: ratio }" aria-hidden="true" inert>
            <Stage :stage="deck.preview" :width="width" :height="height" :theme="theme">
              <slot />
            </Stage>
            <div class="ar-p-end" v-if="next.end">Fin de la presentación</div>
          </div>
        </section>
        <section class="ar-p-panel ar-p-notes" aria-label="Notas">
          <header class="ar-p-label">
            <span>Notas</span>
            <span class="ar-p-detail" v-if="steps > 1">Paso {{ step }} de {{ steps }}</span>
          </header>
          <div class="ar-p-notes-body" ref="body">
            <div
              class="ar-p-note"
              v-for="n in shown" :key="n.id"
              :class="{ fresh: n.step > 1 && n.step === step }"
              :data-step="n.step"
            >
              <NoteBody :note="n" />
            </div>
            <p class="ar-p-empty" v-if="!shown.length">Sin notas en esta diapositiva</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDeck } from '../state/deck'
import { NoteBody } from '../components/Notes'
import Controls from './parts/Controls.vue'
import PresenterBar from './parts/PresenterBar.vue'
import Stage from './parts/Stage.vue'

const props = defineProps({
  deck: { type: Object, required: true }, // createDeck()
  width: { type: Number, required: true }, // of the canvas
  height: { type: Number, required: true },
})
const { index, step, steps, theme } = useDeck()
const ratio = computed(() => `${props.width} / ${props.height}`)
// next: { index, step, end }, where one more press leads; notes: the slide's Notes, { id, step, slots }
const { next, notes } = props.deck

// every slide's title, for the jump menu, re-read on every move; the title of the slide on screen
const titles = computed(() => {
  index.value
  return props.deck.titles()
})
const title = computed(() => titles.value[index.value] || '')

// the keys open and close the controls' jump menu (Deck.vue)
const controls = ref()
defineExpose({
  openMenu: (digits) => controls.value.openMenu(digits),
  toggleMenu: () => controls.value.toggleMenu(),
  closeMenu: () => controls.value.closeMenu(),
})

// the window says what it is, in its title (once: a remount after an edit does not add it again)
const TITLE = 'Presentador · '
onMounted(() => {
  if (!document.title.startsWith(TITLE)) document.title = TITLE + document.title
})

// notes show from their step on, as v-step
const shown = computed(() => notes.value.filter((n) => n.step <= step.value))

const nextDetail = computed(() => {
  const { index: at, step: s, end } = next.value
  if (end) return ''
  if (at === index.value) return `Paso ${s} de ${steps.value}`
  return `Diapositiva ${at + 1}`
})

// A new slide starts its notes from the top; a step brings the notes it starts into view. Only
// the notes box scrolls (scrollIntoView would also scroll the page of a narrow window).
const body = ref()
watch(() => index.value, () => body.value && (body.value.scrollTop = 0))
watch(() => step.value, async () => {
  await nextTick()
  const box = body.value
  const note = box?.querySelector('.ar-p-note.fresh')
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
.ar-presenter {
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
.ar-p-main {
  display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  gap: 20px; padding: 20px; min-height: 0;
}
.ar-p-current { display: flex; flex-direction: column; align-items: center; gap: 16px; min-height: 0; }
.ar-p-screen { position: relative; flex: 0 1 auto; width: 100%; min-height: 0; }
/* the slide's own edge, drawn on top of it (in canvas px: --ar-scale is the stage's scale) */
.ar-p-screen .ar-canvas { border-radius: calc(10px / var(--ar-scale)); }
.ar-p-screen .ar-canvas::after {
  content: ''; position: absolute; inset: 0; z-index: 1000; pointer-events: none;
  border: calc(1px / var(--ar-scale)) solid rgba(255, 255, 255, .16); border-radius: inherit;
}
.ar-p-controls { flex: none; }

.ar-p-side { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 20px; min-height: 0; }
.ar-p-panel {
  display: flex; flex-direction: column; min-height: 0;
  background: var(--p-panel); border: 1px solid var(--p-line); border-radius: 14px;
}
.ar-p-label {
  display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
  padding: 12px 16px 10px;
  font-size: 13px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: var(--p-dim);
}
.ar-p-detail { font-weight: 500; letter-spacing: 0; text-transform: none; font-variant-numeric: tabular-nums; }
.ar-p-next .ar-p-screen { width: auto; margin: 0 16px 16px; }
.ar-p-end {
  position: absolute; inset: 0; display: grid; place-items: center;
  background: #0d0f13; border: 1px solid var(--p-line); border-radius: 10px;
  color: var(--p-dim); font-size: 20px;
}

.ar-p-notes-body {
  position: relative; flex: 1; min-height: 0; overflow-y: auto; padding: 0 20px 20px;
  font-size: clamp(18px, .85vw + 9px, 28px); line-height: 1.5;
  scrollbar-width: thin; scrollbar-color: #3a3f4b transparent;
}
.ar-p-note { padding: .15em 0 .15em .75em; margin: 0 0 .5em -.75em; border-left: 4px solid transparent; border-radius: 2px; }
.ar-p-note.fresh { border-left-color: var(--p-accent); }
.ar-p-note > :first-child { margin-top: 0; }
.ar-p-note :is(p, ul, ol) { margin: 0 0 .5em; }
.ar-p-note :is(ul, ol) { padding-left: 1.2em; }
.ar-p-note strong { color: #fff; }
.ar-p-note code { font: .9em ui-monospace, "SFMono-Regular", Menlo, monospace; background: #2a2e38; padding: .05em .35em; border-radius: 5px; }
.ar-p-empty { margin: 0; color: var(--p-dim); font-size: .8em; }

/* narrow windows: one column, each box at its full size, the page scrolls */
@media (max-width: 900px) {
  .ar-p-main { grid-template-columns: minmax(0, 1fr); grid-auto-rows: max-content; overflow-y: auto; }
  .ar-p-side { grid-template-rows: auto auto; }
  .ar-p-screen { flex: none; }
  .ar-p-notes { min-height: 40vh; }
}
</style>
