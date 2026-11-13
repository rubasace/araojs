<!-- Built-in deck controls: floating panel, shown on mouse move, hidden when idle.
     docked: always shown, in the flow of the page (the presenter view places it under the slide).
     shown: the floating panel is shown (the audience view: the mouse moved, a tap in the middle).
     titles: every slide's title, for the jump menu.
     Where the deck is and what it does come from useDeck(). The view opens and closes the jump
     menu from the keyboard: openMenu(digits), toggleMenu(), closeMenu(). -->
<template>
  <nav
    class="ar-controls"
    ref="root"
    :class="{ visible: docked || shown || hovering || open, docked }"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    aria-label="Controles de la presentación"
  >
    <button class="ar-btn ar-edge" @mousedown.prevent @click="deck.go(0)" :disabled="atStart" title="Primera (Inicio)">
      <svg viewBox="0 0 24 24"><path d="M18 17l-5-5 5-5M11 17l-5-5 5-5" /></svg>
    </button>
    <button class="ar-btn" @mousedown.prevent @click="deck.prev()" :disabled="atStart" title="Anterior (←)">
      <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
    </button>

    <div class="ar-ctl-mid">
      <button class="ar-counter" @mousedown.prevent @click="toggle('slides')" :class="{ active: open === 'slides' }" title="Ir a… (g)">
        <span class="cur">{{ deck.index.value + 1 }}</span>
        <span class="sep">/</span>
        <span class="tot">{{ deck.total.value }}</span>
      </button>
      <div class="ar-dots" v-if="deck.steps.value > 1" :aria-label="`Paso ${deck.step.value} de ${deck.steps.value}`">
        <button
          class="ar-dot"
          v-for="s in deck.steps.value" :key="s"
          :class="{ on: s <= deck.step.value }"
          @mousedown.prevent
          @click="deck.go(deck.index.value, s)"
          :title="`Paso ${s}`"
        ></button>
      </div>
    </div>

    <button class="ar-btn" @mousedown.prevent @click="deck.next()" :disabled="atEnd" title="Siguiente (→)">
      <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
    </button>
    <button class="ar-btn ar-edge" @mousedown.prevent @click="deck.go(deck.total.value - 1, Infinity)" :disabled="atEnd" title="Última (Fin)">
      <svg viewBox="0 0 24 24"><path d="M6 17l5-5-5-5M13 17l5-5-5-5" /></svg>
    </button>

    <div class="ar-divider"></div>
    <button
      class="ar-btn"
      v-if="themes.length > 1"
      @mousedown.prevent @click="toggle('themes')"
      :class="{ active: open === 'themes' }"
      :title="`Tema: ${theme} (t)`"
    >
      <!-- palette -->
      <svg viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" />
        <circle class="fill" cx="7.5" cy="11" r="1.3" />
        <circle class="fill" cx="10" cy="7" r="1.3" />
        <circle class="fill" cx="14.5" cy="7" r="1.3" />
        <circle class="fill" cx="17" cy="10.5" r="1.3" />
      </svg>
    </button>
    <button class="ar-btn" v-if="!docked" @mousedown.prevent @click="openPresenter()" title="Vista del presentador (p)">
      <!-- a screen with notes under it -->
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3.5" width="18" height="11" rx="2" />
        <path d="M7 18.5h10M9 21h6" />
      </svg>
    </button>
    <button class="ar-btn" @mousedown.prevent @click="toggleFullscreen()" :title="fullscreen ? 'Salir de pantalla completa (f)' : 'Pantalla completa (f)'">
      <svg v-if="!fullscreen" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
      <svg v-else viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
    </button>

    <Transition name="ar-pop">
      <div class="ar-panel ar-slides" v-if="open === 'slides'" role="dialog" aria-label="Ir a slide">
        <input
          class="ar-search"
          ref="search"
          v-model="query"
          placeholder="Número o título…"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="matches[sel] && jump(matches[sel].i)"
          @keydown.esc.prevent="close"
        />
        <div class="ar-list" ref="listEl">
          <button
            class="ar-item"
            v-for="(m, k) in matches" :key="m.i"
            :class="{ current: m.i === deck.index.value, sel: k === sel }"
            @click="jump(m.i)"
            @mousemove="sel = k"
          >
            <span class="n">{{ m.i + 1 }}</span>
            <span class="t">{{ m.t || 'Sin título' }}</span>
          </button>
          <div class="ar-empty" v-if="!matches.length">Nada coincide</div>
        </div>
      </div>
    </Transition>

    <Transition name="ar-pop">
      <div class="ar-panel ar-themes" v-if="open === 'themes'" role="menu" aria-label="Tema">
        <button
          class="ar-item"
          v-for="t in themes" :key="t"
          :class="{ current: t === theme }"
          @mousedown.prevent
          @click="pickTheme(t)"
          role="menuitemradio" :aria-checked="t === theme"
        >
          <span class="swatch" :data-theme="t" data-ar-theme-root></span>
          <span class="t">{{ t }}</span>
          <svg class="check" v-if="t === theme" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10" /></svg>
        </button>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDeck } from '../../state/deck'

const props = defineProps({
  docked: Boolean,
  shown: Boolean,
  titles: { type: Array, default: () => [] },
})
const deck = useDeck()
const { theme, themes, setTheme, fullscreen, toggleFullscreen, openPresenter } = deck

const root = ref()
const hovering = ref(false)
const open = ref(null) // null | 'slides' | 'themes'
const atStart = computed(() => deck.index.value === 0 && deck.step.value === 1)
const atEnd = computed(() => deck.index.value === deck.total.value - 1 && deck.step.value === deck.steps.value)

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
  if (!initial) sel.value = Math.max(0, matches.value.findIndex((m) => m.i === deck.index.value))
  search.value?.focus()
  listEl.value?.querySelector(initial ? '.sel' : '.current')?.scrollIntoView({ block: 'center' })
}
function jump(i) {
  deck.go(i)
  close()
}

// ---- themes -----------------------------------------------------------------
function pickTheme(t) {
  setTheme(t)
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
/* frosted glass: strong blur, a light top sheen, a specular edge (the --ar-controls-* tokens,
   tokens.css); window px, not canvas px */
.ar-controls {
  position: absolute; left: 50%; bottom: 48px; z-index: 100;
  display: flex; align-items: center; gap: 4px;
  padding: 8px;
  background: var(--ar-controls-sheen), var(--ar-controls-bg);
  backdrop-filter: var(--ar-controls-blur);
  -webkit-backdrop-filter: var(--ar-controls-blur);
  border: 1px solid var(--ar-controls-border);
  border-radius: calc(var(--ar-controls-radius) * 2);
  box-shadow: var(--ar-controls-shadow);
  color: var(--ar-controls-fg);
  font: 500 var(--ar-ui-text)/1 var(--ar-ui-font);
  font-variant-numeric: tabular-nums;
  opacity: 0;
  transform: translate(-50%, 14px);
  transition: opacity var(--ar-ui-duration-slow) ease, transform var(--ar-ui-duration-slow) ease;
  pointer-events: none;
  user-select: none;
}
.ar-controls.visible { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
.ar-controls.docked { position: relative; left: auto; bottom: auto; transform: none; transition: none; }
/* docked (the presenter view), their accent defaults to their text colour: tokens.css */

.ar-btn {
  display: grid; place-items: center;
  width: 44px; height: 44px; padding: 0;
  border: 0; border-radius: calc(var(--ar-controls-radius) * 1.125); background: transparent; color: inherit;
  cursor: pointer; transition: background var(--ar-ui-duration-fast), opacity var(--ar-ui-duration-fast);
}
.ar-btn:hover:not(:disabled) { background: var(--ar-controls-hover); box-shadow: var(--ar-controls-hover-shadow); }
.ar-btn.active { background: var(--ar-controls-active); }
.ar-btn:disabled { opacity: .28; cursor: default; }
.ar-btn svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8;
  stroke-linecap: round; stroke-linejoin: round; }
.ar-btn svg .fill { fill: currentColor; stroke: none; }

.ar-ctl-mid { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 10px; min-width: 88px; }
.ar-counter {
  border: 0; background: transparent; color: inherit; cursor: pointer;
  padding: 6px 12px; border-radius: var(--ar-controls-radius); font: inherit;
  font-size: calc(var(--ar-ui-text) * 1.0625); transition: background var(--ar-ui-duration-fast);
}
.ar-counter:hover { background: var(--ar-controls-hover); }
.ar-counter.active { background: var(--ar-controls-active); }
.ar-counter .sep, .ar-counter .tot { color: var(--ar-controls-dim); }
.ar-counter .sep { margin: 0 5px; }

.ar-dots { display: flex; gap: 5px; }
.ar-dot {
  width: 7px; height: 4px; padding: 0; border: 0; border-radius: 2px;
  background: var(--ar-controls-dim); opacity: .45; cursor: pointer; transition: all var(--ar-ui-duration);
}
.ar-dot.on { background: var(--_ar-controls-accent); opacity: 1; width: 16px; }

.ar-divider { width: 1px; height: 26px; background: var(--ar-controls-line); margin: 0 6px; }

/* popover panels */
.ar-panel {
  position: absolute; bottom: calc(100% + 12px);
  display: flex; flex-direction: column;
  padding: 8px;
  background: var(--ar-controls-sheen), var(--ar-controls-panel-bg);
  backdrop-filter: var(--ar-controls-blur);
  -webkit-backdrop-filter: var(--ar-controls-blur);
  border: 1px solid var(--ar-controls-border); border-radius: calc(var(--ar-controls-radius) * 2);
  box-shadow: var(--ar-controls-shadow);
}
.ar-slides { left: 50%; transform: translateX(-50%); width: min(380px, calc(100vw - 24px)); }

/* narrow screens (phones): smaller buttons, no first/last, panels fit the width */
@media (max-width: 560px) {
  .ar-controls { bottom: 20px; gap: 2px; padding: 6px; }
  .ar-btn { width: 40px; height: 40px; }
  .ar-btn.ar-edge { display: none; }
  .ar-ctl-mid { min-width: 64px; padding: 0 4px; }
  .ar-divider { margin: 0 2px; }
}
.ar-themes { right: 0; min-width: 220px; }

.ar-search {
  margin: 0 0 8px; padding: 11px 13px;
  border: 1px solid var(--ar-controls-line); border-radius: calc(var(--ar-controls-radius) * 1.125); outline: none;
  background: var(--ar-controls-field-bg); color: inherit; font: inherit;
  box-shadow: var(--ar-controls-field-shadow);
}
.ar-search:focus { border-color: color-mix(in srgb, var(--_ar-controls-accent) 70%, transparent); }
.ar-search::placeholder { color: var(--ar-controls-dim); }
.ar-list { max-height: min(50vh, 440px); overflow-y: auto; scrollbar-width: thin;
  scrollbar-color: var(--ar-controls-scrollbar) transparent; }
.ar-empty { padding: 14px; color: var(--ar-controls-dim); text-align: center; }

.ar-item {
  display: flex; gap: 12px; align-items: center; width: 100%;
  padding: 10px 12px; border: 0; border-radius: var(--ar-controls-radius);
  background: transparent; color: inherit; font: inherit; font-size: calc(var(--ar-ui-text) * .9375);
  text-align: left; cursor: pointer;
}
.ar-item:hover, .ar-item.sel { background: var(--ar-controls-hover); }
.ar-item .n { color: var(--ar-controls-dim); min-width: 1.8em; text-align: right; }
.ar-item.current .n { color: var(--_ar-controls-accent); }
.ar-item.current .t { font-weight: 650; }
.ar-item .t { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-item .swatch {
  width: 18px; height: 18px; border-radius: calc(var(--ar-controls-radius) * .625); flex: none;
  background: linear-gradient(135deg, var(--ar-bg) 50%, var(--ar-accent) 50%);
  border: 1px solid var(--ar-controls-line);
}
.ar-item .check { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.2;
  stroke-linecap: round; stroke-linejoin: round; }

.ar-pop-enter-active, .ar-pop-leave-active { transition: opacity var(--ar-ui-duration), translate var(--ar-ui-duration); }
.ar-pop-enter-from, .ar-pop-leave-to { opacity: 0; translate: 0 6px; }
</style>
