<!-- The presenter view's top bar: where the deck is, the talk's timer, the wall clock. It ticks on
     its own (four times a second), so the rest of the presenter view does not re-render with it.
     Where the deck is, the timer and the talk's length come from useDeck(); the presenter view
     passes the rest: title (of the slide on screen), setTimer(t), which replaces the timer
     (play/pause, reset), deckDuration (the deck's own length in ms, or null) and setDuration(ms),
     which sets the talk's length for every window of the deck (null: back to the deck's).
     The length's button opens an editor: the same formats as Deck(duration), from 1 minute to 24
     hours; Enter applies, Escape, a click elsewhere or the focus leaving it cancels. While the
     focus is in it, no key of the deck acts. Closed from inside, it leaves the focus next to the
     button, not on it, so Space and Enter move the slides again (below, close()). -->
<template>
  <header class="ar-p-bar">
    <div class="ar-p-where">
      <span class="ar-p-count">{{ deck.index.value + 1 }}<span class="ar-p-of"> / {{ deck.total.value }}</span></span>
      <span class="ar-p-title" :title="title">{{ title }}</span>
    </div>
    <div class="ar-p-timer" :class="[timer.state, tone]">
      <div class="ar-p-times">
        <span class="ar-p-elapsed" title="Tiempo transcurrido">{{ clock(spent) }}</span>
        <span class="ar-p-sub" v-if="sub">{{ sub }}</span>
      </div>
      <button
        class="ar-p-btn"
        @mousedown.prevent
        @click="setTimer(toggle(timer, Date.now()))"
        :title="timer.state === 'running' ? 'Pausar el tiempo' : timer.state === 'paused' ? 'Reanudar el tiempo' : 'Empezar el tiempo'"
      >
        <svg v-if="timer.state === 'running'" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12" /></svg>
        <svg v-else viewBox="0 0 24 24"><path class="fill" d="M8 5.5v13l10.5-6.5z" /></svg>
      </button>
      <button
        class="ar-p-btn"
        @mousedown.prevent
        @click="setTimer(IDLE)"
        :disabled="timer.state === 'idle'"
        title="Poner el tiempo a cero (vuelve a empezar al avanzar)"
      >
        <svg viewBox="0 0 24 24"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" /></svg>
      </button>
      <!-- where the focus rests when the editor closes from inside it: not a button, so Space
           and Enter go back to the slides, and Tab reaches the length's button again -->
      <div ref="group" class="ar-p-length" role="group" aria-label="Duración de la charla" tabindex="-1">
        <button
          ref="trigger"
          class="ar-p-btn ar-p-dur"
          :class="{ changed }"
          @mousedown.prevent
          @click="editing ? cancel() : edit()"
          :aria-label="durationLabel"
          :title="durationLabel"
          aria-haspopup="dialog"
          :aria-expanded="editing"
          :aria-controls="editing ? ids.editor : null"
        >
          <svg viewBox="0 0 24 24"><path d="M6.5 3h11M6.5 21h11M8 3c0 4.5 4 5 4 9s-4 4.5-4 9M16 3c0 4.5-4 5-4 9s4 4.5 4 9" /></svg>
          <span>{{ duration ? clock(duration) : 'duración' }}</span>
        </button>
        <!-- data-ar-own-keys: no key of the deck acts while the focus is anywhere in it;
             tabindex -1: a click on its padding keeps the focus in it (else the group takes it) -->
        <form
          v-if="editing"
          ref="editor"
          :id="ids.editor"
          class="ar-p-edit"
          role="dialog"
          :aria-labelledby="ids.label"
          tabindex="-1"
          data-ar-own-keys
          @submit.prevent="apply"
          @keydown.esc.prevent="cancel"
          @focusout="leaving"
        >
          <label :id="ids.label" :for="ids.input">Duración de la charla</label>
          <div class="ar-p-edit-row">
            <input
              ref="input"
              :id="ids.input"
              v-model="text"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="45m"
              :aria-invalid="!!error"
              :aria-describedby="`${ids.msg} ${ids.note}`"
              @input="typing"
            />
            <button class="ar-p-edit-btn ar-p-apply" type="submit">Aplicar</button>
          </div>
          <p :id="ids.msg" class="ar-p-edit-msg" :class="{ bad: error }" aria-live="polite">
            {{ error || '90, 45m, 1h30, 45:00… · Intro aplica, Esc cancela' }}
          </p>
          <p :id="ids.note" class="ar-p-edit-note" aria-live="polite">{{ notice }}</p>
          <button v-if="changed" class="ar-p-edit-btn ar-p-reset" type="button" @click="reset">
            {{ deckDuration ? `Volver a la de la presentación: ${clock(deckDuration)}` : 'Quitar la cuenta atrás' }}
          </button>
        </form>
      </div>
    </div>
    <time class="ar-p-clock" title="Hora">{{ wall }}</time>
  </header>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import { IDLE, MIN_DURATION, clock, elapsed, parseDuration, phase, toggle, withinBounds } from '../../core/timer'
import { useDeck } from '../../state/deck'

const props = defineProps({
  title: { type: String, default: '' },
  setTimer: { type: Function, required: true },
  deckDuration: { type: Number, default: null },
  setDuration: { type: Function, required: true },
})
const deck = useDeck()
const { timer, duration } = deck

const now = ref(Date.now())
let tick
onMounted(() => (tick = setInterval(() => (now.value = Date.now()), 250)))
onBeforeUnmount(() => clearInterval(tick))
// a timer that starts or resumes now is read against now, not against the last tick
watch(timer, () => (now.value = Date.now()))

// whole seconds, as shown: the time left is what the shown time leaves (45:00 = 44:59 + 0:01)
const spent = computed(() => Math.floor(elapsed(timer.value, now.value) / 1000) * 1000)
const left = computed(() => (duration.value ? duration.value - spent.value : null))
const tone = computed(() => (duration.value ? phase(left.value, duration.value) : 'ok'))
const sub = computed(() => {
  const state = { idle: 'empieza al avanzar', paused: 'en pausa' }[timer.value.state]
  const rest = left.value == null ? '' : left.value >= 0 ? `quedan ${clock(left.value)}` : `${clock(left.value)} de más`
  return [state, rest].filter(Boolean).join(' · ')
})
const wall = computed(() => new Date(now.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

// ---- the talk's length, edited here --------------------------------------------------------
// changed: set here (in this window or another), not the deck's own
const changed = computed(() => duration.value !== props.deckDuration)
const durationLabel = computed(() => {
  const d = duration.value
  if (!d) return 'Poner una duración a la charla (cuenta atrás)'
  const own = props.deckDuration ? `la de la presentación: ${clock(props.deckDuration)}` : 'la presentación no tiene'
  return changed.value ? `Duración de la charla: ${clock(d)}, cambiada (${own}). Cambiarla` : `Duración de la charla: ${clock(d)}. Cambiarla`
})
const id = useId()
const ids = { editor: `${id}-editor`, label: `${id}-label`, input: `${id}-input`, msg: `${id}-msg`, note: `${id}-note` }
const editing = ref(false)
const text = ref('')
const error = ref('')
const notice = ref('') // the length changed elsewhere while the editor was open
let typed = false // something was typed in the field since it opened
const group = ref()
const trigger = ref()
const editor = ref()
const input = ref()
const shown = (ms) => (ms ? clock(ms) : '')

async function edit() {
  text.value = shown(duration.value)
  typed = false
  error.value = notice.value = ''
  editing.value = true
  await nextTick()
  input.value?.focus()
  input.value?.select()
}
function typing() {
  typed = true
  error.value = ''
}
// Closing from inside (Enter, Esc, the reset, the button again) leaves the focus on the group
// around the button, not on the button: there Space and Enter are the deck's again (a focused
// button keeps them, and would reopen the editor instead of moving the slides), and the next Tab
// reaches the button. Closing because the focus left (focusout) or a press elsewhere leaves the
// focus where it went.
function close(refocus) {
  editing.value = false
  if (refocus) group.value?.focus({ preventScroll: true })
}
function apply() {
  const t = text.value.trim()
  const ms = parseDuration(t)
  if (ms == null || !withinBounds(ms)) {
    error.value = !t ? 'Escribe una duración: 90, 45m, 1h30 o 45:00'
      : ms == null ? `«${t}» no es una duración: prueba 90, 45m, 1h30 o 45:00`
      : ms < MIN_DURATION ? `«${t}» es muy corta: de 1 minuto a 24 horas`
      : `«${t}» es muy larga: de 1 minuto a 24 horas`
    input.value?.focus()
    return
  }
  props.setDuration(ms)
  close(true)
}
function reset() {
  props.setDuration(null)
  close(true)
}
const cancel = () => close(true)
// The focus left the editor (Tab past its last button, Shift+Tab to the length's button, a click
// on something focusable): that cancels. The window losing the focus (another window or app)
// does not: the focus comes back to the field with it. Read once the focus has landed.
function leaving(e) {
  if (editor.value?.contains(e.relatedTarget)) return
  setTimeout(() => {
    if (editing.value && document.hasFocus() && !editor.value?.contains(document.activeElement)) close(false)
  })
}
// a press anywhere else cancels, a button that takes no focus included (the button toggles it on
// its own)
useEventListener(document, 'pointerdown', (e) => {
  if (editing.value && !editor.value?.contains(e.target) && !trigger.value?.contains(e.target)) close(false)
}, true)
// The length changed elsewhere (another window, an edit of the deck) while the editor is open:
// the field follows it if nothing was typed in it, typed text stays; either way a notice says
// so, so that Enter never overwrites the new value unknowingly.
watch(duration, (ms) => {
  if (!editing.value) return
  notice.value = `Ha cambiado mientras editabas: ${ms ? `ahora ${clock(ms)}` : 'ya no hay cuenta atrás'}`
  if (typed) return
  text.value = shown(ms)
  error.value = ''
  if (document.activeElement === input.value) nextTick(() => input.value?.select())
})
</script>

<style>
.ar-p-bar {
  display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 24px;
  padding: 12px 24px; background: var(--ar-presenter-bar); border-bottom: 1px solid var(--ar-presenter-line);
  font-variant-numeric: tabular-nums;
}
.ar-p-where { display: flex; align-items: baseline; gap: 14px; min-width: 0; }
.ar-p-count { font-size: calc(var(--ar-ui-text) * 1.75); font-weight: 700; white-space: nowrap; }
.ar-p-of { color: var(--ar-presenter-dim); font-weight: 500; }
.ar-p-title {
  color: var(--ar-presenter-dim); font-size: calc(var(--ar-ui-text) * 1.125);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.ar-p-timer { position: relative; display: flex; align-items: center; gap: 6px; }
.ar-p-times { display: flex; flex-direction: column; align-items: center; min-width: 168px; margin-right: 6px; }
.ar-p-elapsed { font-size: calc(var(--ar-ui-text) * 2.5); font-weight: 700; line-height: 1.1; }
.ar-p-sub { font-size: calc(var(--ar-ui-text) * .875); color: var(--ar-presenter-dim); white-space: nowrap; }
.ar-p-timer.idle .ar-p-elapsed, .ar-p-timer.paused .ar-p-elapsed { color: var(--ar-presenter-dim); }
.ar-p-timer.low :is(.ar-p-elapsed, .ar-p-sub) { color: var(--ar-presenter-low); }
.ar-p-timer.over :is(.ar-p-elapsed, .ar-p-sub) { color: var(--ar-presenter-over); }

.ar-p-btn {
  display: grid; place-items: center; width: 44px; height: 44px; padding: 0;
  border: 1px solid var(--ar-presenter-line); border-radius: var(--ar-presenter-radius);
  background: var(--ar-presenter-panel); color: inherit;
  cursor: pointer; transition: background var(--ar-ui-duration-fast), opacity var(--ar-ui-duration-fast);
}
.ar-p-btn:hover:not(:disabled) { background: var(--ar-presenter-hover); }
.ar-p-btn:focus-visible { outline: 2px solid var(--ar-presenter-accent); outline-offset: 2px; }
.ar-p-btn:disabled { opacity: .35; cursor: default; }
.ar-p-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ar-p-btn svg .fill { fill: currentColor; stroke: none; }

/* the talk's length: its group (where the focus rests once the editor closes: no ring, it is
   not a control, Tab goes on to the button), its button (the accent while it is not the deck's)
   and its editor */
.ar-p-length { display: flex; }
.ar-p-length:focus, .ar-p-edit:focus { outline: none; }
.ar-p-dur {
  grid-auto-flow: column; gap: 8px; width: auto; padding: 0 12px;
  font: inherit; font-size: var(--ar-ui-text); font-weight: 600;
}
.ar-p-dur.changed { color: var(--ar-presenter-accent); }
.ar-p-edit {
  position: absolute; top: calc(100% + 12px); left: 50%; z-index: 200; transform: translateX(-50%);
  display: flex; flex-direction: column; gap: 10px; width: 340px; padding: 14px 16px 16px;
  background: var(--ar-presenter-panel); border: 1px solid var(--ar-presenter-line);
  border-radius: calc(var(--ar-presenter-radius) * 1.2);
  box-shadow: var(--ar-presenter-shadow);
}
.ar-p-edit label {
  font-size: calc(var(--ar-ui-text) * .8125); font-weight: 650; letter-spacing: .08em; text-transform: uppercase;
  color: var(--ar-presenter-dim);
}
.ar-p-edit-row { display: flex; gap: 8px; }
.ar-p-edit input {
  flex: 1; min-width: 0; height: 40px; padding: 0 12px;
  border: 1px solid var(--ar-presenter-line); border-radius: calc(var(--ar-presenter-radius) * .8);
  background: var(--ar-presenter-bg); color: var(--ar-presenter-fg);
  font: inherit; font-size: calc(var(--ar-ui-text) * 1.125); font-variant-numeric: tabular-nums;
}
.ar-p-edit input[aria-invalid="true"] { border-color: var(--ar-presenter-over); }
.ar-p-edit-btn {
  height: 40px; padding: 0 14px; border: 1px solid var(--ar-presenter-line); border-radius: calc(var(--ar-presenter-radius) * .8);
  background: var(--ar-presenter-bg); color: inherit; font: inherit; font-size: calc(var(--ar-ui-text) * .9375); cursor: pointer;
}
.ar-p-edit-btn:hover { border-color: var(--ar-presenter-dim); }
.ar-p-apply {
  background: var(--ar-presenter-accent); border-color: var(--ar-presenter-accent); color: var(--ar-presenter-bg);
  font-weight: 650;
}
.ar-p-reset { align-self: stretch; }
.ar-p-edit :is(input, .ar-p-edit-btn):focus-visible { outline: 2px solid var(--ar-presenter-accent); outline-offset: 2px; }
.ar-p-edit-msg { margin: 0; font-size: calc(var(--ar-ui-text) * .8125); line-height: 1.4; color: var(--ar-presenter-dim); }
.ar-p-edit-msg.bad { color: var(--ar-presenter-over); }
.ar-p-edit-note { margin: 0; font-size: calc(var(--ar-ui-text) * .8125); line-height: 1.4; color: var(--ar-presenter-low); }
.ar-p-edit-note:empty { display: none; }

.ar-p-clock { justify-self: end; font-size: calc(var(--ar-ui-text) * 2.5); font-weight: 700; white-space: nowrap; }

@media (max-width: 900px) {
  .ar-p-bar { gap: 12px; padding: 10px 16px; }
  .ar-p-elapsed, .ar-p-clock { font-size: calc(var(--ar-ui-text) * 1.75); }
  .ar-p-count { font-size: calc(var(--ar-ui-text) * 1.375); }
  .ar-p-title { display: none; }
  .ar-p-times { min-width: 0; }
}
</style>
