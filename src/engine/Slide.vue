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
     in image-* it is the text side, so the title tops the text column, never the image.
     Background: a layer under the content, as big as the slide, never in the pointer's way.
       Slide(bg="city.jpg" bg-opacity="0.15" bg-position="center 30%" bg-blur="4" bg-fit="cover")
     bg is, tried in this order (image.js):
       a URL         https://…, data:…, /from-public.jpg (served under Vite's base)
       a file        in the images folder, by its name there: city.jpg, team/ana.png, "photo (1).jpg";
                     a name ending in an extension that is not there shows as missing, and warns
       CSS           anything else: a colour or a gradient ("#1d2b4a", "linear-gradient(…)").
                     url(…) here is plain CSS: relative to the page, not to the images folder,
                     and Vite does not process it; for a picture, name the file or give a URL.
     A blank bg is no bg. The bg-* props tune it: opacity 0..1, position (CSS background-position),
     blur in px, fit cover (default) or contain.
     For anything more, the #background slot: each element in it covers the slide, stacked in
     order (an Img, then a tint above it), and v-step works in it as anywhere in the slide.
       template(#background)
         Img(file="city.jpg")
         .tint
     With both, the bg goes first and the slot above it. With neither (a slot that renders nothing
     counts as none), the slide shows the theme's default background, if the theme sets one
     (--ph-slide-bg-* tokens, engine.css), and the bg-* props tune that one.
     Headings in the background are not the slide's title (the jump menu skips them). -->
<template lang="pug">
Transition(name="ph-slide")
  section.ph-slide(
    ref="el"
    v-show="active"
    :data-ph-slide="id"
    :class="['layout-' + layout]"
    :style="image ? zones : undefined"
  )
    .ph-slide-bg(aria-hidden="true")
      Img(v-if="picture" v-bind="picture")
      .ph-slide-bg-fill(v-else-if="kind || !renders($slots.background, { step })" :class="{ 'ph-slide-bg-theme': !kind }" :style="fill")
      slot(name="background" :step="step")
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
import { Comment, Fragment, Text, computed, inject, onBeforeUnmount, onUpdated, provide, reactive, ref, watchEffect } from 'vue'
import { DECK, SLIDE, slides } from './registry'
import { sweep } from './step'
import { isRatio, tracks } from './layout'
import { bgKind, blurStyle, blurValue, imagesDir, isBlur, isOpacity, opacityValue } from './image'
import Img from './Img.vue'

const props = defineProps({
  layout: { type: String, default: 'default' },
  // shown in the jump menu; defaults to the slide's first heading
  title: String,
  // zone sizes for split / image-left / image-right, left to right: "2 1", "72 28"
  ratio: { type: String, default: '1 1', validator: (v) => isRatio(v, 2) },
  // background: an image file, a URL, a colour or a gradient (see above), and how it shows
  bg: String,
  bgOpacity: { type: [Number, String], validator: isOpacity },
  bgPosition: String,
  bgBlur: { type: [Number, String], validator: isBlur },
  bgFit: { type: String, validator: (v) => ['cover', 'contain'].includes(v) },
})

// a picture (file or URL) is an Img in the layer; a colour, a gradient or the theme's default fill it
const kind = computed(() => bgKind(props.bg))
const picture = computed(() => (kind.value === 'file' || kind.value === 'url'
  ? {
      [kind.value === 'file' ? 'file' : 'src']: props.bg.trim(),
      fit: props.bgFit || 'cover',
      position: props.bgPosition,
      opacity: props.bgOpacity,
      blur: props.bgBlur,
    }
  : null))
const fill = computed(() => ({
  background: kind.value === 'css' ? props.bg.trim() : undefined,
  backgroundPosition: props.bgPosition,
  backgroundSize: props.bgFit,
  opacity: opacityValue(props.bgOpacity),
  ...blurStyle(blurValue(props.bgBlur)),
}))
if (import.meta.env.DEV) {
  watchEffect(() => {
    const v = props.bg?.trim()
    if (kind.value === 'css' && !CSS.supports('background', v))
      console.warn(`[phoenyx] Slide: bg="${v}" is none of the three: no file "${v}" in ${imagesDir}, not a URL (https://…, /…), and not a valid CSS background`)
  })
}

// whether a slot renders anything: an empty #background, or one whose content is all v-if'd
// away, leaves the theme's default background in place
const content = (nodes) => nodes.some((n) =>
  n.type === Comment ? false
  : n.type === Fragment ? Array.isArray(n.children) && content(n.children)
  : n.type === Text ? n.children.trim() !== ''
  : true)
const renders = (slot, scope) => !!slot && content(slot(scope))

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
