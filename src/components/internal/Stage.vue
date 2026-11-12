<!-- The fixed canvas (width x height px), scaled to fit the box it is placed in and centred in it.
     Everything in its slot belongs to `stage` (stage.js): slides register with it, addons read it.
     The audience sees one Stage filling the window; the presenter view places two in boxes, so
     there every slide is mounted twice (side effects run twice, element ids repeat): components
     tell the copies apart with useDeck().role (stage.js). -->
<template>
  <div class="ar-stage" ref="box" :data-theme="theme" :style="{ '--ar-scale': scale }">
    <div class="ar-canvas" ref="canvas" :style="canvasStyle">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { DECK } from '../../core/registry'

const props = defineProps({
  stage: { type: Object, required: true },
  width: { type: Number, default: 1920 },
  height: { type: Number, default: 1080 },
  // a theme of its own (the presenter view); the audience's comes from the viewport
  theme: String,
})

provide(DECK, props.stage.context)

// ---- fixed canvas, scaled to fit (letterboxed) ----------------------------
const box = ref()
const scale = ref(1)
const canvasStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`,
}))
function fit() {
  const { clientWidth: w, clientHeight: h } = box.value
  scale.value = Math.min(w / props.width, h / props.height) || 0
}

// Moves that mount nothing (keyed v-for reordered) only show up in the DOM: watch the canvas
// for slide sections being inserted. Changes inside a slide are skipped at once.
const SLIDE_EL = '[data-ar-slide]'
const insertsSlide = (r) => !r.target.closest?.(SLIDE_EL) &&
  [...r.addedNodes].some((n) => n.nodeType === 1 && (n.matches(SLIDE_EL) || n.querySelector(SLIDE_EL)))
const canvas = ref()

let ro, mo
onMounted(() => {
  ro = new ResizeObserver(fit)
  ro.observe(box.value)
  fit()
  mo = new MutationObserver((records) => records.some(insertsSlide) && props.stage.change())
  mo.observe(canvas.value, { childList: true, subtree: true })
})
onBeforeUnmount(() => {
  ro?.disconnect()
  mo?.disconnect()
})
</script>
