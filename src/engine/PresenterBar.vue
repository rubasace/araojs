<!-- The presenter view's top bar: where the deck is, the talk's timer, the wall clock. It ticks on
     its own (four times a second), so the rest of the presenter view does not re-render with it. -->
<template lang="pug">
header.ph-p-bar
  .ph-p-where
    span.ph-p-count {{ deck.index.value + 1 }}#[span.ph-p-of  / {{ deck.total.value }}]
    span.ph-p-title(:title="title") {{ title }}
  .ph-p-timer(:class="[timer.state, tone]")
    .ph-p-times
      span.ph-p-elapsed(title="Tiempo transcurrido") {{ clock(spent) }}
      span.ph-p-sub(v-if="sub") {{ sub }}
    button.ph-p-btn(
      @mousedown.prevent
      @click="$emit('timer', toggle(timer, Date.now()))"
      :title="timer.state === 'running' ? 'Pausar el tiempo' : timer.state === 'paused' ? 'Reanudar el tiempo' : 'Empezar el tiempo'"
    )
      svg(v-if="timer.state === 'running'" viewBox="0 0 24 24"): path(d="M9 6v12M15 6v12")
      svg(v-else viewBox="0 0 24 24"): path.fill(d="M8 5.5v13l10.5-6.5z")
    button.ph-p-btn(
      @mousedown.prevent
      @click="$emit('timer', IDLE)"
      :disabled="timer.state === 'idle'"
      title="Poner el tiempo a cero (vuelve a empezar al avanzar)"
    )
      svg(viewBox="0 0 24 24"): path(d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4")
  time.ph-p-clock(title="Hora") {{ wall }}
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { IDLE, clock, elapsed, phase, toggle } from './timer'

const props = defineProps({
  deck: { type: Object, required: true },
  title: String,
  timer: { type: Object, required: true },
  duration: Number, // ms
})
defineEmits(['timer'])

const now = ref(Date.now())
let tick
onMounted(() => (tick = setInterval(() => (now.value = Date.now()), 250)))
onBeforeUnmount(() => clearInterval(tick))

// whole seconds, as shown: the time left is what the shown time leaves (45:00 = 44:59 + 0:01)
const spent = computed(() => Math.floor(elapsed(props.timer, now.value) / 1000) * 1000)
const left = computed(() => (props.duration ? props.duration - spent.value : null))
const tone = computed(() => (props.duration ? phase(left.value, props.duration) : 'ok'))
const sub = computed(() => {
  const state = { idle: 'empieza al avanzar', paused: 'en pausa' }[props.timer.state]
  const rest = left.value == null ? '' : left.value >= 0 ? `quedan ${clock(left.value)}` : `${clock(left.value)} de más`
  return [state, rest].filter(Boolean).join(' · ')
})
const wall = computed(() => new Date(now.value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
</script>

<style>
.ph-p-bar {
  display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 24px;
  padding: 12px 24px; background: #101216; border-bottom: 1px solid var(--p-line);
  font-variant-numeric: tabular-nums;
}
.ph-p-where { display: flex; align-items: baseline; gap: 14px; min-width: 0; }
.ph-p-count { font-size: 28px; font-weight: 700; white-space: nowrap; }
.ph-p-of { color: var(--p-dim); font-weight: 500; }
.ph-p-title { color: var(--p-dim); font-size: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ph-p-timer { display: flex; align-items: center; gap: 6px; }
.ph-p-times { display: flex; flex-direction: column; align-items: center; min-width: 168px; margin-right: 6px; }
.ph-p-elapsed { font-size: 40px; font-weight: 700; line-height: 1.1; }
.ph-p-sub { font-size: 14px; color: var(--p-dim); white-space: nowrap; }
.ph-p-timer.idle .ph-p-elapsed, .ph-p-timer.paused .ph-p-elapsed { color: var(--p-dim); }
.ph-p-timer.low :is(.ph-p-elapsed, .ph-p-sub) { color: var(--p-low); }
.ph-p-timer.over :is(.ph-p-elapsed, .ph-p-sub) { color: var(--p-over); }

.ph-p-btn {
  display: grid; place-items: center; width: 44px; height: 44px; padding: 0;
  border: 1px solid var(--p-line); border-radius: 10px; background: var(--p-panel); color: inherit;
  cursor: pointer; transition: background .15s, opacity .15s;
}
.ph-p-btn:hover:not(:disabled) { background: #272b34; }
.ph-p-btn:focus-visible { outline: 2px solid var(--p-accent); outline-offset: 2px; }
.ph-p-btn:disabled { opacity: .35; cursor: default; }
.ph-p-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ph-p-btn svg .fill { fill: currentColor; stroke: none; }

.ph-p-clock { justify-self: end; font-size: 40px; font-weight: 700; white-space: nowrap; }

@media (max-width: 900px) {
  .ph-p-bar { gap: 12px; padding: 10px 16px; }
  .ph-p-elapsed, .ph-p-clock { font-size: 28px; }
  .ph-p-count { font-size: 22px; }
  .ph-p-title { display: none; }
  .ph-p-times { min-width: 0; }
}
</style>
