<!-- The audience view (the default): the deck's slides, full window, and the floating controls.
     It owns the window's viewport element: the one fullscreen fills (state/deck.js), and the one
     the mouse and touch are read from.
       mouse   a move shows the controls for 2.5 s, and the cursor hides after hideCursorAfter ms
               without one (0: never); keys never show them (Deck.vue wires the keys)
       touch   tap the right quarter → next, the left quarter → previous, the middle → show/hide the
               controls (4 s); swipe left/right → next/previous (composables/useTouchNav.js)
     If the browser blocks the presenter window, a notice above the controls links to it.
     deck: createDeck() (state/deck.js): the stage, the viewport ref, the presenter window. -->
<template>
  <div
    class="ar-viewport"
    ref="viewport"
    :data-theme="theme"
    :class="{ 'ar-nocursor': cursorHidden }"
  >
    <Stage :stage="deck.stage" :width="width" :height="height">
      <slot />
    </Stage>
    <Controls ref="controls" :shown="hud" :titles="titles" />
    <!-- the browser blocked the presenter window: the same URL as a link, which it does not block -->
    <Transition name="ar-toast">
      <div class="ar-toast" v-if="blocked" role="status">
        <span>El navegador ha bloqueado la ventana del presentador.</span>
        <a :href="blocked" :target="presenterWindow.name" :title="blocked" @click="presenterWindow.dismiss">Abrirla aquí</a>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useDeck } from '../state/deck'
import { useMouseIdle } from '../composables/useMouseIdle'
import { useTouchNav } from '../composables/useTouchNav'
import Controls from './parts/Controls.vue'
import Stage from './parts/Stage.vue'

const props = defineProps({
  deck: { type: Object, required: true }, // createDeck()
  width: { type: Number, required: true }, // of the canvas
  height: { type: Number, required: true },
  hideCursorAfter: { type: Number, required: true },
})
const { theme } = useDeck()
const { stage, presenterWindow } = props.deck
const blocked = presenterWindow.blocked
// the deck's ref: fullscreen fills this element
const viewport = props.deck.viewport
const controls = ref()

// ---- the mouse shows the controls for 2.5 s (a tap in the middle, for 4 s) and hides the cursor
// after hideCursorAfter; keys never show them
const controlsIdle = useMouseIdle(viewport, 2500, { idle: true })
const hud = computed(() => !controlsIdle.idle.value)
const { idle: cursorHidden } = useMouseIdle(viewport, () => props.hideCursorAfter)
useTouchNav(viewport, {
  next: stage.next,
  prev: stage.prev,
  tap: () => controls.value?.closeMenu(),
  middle: () => (hud.value ? controlsIdle.sleep() : controlsIdle.wake(4000)),
})

// slide titles for the jump menu, re-read whenever the controls show up
const titles = computed(() => {
  hud.value
  return props.deck.titles()
})

// the keys open and close the controls' jump menu (Deck.vue)
defineExpose({
  openMenu: (digits) => controls.value.openMenu(digits),
  toggleMenu: () => controls.value.toggleMenu(),
  closeMenu: () => controls.value.closeMenu(),
})
</script>

<style>
/* a notice above the controls (the presenter window was blocked); window px, not canvas px */
.ar-toast {
  position: absolute; left: 50%; bottom: 128px; z-index: 101; transform: translateX(-50%);
  display: flex; align-items: baseline; gap: 14px; max-width: calc(100% - 32px); box-sizing: border-box;
  padding: 12px 16px; border: 1px solid var(--ar-controls-border); border-radius: calc(var(--ar-controls-radius) * 1.5);
  background: var(--ar-toast-bg); box-shadow: var(--ar-toast-shadow);
  color: var(--ar-controls-fg); font: calc(var(--ar-ui-text) * .9375)/1.35 var(--ar-ui-font);
}
.ar-toast a { color: var(--ar-toast-link); font-weight: 600; white-space: nowrap; }
.ar-toast-enter-active, .ar-toast-leave-active { transition: opacity var(--ar-ui-duration), translate var(--ar-ui-duration); }
.ar-toast-enter-from, .ar-toast-leave-to { opacity: 0; translate: 0 6px; }

/* the cursor, hidden after hideCursorAfter ms without a move */
.ar-nocursor, .ar-nocursor * { cursor: none !important; }
</style>
