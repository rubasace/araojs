<!-- The audience view (the default): the deck's slides, full window, and the floating controls.
     It owns the window's viewport element: the one fullscreen fills (state/deck.js), and the one
     the mouse and touch are read from.
       mouse   a move shows the controls for 2.5 s (their auto-hide, Controls.vue), and the cursor
               hides after hideCursorAfter ms without one (0: never); keys never show them
       touch   tap the right quarter → next, the left quarter → previous; swipe left/right →
               next/previous (the deck's shortcuts, composables/useShortcuts.js, on this
               viewport); a tap in the middle shows or hides the controls (their auto-hide)
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
    <Controls auto-hide />
    <!-- the browser blocked the presenter window: the same URL as a link, which it does not block -->
    <Transition name="ar-toast">
      <div class="ar-toast" v-if="blocked" role="status" :lang="lang">
        <span>{{ t('presenterBlocked') }}</span>
        <a :href="blocked" :target="presenterWindow.name" :title="blocked" @click="presenterWindow.dismiss">{{ t('openItHere') }}</a>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDeck } from '../state/deck'
import { useAutoHide } from '../composables/useAutoHide'
import { lang, t } from '../i18n/i18n'
import Controls from '../components/internal/Controls.vue'
import Stage from '../components/internal/Stage.vue'

const props = defineProps({
  deck: { type: Object, required: true }, // createDeck()
  width: { type: Number, required: true }, // of the canvas
  height: { type: Number, required: true },
  hideCursorAfter: { type: Number, required: true },
})
const { theme } = useDeck()
const { presenterWindow } = props.deck
const blocked = presenterWindow.blocked
// the deck's ref: fullscreen fills this element
const viewport = props.deck.viewport

// ---- the cursor hides after hideCursorAfter ms without a move (0: never). The controls hide
// themselves (their auto-hide); touch moves the deck (its shortcuts, Deck.vue).
const cursor = useAutoHide({ after: () => props.hideCursorAfter, visible: true })
const cursorHidden = computed(() => !cursor.visible.value)
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
