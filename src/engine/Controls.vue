<!-- Built-in deck controls: floating panel, shown on mouse move, hidden when idle.
     docked: always shown, in the flow of the page (the presenter view places it under the slide). -->
<template lang="pug">
nav.ph-controls(
  ref="root"
  :class="{ visible: docked || visible || hovering || open, docked }"
  @mouseenter="hovering = true"
  @mouseleave="hovering = false"
  aria-label="Controles de la presentación"
)
  button.ph-btn.ph-edge(@mousedown.prevent @click="deck.go(0)" :disabled="atStart" title="Primera (Inicio)")
    svg(viewBox="0 0 24 24"): path(d="M18 17l-5-5 5-5M11 17l-5-5 5-5")
  button.ph-btn(@mousedown.prevent @click="deck.prev()" :disabled="atStart" title="Anterior (←)")
    svg(viewBox="0 0 24 24"): path(d="M15 18l-6-6 6-6")

  .ph-ctl-mid
    button.ph-counter(@mousedown.prevent @click="toggle('slides')" :class="{ active: open === 'slides' }" title="Ir a… (g)")
      span.cur {{ deck.index.value + 1 }}
      span.sep /
      span.tot {{ deck.total.value }}
    .ph-dots(v-if="deck.steps.value > 1" :aria-label="`Paso ${deck.step.value} de ${deck.steps.value}`")
      button.ph-dot(
        v-for="s in deck.steps.value" :key="s"
        :class="{ on: s <= deck.step.value }"
        @mousedown.prevent
        @click="deck.go(deck.index.value, s)"
        :title="`Paso ${s}`"
      )

  button.ph-btn(@mousedown.prevent @click="deck.next()" :disabled="atEnd" title="Siguiente (→)")
    svg(viewBox="0 0 24 24"): path(d="M9 18l6-6-6-6")
  button.ph-btn.ph-edge(@mousedown.prevent @click="deck.go(deck.total.value - 1, Infinity)" :disabled="atEnd" title="Última (Fin)")
    svg(viewBox="0 0 24 24"): path(d="M6 17l5-5-5-5M13 17l5-5-5-5")

  .ph-divider
  button.ph-btn(
    v-if="themes.length > 1"
    @mousedown.prevent @click="toggle('themes')"
    :class="{ active: open === 'themes' }"
    :title="`Tema: ${theme} (t)`"
  )
    //- palette
    svg(viewBox="0 0 24 24")
      path(d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z")
      circle.fill(cx="7.5" cy="11" r="1.3")
      circle.fill(cx="10" cy="7" r="1.3")
      circle.fill(cx="14.5" cy="7" r="1.3")
      circle.fill(cx="17" cy="10.5" r="1.3")
  button.ph-btn(v-if="!docked" @mousedown.prevent @click="$emit('presenter')" title="Vista del presentador (p)")
    //- a screen with notes under it
    svg(viewBox="0 0 24 24")
      rect(x="3" y="3.5" width="18" height="11" rx="2")
      path(d="M7 18.5h10M9 21h6")
  button.ph-btn(@mousedown.prevent @click="$emit('fullscreen')" :title="fullscreen ? 'Salir de pantalla completa (f)' : 'Pantalla completa (f)'")
    svg(v-if="!fullscreen" viewBox="0 0 24 24"): path(d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5")
    svg(v-else viewBox="0 0 24 24"): path(d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5")

  Transition(name="ph-pop")
    .ph-panel.ph-slides(v-if="open === 'slides'" role="dialog" aria-label="Ir a slide")
      input.ph-search(
        ref="search"
        v-model="query"
        placeholder="Número o título…"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="matches[sel] && jump(matches[sel].i)"
        @keydown.esc.prevent="close"
      )
      .ph-list(ref="listEl")
        button.ph-item(
          v-for="(m, k) in matches" :key="m.i"
          :class="{ current: m.i === deck.index.value, sel: k === sel }"
          @click="jump(m.i)"
          @mousemove="sel = k"
        )
          span.n {{ m.i + 1 }}
          span.t {{ m.t || 'Sin título' }}
        .ph-empty(v-if="!matches.length") Nada coincide

  Transition(name="ph-pop")
    .ph-panel.ph-themes(v-if="open === 'themes'" role="menu" aria-label="Tema")
      button.ph-item(
        v-for="t in themes" :key="t"
        :class="{ current: t === theme }"
        @mousedown.prevent
        @click="pickTheme(t)"
        role="menuitemradio" :aria-checked="t === theme"
      )
        span.swatch(:data-theme="t")
        span.t {{ t }}
        svg.check(v-if="t === theme" viewBox="0 0 24 24"): path(d="M5 12l5 5 9-10")
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  deck: Object,
  visible: Boolean,
  theme: String,
  themes: { type: Array, default: () => [] },
  fullscreen: Boolean,
  titles: { type: Array, default: () => [] },
  docked: Boolean,
})
const emit = defineEmits(['theme', 'fullscreen', 'presenter'])

const root = ref()
const hovering = ref(false)
const open = ref(null) // null | 'slides' | 'themes'
const atStart = computed(() => props.deck.index.value === 0 && props.deck.step.value === 1)
const atEnd = computed(() =>
  props.deck.index.value === props.deck.total.value - 1 && props.deck.step.value === props.deck.steps.value)

// ---- jump menu --------------------------------------------------------------
const query = ref('')
const sel = ref(0)
const search = ref()
const listEl = ref()
// a number matches by slide number prefix; text matches the title
const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  const all = props.titles.map((t, i) => ({ i, t }))
  if (!q) return all
  if (/^\d+$/.test(q)) return all.filter((m) => String(m.i + 1).startsWith(q))
  return all.filter((m) => m.t.toLowerCase().includes(q))
})
watch(query, () => (sel.value = 0))
function move(d) {
  const n = matches.value.length
  if (!n) return
  sel.value = (sel.value + d + n) % n
  nextTick(() => listEl.value?.querySelector('.sel')?.scrollIntoView({ block: 'nearest' }))
}
async function openSlides(initial = '') {
  query.value = initial
  open.value = 'slides'
  await nextTick()
  if (!initial) sel.value = Math.max(0, matches.value.findIndex((m) => m.i === props.deck.index.value))
  search.value?.focus()
  listEl.value?.querySelector(initial ? '.sel' : '.current')?.scrollIntoView({ block: 'center' })
}
function jump(i) {
  props.deck.go(i)
  close()
}

// ---- themes -----------------------------------------------------------------
function pickTheme(t) {
  emit('theme', t)
  close()
}

// ---- open / close -----------------------------------------------------------
function toggle(which) {
  if (open.value === which) return close()
  which === 'slides' ? openSlides() : (open.value = which)
}
function close() {
  open.value = null
  search.value?.blur()
}
// click anywhere outside the controls closes any open panel
function onPointerDown(e) {
  if (open.value && !root.value?.contains(e.target)) close()
}
onMounted(() => document.addEventListener('pointerdown', onPointerDown, true))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown, true))

defineExpose({
  openMenu: openSlides,
  toggleMenu: () => toggle('slides'),
  closeMenu: close,
})
</script>

<style>
.ph-controls {
  /* frosted glass: strong blur + light top sheen + specular edge */
  --c-tint: rgba(28, 28, 34, .84);
  --c-tint-panel: rgba(28, 28, 34, .92);
  --c-sheen: linear-gradient(180deg, rgba(255, 255, 255, .16), rgba(255, 255, 255, .04) 45%, rgba(255, 255, 255, .02));
  --c-glass-shadow: 0 18px 50px rgba(0, 0, 0, .35), 0 2px 8px rgba(0, 0, 0, .2),
    inset 0 1px 0 rgba(255, 255, 255, .28), inset 0 -1px 0 rgba(255, 255, 255, .05),
    inset 0 0 0 .5px rgba(255, 255, 255, .08);
  --c-blur: blur(28px) saturate(180%) brightness(1.05);
  --c-fg: rgba(255, 255, 255, .94);
  --c-dim: rgba(255, 255, 255, .5);
  --c-line: rgba(255, 255, 255, .14);
  --c-hover: rgba(255, 255, 255, .1);
  --c-active: rgba(255, 255, 255, .16);
  position: absolute; left: 50%; bottom: 48px; z-index: 100;
  display: flex; align-items: center; gap: 4px;
  padding: 8px;
  background: var(--c-sheen), var(--c-tint);
  backdrop-filter: var(--c-blur);
  -webkit-backdrop-filter: var(--c-blur);
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 16px;
  box-shadow: var(--c-glass-shadow);
  color: var(--c-fg);
  font: 500 16px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-variant-numeric: tabular-nums;
  opacity: 0;
  transform: translate(-50%, 14px);
  transition: opacity .25s ease, transform .25s ease;
  pointer-events: none;
  user-select: none;
}
.ph-controls.visible { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
.ph-controls.docked { position: relative; left: auto; bottom: auto; transform: none; transition: none; }

.ph-btn {
  display: grid; place-items: center;
  width: 44px; height: 44px; padding: 0;
  border: 0; border-radius: 9px; background: transparent; color: inherit;
  cursor: pointer; transition: background .15s, opacity .15s;
}
.ph-btn:hover:not(:disabled) { background: var(--c-hover); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .1); }
.ph-btn.active { background: var(--c-active); }
.ph-btn:disabled { opacity: .28; cursor: default; }
.ph-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8;
  stroke-linecap: round; stroke-linejoin: round; }
.ph-btn svg .fill { fill: currentColor; stroke: none; }

.ph-ctl-mid { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 10px; min-width: 88px; }
.ph-counter {
  border: 0; background: transparent; color: inherit; cursor: pointer;
  padding: 6px 12px; border-radius: 8px; font: inherit; font-size: 17px; transition: background .15s;
}
.ph-counter:hover { background: var(--c-hover); }
.ph-counter.active { background: var(--c-active); }
.ph-counter .sep, .ph-counter .tot { color: var(--c-dim); }
.ph-counter .sep { margin: 0 5px; }

.ph-dots { display: flex; gap: 5px; }
.ph-dot {
  width: 7px; height: 4px; padding: 0; border: 0; border-radius: 2px;
  background: var(--c-dim); opacity: .45; cursor: pointer; transition: all .2s;
}
.ph-dot.on { background: var(--ph-accent, #fff); opacity: 1; width: 16px; }

.ph-divider { width: 1px; height: 26px; background: var(--c-line); margin: 0 6px; }

/* popover panels */
.ph-panel {
  position: absolute; bottom: calc(100% + 12px);
  display: flex; flex-direction: column;
  padding: 8px;
  background: var(--c-sheen), var(--c-tint-panel);
  backdrop-filter: var(--c-blur);
  -webkit-backdrop-filter: var(--c-blur);
  border: 1px solid rgba(255, 255, 255, .16); border-radius: 16px;
  box-shadow: var(--c-glass-shadow);
}
.ph-slides { left: 50%; transform: translateX(-50%); width: min(380px, calc(100vw - 24px)); }

/* narrow screens (phones): smaller buttons, no first/last, panels fit the width */
@media (max-width: 560px) {
  .ph-controls { bottom: 20px; gap: 2px; padding: 6px; }
  .ph-btn { width: 40px; height: 40px; }
  .ph-btn.ph-edge { display: none; }
  .ph-ctl-mid { min-width: 64px; padding: 0 4px; }
  .ph-divider { margin: 0 2px; }
}
.ph-themes { right: 0; min-width: 220px; }

.ph-search {
  margin: 0 0 8px; padding: 11px 13px;
  border: 1px solid var(--c-line); border-radius: 9px; outline: none;
  background: rgba(255, 255, 255, .08); color: inherit; font: inherit;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, .25);
}
.ph-search:focus { border-color: color-mix(in srgb, var(--ph-accent, #fff) 70%, transparent); }
.ph-search::placeholder { color: var(--c-dim); }
.ph-list { max-height: min(50vh, 440px); overflow-y: auto; scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.2) transparent; }
.ph-empty { padding: 14px; color: var(--c-dim); text-align: center; }

.ph-item {
  display: flex; gap: 12px; align-items: center; width: 100%;
  padding: 10px 12px; border: 0; border-radius: 8px;
  background: transparent; color: inherit; font: inherit; font-size: 15px; text-align: left; cursor: pointer;
}
.ph-item:hover, .ph-item.sel { background: var(--c-hover); }
.ph-item .n { color: var(--c-dim); min-width: 1.8em; text-align: right; }
.ph-item.current .n { color: var(--ph-accent, #fff); }
.ph-item.current .t { font-weight: 650; }
.ph-item .t { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ph-item .swatch {
  width: 18px; height: 18px; border-radius: 5px; flex: none;
  background: linear-gradient(135deg, var(--ph-bg) 50%, var(--ph-accent) 50%);
  border: 1px solid var(--c-line);
}
.ph-item .check { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.2;
  stroke-linecap: round; stroke-linejoin: round; }

.ph-pop-enter-active, .ph-pop-leave-active { transition: opacity .18s, translate .18s; }
.ph-pop-enter-from, .ph-pop-leave-to { opacity: 0; translate: 0 6px; }
</style>
