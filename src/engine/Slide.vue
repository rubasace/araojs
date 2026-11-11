<!-- A slide. `layout` picks the arrangement; these have named zones (any other value is just a
     layout-<name> class for the theme: default, cover, section, two-cols…):
       split                      header on top, then two zones side by side: #left and #right
       image-left | image-right   #image fills its side edge to edge; the default slot is the
                                  text side, padded like any slide
     ratio="2 1" sizes the two zones left to right, whichever holds the image (default "1 1").
       Two entries, each a share (proportions: "2 1" = "0.5 0.25"), auto or a px size, as in
       Cols (layout.js); an invalid ratio warns in development and the zones stay "1 1".
     A zone keeps its width: content wider than it is clipped at its edge, never painted over
     the other zone; heights do not clip.
     Title: put it first. A #title slot renders first in every layout, then the default slot.
     In split the default slot is the header above both zones (its heading, maybe a lead line);
     in image-* it is the text side, so the title tops the text column, never the image. -->
<template lang="pug">
Transition(name="ph-slide")
  section.ph-slide(
    ref="el"
    v-show="active"
    :data-ph-slide="id"
    :class="['layout-' + layout]"
    :style="image ? zones : undefined"
  )
    template(v-if="layout === 'split'")
      .ph-slide-head(v-if="$slots.title || $slots.default")
        slot(name="title" :step="step")
        slot(:step="step")
      .ph-zones(:style="zones")
        .ph-zone.ph-zone-left
          slot(name="left" :step="step")
        .ph-zone.ph-zone-right
          slot(name="right" :step="step")
    //- zones in visual order, left to right, so the DOM (and reading order) matches the screen
    template(v-else-if="layout === 'image-left'")
      .ph-zone.ph-zone-image
        slot(name="image" :step="step")
      .ph-zone.ph-zone-text
        slot(name="title" :step="step")
        slot(:step="step")
    template(v-else-if="layout === 'image-right'")
      .ph-zone.ph-zone-text
        slot(name="title" :step="step")
        slot(:step="step")
      .ph-zone.ph-zone-image
        slot(name="image" :step="step")
    template(v-else)
      slot(name="title" :step="step")
      slot(:step="step")
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onUpdated, provide, reactive, ref } from 'vue'
import { DECK, SLIDE, slides } from './registry'
import { sweep } from './step'
import { isRatio, tracks } from './layout'

const props = defineProps({
  layout: { type: String, default: 'default' },
  // shown in the jump menu; defaults to the slide's first heading
  title: String,
  // zone sizes for split / image-left / image-right, left to right: "2 1", "72 28"
  ratio: { type: String, default: '1 1', validator: (v) => isRatio(v, 2) },
})

const image = computed(() => props.layout === 'image-left' || props.layout === 'image-right')
const zones = computed(() => ({ gridTemplateColumns: tracks(isRatio(props.ratio, 2) ? props.ratio : '1 1', 0) }))

const deck = inject(DECK)
const id = `s${Math.random().toString(36).slice(2, 9)}`

// step numbers registered by v-step anywhere inside this slide (with multiplicity)
const counts = reactive(new Map())
const steps = computed(() => Math.max(1, ...counts.keys()))

const el = ref(null)
// the deck places it by its position in the template, even when mounted after its neighbours
const index = deck.register({ id, steps, title: computed(() => props.title), el })
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
  active,
  elements,
  registerStep,
})

onBeforeUnmount(() => {
  slides.delete(id)
  deck.unregister(id)
})
</script>
