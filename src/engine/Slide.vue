<template lang="pug">
Transition(name="ph-slide")
  section.ph-slide(
    v-show="active"
    :data-ph-slide="id"
    :class="['layout-' + layout]"
  )
    slot(:step="step")
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onUpdated, provide, reactive } from 'vue'
import { DECK, SLIDE, slides } from './registry'
import { sweep } from './step'

const props = defineProps({
  layout: { type: String, default: 'default' },
  // shown in the jump menu; defaults to the slide's first heading
  title: String,
})

const deck = inject(DECK)
const id = `s${Math.random().toString(36).slice(2, 9)}`

// step numbers registered by v-step anywhere inside this slide (with multiplicity)
const counts = reactive(new Map())
const steps = computed(() => Math.max(1, ...counts.keys()))

const index = deck.register({ id, steps, title: computed(() => props.title) })
const active = computed(() => deck.index.value === index.value)
// a slide already passed shows everything; one not reached yet shows step 1
const step = computed(() =>
  active.value ? deck.step.value : deck.index.value > index.value ? steps.value : 1,
)

const elements = new Set()
onUpdated(() => sweep(elements))

function registerStep(n) {
  counts.set(n, (counts.get(n) || 0) + 1)
  return () => {
    const c = counts.get(n) - 1
    c > 0 ? counts.set(n, c) : counts.delete(n)
  }
}
// components reach the slide through useSlide(); v-step through the DOM
provide(SLIDE, { step, registerStep })

slides.set(id, {
  step,
  elements,
  registerStep,
})

onBeforeUnmount(() => {
  slides.delete(id)
  deck.unregister(id)
})
</script>
