<!-- The presenter view (Deck in a window opened with ?presenter): the current slide, large, with the
     controls under it; the next step as the audience will see it; the speaker notes of the slide;
     and a bar with the slide, the talk's timer and the wall clock. Its own dark look, whatever the
     deck's theme: only the slides wear the theme.
     The deck's slides (its default slot) are drawn twice, each copy a Stage: the deck's stage, and
     its preview one step ahead. A second copy of every slide: each slide and addon mounts again
     there, so its side effects run twice in this window and its element ids repeat (useDeck().role
     is 'preview' in that copy, 'presenter' in the current one).
     Where the deck is comes from useDeck(); deck (state/deck.js) brings the internals: the stages,
     where one more press leads, the titles. The bar reads and sets the timer itself
     (useTimer, state/timer.js). The presenter window
     listens to no mouse or touch of its own: only its controls and their keys (Controls.vue) move it. -->
<template>
  <div class="ar-presenter">
    <PresenterBar :title="title" />
    <div class="ar-p-main">
      <section class="ar-p-current" aria-label="Diapositiva actual">
        <div class="ar-p-screen" :style="{ aspectRatio: ratio }">
          <Stage :stage="deck.stage" :width="width" :height="height" :theme="theme">
            <slot />
          </Stage>
        </div>
        <div class="ar-p-controls">
          <Controls docked />
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
            <!-- the Notes of the slide on screen render themselves here (Teleport) -->
            <div class="ar-notes-target" ref="notesOutlet" :style="{ '--_ar-notes-zoom': notesZoom }"></div>
            <p class="ar-p-empty">Sin notas en esta diapositiva</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDeck } from '../state/deck'
import { useNotesOutlet } from '../state/notes'
import Controls from '../components/internal/Controls.vue'
import PresenterBar from '../components/internal/PresenterBar.vue'
import Stage from '../components/internal/Stage.vue'

const props = defineProps({
  deck: { type: Object, required: true }, // createDeck()
  width: { type: Number, required: true }, // of the canvas
  height: { type: Number, required: true },
})
const { index, step, steps, theme } = useDeck()
const ratio = computed(() => `${props.width} / ${props.height}`)
// next: { index, step, end }, where one more press leads
const { next } = props.deck

// the notes panel is the outlet of the Notes of the slide on screen (state/notes.js)
const notesOutlet = useNotesOutlet()
// Notes are slide content: what they hold is sized in canvas px (a Snippet, an Icon size). Their
// box is NOTES_WIDTH canvas px wide, zoomed to the width of the panel; their text keeps the size
// of the panel (it is divided by the zoom).
const NOTES_WIDTH = 1000
const notesZoom = ref(0.5)
let resize
onMounted(() => {
  resize = new ResizeObserver(([e]) => { notesZoom.value = Math.max(0.1, e.contentRect.width / NOTES_WIDTH) })
  resize.observe(body.value)
})
onBeforeUnmount(() => resize?.disconnect())

// the title of the slide on screen, re-read on every move
const title = computed(() => {
  index.value
  return props.deck.titles()[index.value] || ''
})

// the window says what it is, in its title (once: a remount after an edit does not add it again)
const TITLE = 'Presentador · '
onMounted(() => {
  if (!document.title.startsWith(TITLE)) document.title = TITLE + document.title
})

const nextDetail = computed(() => {
  const { index: at, step: s, end } = next.value
  if (end) return ''
  if (at === index.value) return `Paso ${s} de ${steps.value}`
  return `Diapositiva ${at + 1}`
})

// A new slide starts its notes from the top. A step marks what its v-steps bring into the notes
// (those of that very step, the directive's record on the element: directives/step.js) and
// scrolls it into view. Only the notes box scrolls (scrollIntoView would also scroll the page of
// a narrow window).
const FRESH = 'ar-note-fresh'
const body = ref()
watch(() => index.value, () => body.value && (body.value.scrollTop = 0))
watch(() => step.value, async (s) => {
  await nextTick()
  const box = body.value
  const outlet = notesOutlet.value
  if (!box || !outlet) return
  outlet.querySelectorAll('.' + FRESH).forEach((el) => el.classList.remove(FRESH))
  const fresh = [...outlet.querySelectorAll('*')].filter((el) => el.__phStep?.n === s && s > 1)
  fresh.forEach((el) => el.classList.add(FRESH))
  if (!fresh.length) return
  // in the box's own px (the notes are zoomed): rects, not offsets
  const at = box.getBoundingClientRect().top - box.scrollTop
  const rects = fresh.map((el) => el.getBoundingClientRect())
  const top = Math.min(...rects.map((r) => r.top)) - at
  const h = Math.max(...rects.map((r) => r.bottom)) - at - top + parseFloat(getComputedStyle(box).paddingBottom)
  const to = top < box.scrollTop ? top
    : top + h > box.scrollTop + box.clientHeight ? Math.min(top, top + h - box.clientHeight)
    : null
  if (to != null) box.scrollTo({ top: to, behavior: 'smooth' })
})
</script>

<style>
/* its own dark look, whatever the deck theme (the --ar-presenter-* tokens, tokens.css): only the
   slides wear the theme. Window px, not canvas px. */
.ar-presenter {
  position: fixed; inset: 0;
  display: grid; grid-template-rows: auto minmax(0, 1fr);
  background: var(--ar-presenter-bg); color: var(--ar-presenter-fg);
  font: var(--ar-ui-text)/1.4 var(--ar-ui-font);
}
.ar-p-main {
  display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  gap: 20px; padding: 20px; min-height: 0;
}
.ar-p-current { display: flex; flex-direction: column; align-items: center; gap: 16px; min-height: 0; }
.ar-p-screen { position: relative; flex: 0 1 auto; width: 100%; min-height: 0; }
/* the slide's own edge, drawn on top of it (in canvas px: --ar-scale is the stage's scale) */
.ar-p-screen .ar-canvas { border-radius: calc(var(--ar-presenter-radius) / var(--ar-scale)); }
.ar-p-screen .ar-canvas::after {
  content: ''; position: absolute; inset: 0; z-index: 1000; pointer-events: none;
  border: calc(1px / var(--ar-scale)) solid var(--ar-presenter-edge); border-radius: inherit;
}
.ar-p-controls { flex: none; }

.ar-p-side { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 20px; min-height: 0; }
.ar-p-panel {
  display: flex; flex-direction: column; min-height: 0;
  background: var(--ar-presenter-panel); border: 1px solid var(--ar-presenter-line);
  border-radius: calc(var(--ar-presenter-radius) * 1.4);
}
.ar-p-label {
  display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
  padding: 12px 16px 10px;
  font-size: calc(var(--ar-ui-text) * .8125); font-weight: 650; letter-spacing: .08em; text-transform: uppercase;
  color: var(--ar-presenter-dim);
}
.ar-p-detail { font-weight: 500; letter-spacing: 0; text-transform: none; font-variant-numeric: tabular-nums; }
.ar-p-next .ar-p-screen { width: auto; margin: 0 16px 16px; }
.ar-p-end {
  position: absolute; inset: 0; display: grid; place-items: center;
  background: var(--ar-presenter-frame); border: 1px solid var(--ar-presenter-line); border-radius: var(--ar-presenter-radius);
  color: var(--ar-presenter-dim); font-size: calc(var(--ar-ui-text) * 1.25);
}

.ar-notes-target:not(:empty) + .ar-p-empty { display: none; }
.ar-notes-target { width: 1000px; zoom: var(--_ar-notes-zoom); font-size: calc(var(--ar-presenter-notes-size) / var(--_ar-notes-zoom)); }
.ar-p-notes-body {
  position: relative; flex: 1; min-height: 0; overflow-y: auto; padding: 0 20px 20px; contain: inline-size;
  font-size: var(--ar-presenter-notes-size); line-height: 1.5;
  scrollbar-width: thin; scrollbar-color: var(--ar-presenter-scrollbar) transparent;
}
.ar-notes-target .ar-note { margin: 0 0 .5em; }
.ar-notes-target .ar-note > :first-child { margin-top: 0; }
.ar-notes-target .ar-note :is(p, ul, ol) { margin: 0 0 .5em; }
.ar-notes-target .ar-note :is(ul, ol) { padding-left: 1.2em; }
.ar-notes-target .ar-note strong { color: var(--ar-presenter-strong); }
/* what the step on screen has just brought */
.ar-notes-target .ar-note-fresh {
  border-radius: 4px; background: color-mix(in srgb, var(--ar-presenter-accent) 16%, transparent);
  box-shadow: 0 0 0 .2em color-mix(in srgb, var(--ar-presenter-accent) 16%, transparent);
}
.ar-notes-target .ar-note code {
  font: .9em var(--ar-ui-mono); background: var(--ar-presenter-code-bg); padding: .05em .35em;
  border-radius: calc(var(--ar-presenter-radius) * .5);
}
.ar-p-empty { margin: 0; color: var(--ar-presenter-dim); font-size: .8em; }

/* narrow windows: one column, each box at its full size, the page scrolls */
@media (max-width: 900px) {
  .ar-p-main { grid-template-columns: minmax(0, 1fr); grid-auto-rows: max-content; overflow-y: auto; }
  .ar-p-side { grid-template-rows: auto auto; }
  .ar-p-screen { flex: none; }
  .ar-p-notes { min-height: 40vh; }
}
</style>
