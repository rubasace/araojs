<!-- The presenter view's top bar: where the deck is, the talk's timer, the wall clock. It ticks on
     its own (four times a second), so the rest of the presenter view does not re-render with it.
     Where the deck is and the timer come from useDeck(); the presenter view passes the rest:
     title (of the slide on screen), duration (the talk's length in ms, or null) and setTimer(t),
     which replaces the timer (play/pause, reset). -->
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
    </div>
    <time class="ar-p-clock" title="Hora">{{ wall }}</time>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { IDLE, clock, elapsed, phase, toggle } from '../../core/timer'
import { useDeck } from '../../state/deck'

const props = defineProps({
  title: { type: String, default: '' },
  duration: { type: Number, default: null },
  setTimer: { type: Function, required: true },
})
const deck = useDeck()
const { timer } = deck

const now = ref(Date.now())
let tick
onMounted(() => (tick = setInterval(() => (now.value = Date.now()), 250)))
onBeforeUnmount(() => clearInterval(tick))
// a timer that starts or resumes now is read against now, not against the last tick
watch(timer, () => (now.value = Date.now()))

// whole seconds, as shown: the time left is what the shown time leaves (45:00 = 44:59 + 0:01)
const spent = computed(() => Math.floor(elapsed(timer.value, now.value) / 1000) * 1000)
const left = computed(() => (props.duration ? props.duration - spent.value : null))
const tone = computed(() => (props.duration ? phase(left.value, props.duration) : 'ok'))
const sub = computed(() => {
  const state = { idle: 'empieza al avanzar', paused: 'en pausa' }[timer.value.state]
  const rest = left.value == null ? '' : left.value >= 0 ? `quedan ${clock(left.value)}` : `${clock(left.value)} de más`
  return [state, rest].filter(Boolean).join(' · ')
})
const wall = computed(() => new Date(now.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
</script>

<style>
.ar-p-bar {
  display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 24px;
  padding: 12px 24px; background: #101216; border-bottom: 1px solid var(--p-line);
  font-variant-numeric: tabular-nums;
}
.ar-p-where { display: flex; align-items: baseline; gap: 14px; min-width: 0; }
.ar-p-count { font-size: 28px; font-weight: 700; white-space: nowrap; }
.ar-p-of { color: var(--p-dim); font-weight: 500; }
.ar-p-title { color: var(--p-dim); font-size: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ar-p-timer { display: flex; align-items: center; gap: 6px; }
.ar-p-times { display: flex; flex-direction: column; align-items: center; min-width: 168px; margin-right: 6px; }
.ar-p-elapsed { font-size: 40px; font-weight: 700; line-height: 1.1; }
.ar-p-sub { font-size: 14px; color: var(--p-dim); white-space: nowrap; }
.ar-p-timer.idle .ar-p-elapsed, .ar-p-timer.paused .ar-p-elapsed { color: var(--p-dim); }
.ar-p-timer.low :is(.ar-p-elapsed, .ar-p-sub) { color: var(--p-low); }
.ar-p-timer.over :is(.ar-p-elapsed, .ar-p-sub) { color: var(--p-over); }

.ar-p-btn {
  display: grid; place-items: center; width: 44px; height: 44px; padding: 0;
  border: 1px solid var(--p-line); border-radius: 10px; background: var(--p-panel); color: inherit;
  cursor: pointer; transition: background .15s, opacity .15s;
}
.ar-p-btn:hover:not(:disabled) { background: #272b34; }
.ar-p-btn:focus-visible { outline: 2px solid var(--p-accent); outline-offset: 2px; }
.ar-p-btn:disabled { opacity: .35; cursor: default; }
.ar-p-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ar-p-btn svg .fill { fill: currentColor; stroke: none; }

.ar-p-clock { justify-self: end; font-size: 40px; font-weight: 700; white-space: nowrap; }

@media (max-width: 900px) {
  .ar-p-bar { gap: 12px; padding: 10px 16px; }
  .ar-p-elapsed, .ar-p-clock { font-size: 28px; }
  .ar-p-count { font-size: 22px; }
  .ar-p-title { display: none; }
  .ar-p-times { min-width: 0; }
}
</style>
