<!-- The deck: its slides on a fixed canvas, the controls, the keyboard, the URL.
     Two ways to show it, from the same URL:
       audience view    the slides, full window (the default)
       presenter view   ?presenter, or "p" / the controls' button (opens it in a new window):
                        the current slide, a preview of the next step, the speaker notes (Notes),
                        a wall clock and the talk's timer (Presenter.vue)
     "p" brings an open presenter window forward instead of reloading it; if the browser blocks the
     new window, a notice above the controls links to the presenter view to open it by hand.
     The presenter view mounts every slide twice (current + preview): see useDeck().role.
     touch (phones, tablets): tap the right quarter → next, the left quarter → previous, the middle
     → show/hide the controls; swipe left/right → next/previous. Links, buttons and inputs inside a
     slide keep their own taps (add data-ph-touch="ignore" to any other element that needs them).
     Every window of the same deck in the same browser stays in step (sync.js): moving in any of
     them moves the others, and so does a theme change; the last move wins. A window that opens
     takes the position of the ones already open (and their theme, unless its URL names one).
     duration="45m" is the talk's length (formats: timer.js parseDuration): the presenter view
     counts down to it. The timer starts with the first move of the deck, in any window, and
     survives reloading the windows (not closing them).
     Export: ?export prints the deck, one page per slide (&per-step: per step; &notes: a page of
     notes after each slide that has them): exporter.js, and npm run export for the PDF.
     Footer: the #footer slot is drawn at the bottom of every slide except covers and sections
     (each Slide draws it, so it fades, prints and shows in the presenter view with its slide);
     its slot props are { number, total }, the slide's number (1-based) and the slide count:
       template(#footer="{ number, total }")
         span ACME · Conf 2026
         span {{ number }} / {{ total }} -->
<template>
  <div
    class="ph-viewport"
    v-if="!presenter"
    ref="viewport"
    :data-theme="theme"
    :class="{ 'ph-nocursor': cursorHidden, 'ph-export': exporting, 'ph-export-done': exported }"
  >
    <Stage :stage="main" :width="width" :height="height">
      <slot />
    </Stage>
    <template v-if="exporting">
      <!-- the notes of the slide on screen, copied into the book after its page(s); never shown -->
      <div class="ph-export-notes" v-if="exporting.notes" ref="notesBox">
        <div class="ph-note" v-for="n in shownNotes" :key="n.id" :data-step="n.step">
          <NoteBody :note="n" />
        </div>
      </div>
      <!-- filled by exporter.js, not by Vue -->
      <div class="ph-book" ref="book"></div>
    </template>
    <Controls
      v-else
      ref="controls"
      :deck="main.api"
      :visible="hud"
      :theme="theme"
      :themes="themes"
      :fullscreen="fullscreen"
      :titles="titles"
      @theme="setTheme"
      @fullscreen="toggleFullscreen"
      @presenter="openPresenter"
    />
    <!-- the browser blocked the presenter window: the same URL as a link, which it does not block -->
    <Transition v-if="!exporting" name="ph-toast">
      <div class="ph-toast" v-if="blocked" role="status">
        <span>El navegador ha bloqueado la ventana del presentador.</span>
        <a :href="blocked" :target="presenterName" :title="blocked" @click="dismiss">Abrirla aquí</a>
      </div>
    </Transition>
  </div>
  <Presenter
    v-else
    :deck="main.api"
    :title="titles[main.index.value] || ''"
    :next="next"
    :notes="notes"
    :timer="timer"
    :duration="duration"
    :ratio="`${width} / ${height}`"
    @timer="setTimer"
  >
    <template #current>
      <Stage :stage="main" :width="width" :height="height" :theme="theme">
        <slot />
      </Stage>
    </template>
    <!-- A second copy of every slide, one step ahead: each slide and addon mounts again here, so
         its side effects run twice in this window and its element ids repeat (useDeck().role is
         'preview' in this copy, 'presenter' in the one above). -->
    <template #next>
      <Stage :stage="preview" :width="width" :height="height" :theme="theme">
        <slot />
      </Stage>
    </template>
    <template #controls>
      <Controls
        ref="controls"
        docked
        :deck="main.api"
        :theme="theme"
        :themes="themes"
        :fullscreen="fullscreen"
        :titles="titles"
        @theme="setTheme"
        @fullscreen="toggleFullscreen"
      />
    </template>
  </Presenter>
</template>

<script setup>
// Deck wires the pieces together; each concern is a composable (src/composables/).
import { computed, provide, ref, useSlots } from 'vue'
import { ahead, createStage, titleOf } from '../core/stage'
import { exportOptions } from '../core/exporter'
import { FOOTER } from '../core/registry'
import { useDeckSync } from '../composables/useDeckSync'
import { useExport } from '../composables/useExport'
import { useFullscreen } from '../composables/useFullscreen'
import { useHashRoute } from '../composables/useHashRoute'
import { useIdle } from '../composables/useIdle'
import { useKeyboard } from '../composables/useKeyboard'
import { usePresenterWindow } from '../composables/usePresenterWindow'
import { useTheme } from '../composables/useTheme'
import { useTimer } from '../composables/useTimer'
import { useTouchNav } from '../composables/useTouchNav'
import { NoteBody } from './Notes'
import Controls from './internal/Controls.vue'
import Presenter from './internal/Presenter.vue'
import Stage from './internal/Stage.vue'

const props = defineProps({
  width: { type: Number, default: 1920 },
  height: { type: Number, default: 1080 },
  themes: { type: Array, default: () => ['default'] },
  // hide the mouse cursor after this many ms without moving it (0 = never)
  hideCursorAfter: { type: Number, default: 5000 },
  // the talk's length, for the presenter view's countdown: 90 or "90" (minutes), "45m", "1h30m",
  // "1h30", "90s", "45:00" (m:ss), "1:30:00" (h:mm:ss). Anything else warns and counts nothing.
  duration: [String, Number],
})

// the #footer slot, read when each slide renders (the slots object is updated in place)
const slots = useSlots()
provide(FOOTER, () => slots.footer)

const query = new URLSearchParams(location.search)
// ?export wins over ?presenter: the window prints the deck, nothing else
const exporting = exportOptions(query)
const presenter = !exporting && query.has('presenter')

// ---- slides ------------------------------------------------------------
// The audience's stage; the presenter view adds a second rendering of the deck that stands one
// step ahead of it, for the "next" preview.
const main = createStage({ onMove: moved, role: exporting ? 'export' : presenter ? 'presenter' : 'audience' })
const next = computed(() => ahead(main))
const preview = presenter ? createStage({ follow: () => next.value, role: 'preview' }) : null
// notes of the slide on screen
const notes = computed(() => main.current.value?.notes ?? [])

const { theme, setTheme, cycleTheme } = useTheme(() => props.themes)
// addons/components can follow theme changes
main.api.theme = theme
if (preview) preview.api.theme = theme
const { timer, setTimer, duration, startTimer } = useTimer(() => props.duration)

const viewport = ref()
const controls = ref()
const { fullscreen, toggle: toggleFullscreen } = useFullscreen(viewport)
const { open: openPresenter, name: presenterName, blocked, dismiss } = usePresenterWindow()

// ---- the audience's window: the mouse shows the controls for 2.5 s (a tap in the middle, for 4 s)
// and hides the cursor after hideCursorAfter; keys never show them. The presenter view and the
// export listen to neither.
const pointer = presenter || exporting ? null : viewport
const controlsIdle = useIdle(pointer, 2500, { idle: true })
const hud = computed(() => !controlsIdle.idle.value)
const { idle: cursorHidden } = useIdle(pointer, () => props.hideCursorAfter)
if (pointer) {
  useTouchNav(pointer, {
    next: main.next,
    prev: main.prev,
    tap: () => controls.value?.closeMenu(),
    middle: () => (hud.value ? controlsIdle.sleep() : controlsIdle.wake(4000)),
  })
}

// ---- the URL, the other windows, the keys (not while exporting) ----------------------------
let sync = null
if (!exporting) {
  useHashRoute(main) // first: the position the URL gives is in place before the windows sync
  sync = useDeckSync(main, { theme, setTheme, adoptTheme: !query.has('theme'), timer, setTimer })
  useKeyboard({
    next: main.next,
    prev: main.prev,
    first: () => main.go(0),
    last: main.last,
    fullscreen: toggleFullscreen,
    theme: cycleTheme,
    presenter: presenter ? null : openPresenter,
    menu: () => controls.value.toggleMenu(),
    jump: (digit) => controls.value.openMenu(digit),
    close: () => controls.value.closeMenu(),
  })
}
// A move made here (keys, controls, an addon, the URL; not a position received, nor the deck
// renumbering its slides after an edit): the other windows follow, and the first one starts the
// timer.
function moved() {
  if (sync?.moved()) startTimer()
}

// slide titles for the jump menu, re-read whenever the controls show up (the presenter view shows
// the title: on every move)
const titles = computed(() => {
  presenter ? main.index.value : hud.value
  return main.list.map(titleOf)
})

// ---- export: the book of pages (exporter.js) ---------------------------------
const { book, notesBox, done: exported, shownNotes } = useExport(main, {
  options: exporting,
  theme,
  themes: () => props.themes,
  viewport,
  width: () => props.width,
  height: () => props.height,
})
</script>

<style>
/* a notice above the controls (the presenter window was blocked); window px, not canvas px */
.ph-toast {
  position: absolute; left: 50%; bottom: 128px; z-index: 101; transform: translateX(-50%);
  display: flex; align-items: baseline; gap: 14px; max-width: calc(100% - 32px); box-sizing: border-box;
  padding: 12px 16px; border: 1px solid rgba(255, 255, 255, .16); border-radius: 12px;
  background: #1c1c22; box-shadow: 0 12px 32px rgba(0, 0, 0, .35);
  color: rgba(255, 255, 255, .94); font: 15px/1.35 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.ph-toast a { color: #8ab4ff; font-weight: 600; white-space: nowrap; }
.ph-toast-enter-active, .ph-toast-leave-active { transition: opacity .2s, translate .2s; }
.ph-toast-enter-from, .ph-toast-leave-to { opacity: 0; translate: 0 6px; }
</style>
