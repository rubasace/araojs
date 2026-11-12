<!-- A slide. `layout` picks the arrangement:
       default                    zones, top to bottom: the header (the title), the body (the
                                  rest) and the deck's footer. Any name other than the ones below
                                  is the same, with a layout-<name> class for the theme (two-cols…)
       cover | section            content centred, no zones; no footer unless asked for
       split                      header on top, then two zones side by side: #left and #right
       image-left | image-right   #image fills its side edge to edge; the default slot is the
                                  text side, padded like any slide
     Zones (default layout): when the default slot starts with a heading (h1 or h2), that is the
     slide's title and goes into the header (.ph-header), with the headings right after it (a
     subtitle, or one title per step with v-step.only); everything else is the body (.ph-body).
     A #title slot, when given, is the header instead (complex headers) and the whole default slot
     is the body. With neither, the body takes the whole slide.
       Slide
         h2 Three pillars          ← header
         Cols …                    ← body
     align="start|center|end" places the body vertically; without it, the theme's --ph-body-align
     decides (center unless the theme says otherwise; read from the slide's computed style). In a
     centred or end-aligned body, Cols/Rows/Grid placed directly in it centre their rows too
     (engine.css). What fills the body (Img, Snippet, an element with flex: 1, the 1fr rows of
     Grid and Rows) still fills it, exactly as in a start-aligned body.
     The title in every layout (the header's heading, the split header's, the text side's in
     image-*) carries .ph-title and follows the --ph-title-* tokens (layouts.css).
     Footer: the Deck's #footer slot, drawn at the bottom of every slide (.ph-footer, a band
     --ph-footer-height tall) except on cover and section. :footer="false" hides it on a slide,
     :footer="true" shows it on a cover or a section. Its slot props are { number, total }: this
     slide's number (1-based) and the deck's slide count. The band takes the place of the slide's
     bottom padding: the body (split's and image-*'s zones too) ends where the footer begins.
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
     Headings in the background or the footer are not the slide's title (the jump menu skips them).
     Speaker notes: Notes anywhere inside the slide (notes.js); only the presenter view shows them. -->
<template lang="pug">
//- export mode switches slides at once (no CSS transition): the book copies the slide on screen
Transition(name="ph-slide" :css="!still")
  section.ph-slide(
    ref="el"
    v-show="active"
    :data-ph-slide="id"
    :class="['layout-' + layout, { 'ph-footed': footed() && !flat }]"
    :style="image ? zones : undefined"
  )
    .ph-slide-bg(aria-hidden="true")
      Img(v-if="picture" v-bind="picture")
      .ph-slide-bg-fill(v-else-if="kind || !renders($slots.background, { step })" :class="{ 'ph-slide-bg-theme': !kind }" :style="fill")
      slot(name="background" :step="step")
    template(v-if="layout === 'split'")
      .ph-slide-head(v-if="$slots.title || $slots.default")
        VNodes(:nodes="titled()")
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
        VNodes(:nodes="titled()")
    template(v-else-if="layout === 'image-right'")
      .ph-zone.ph-zone-text
        VNodes(:nodes="titled()")
      .ph-zone.ph-zone-image
        slot(name="image" :step="step")
    template(v-else-if="flat")
      slot(name="title" :step="step")
      slot(:step="step")
    VNodes(v-else :nodes="zoned()")
    footer.ph-footer(v-if="footed()")
      VNodes(:nodes="footerSlot()({ number: index + 1, total: deck.api.total.value })")
</template>

<script setup>
import { Comment, Fragment, Text, cloneVNode, computed, h, inject, onBeforeUnmount, onMounted, onUpdated, provide, reactive, ref, shallowReactive, useSlots, watch, watchEffect } from 'vue'
import { DECK, FOOTER, SLIDE, slides } from './registry'
import { sweep } from './step'
import { isRatio, tracks } from './layout'
import { bgKind, blurStyle, blurValue, imagesDir, isBlur, isOpacity, opacityValue } from './image'
import { Notes } from './notes'
import Img from './Img.vue'

const ALIGN = ['start', 'center', 'end']
// layouts without zones: content centred, and no footer unless the slide asks for it
const FLAT = ['cover', 'section']

const props = defineProps({
  layout: { type: String, default: 'default' },
  // shown in the jump menu; defaults to the slide's first heading
  title: String,
  // vertical place of the body (default layout): start | center | end; default --ph-body-align
  align: { type: String, validator: (v) => ['start', 'center', 'end'].includes(v) },
  // the deck's footer on this slide: false hides it, true shows it on cover and section too
  footer: { type: Boolean, default: undefined },
  // zone sizes for split / image-left / image-right, left to right: "2 1", "72 28"
  ratio: { type: String, default: '1 1', validator: (v) => isRatio(v, 2) },
  // background: an image file, a URL, a colour or a gradient (see above), and how it shows
  bg: String,
  bgOpacity: { type: [Number, String], validator: isOpacity },
  bgPosition: String,
  bgBlur: { type: [Number, String], validator: isBlur },
  bgFit: { type: String, validator: (v) => ['cover', 'contain'].includes(v) },
})
const slots = useSlots()

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
const flat = computed(() => FLAT.includes(props.layout))
const zones = computed(() => ({ gridTemplateColumns: tracks(isRatio(props.ratio, 2) ? props.ratio : '1 1', 0) }))

const deck = inject(DECK)
// export mode (exporter.js): no slide transition, no glide of collapsed steps
const still = deck.api.role === 'export'
const id = `s${Math.random().toString(36).slice(2, 9)}`

// step numbers registered by v-step anywhere inside this slide (with multiplicity)
const counts = reactive(new Map())
const steps = computed(() => Math.max(1, ...counts.keys()))

const el = ref(null)
// speaker notes (Notes inside this slide) for the presenter view: { id, step, slots } each
const notes = shallowReactive([])
// the deck places it by its position in the template, even when mounted after its neighbours
const index = deck.register({ id, steps, title: computed(() => props.title), el, notes })
const active = computed(() => deck.index.value === index.value)
// a slide already passed shows everything; one not reached yet shows step 1
const step = computed(() =>
  active.value ? deck.step.value : deck.index.value > index.value ? steps.value : 1,
)

// ---- zones: header, body, footer ------------------------------------------------------------
// Slot content rendered by this component's own render (VNodes only places it), so a change in
// it re-renders the slide as before, and onUpdated still sweeps v-step.
const VNodes = (p) => p.nodes
VNodes.props = ['nodes']

// The title: the heading(s) a slot's content starts with, h1 or h2: one title, a title and its
// subtitle, or one title per step (h2(v-step.only.collapse="1"), h2(…="2")…). Comments (v-if),
// blank text and Notes (they draw nothing) do not count. In a #title slot, which is all header,
// the headings may come after something else (a kicker line). → [first, end): the title is
// nodes[first] up to nodes[end - 1]; first = -1 when there is none.
const blank = (n) => n.type === Comment || n.type === Notes || (n.type === Text && !String(n.children).trim())
const heading = (n) => n.type === 'h1' || n.type === 'h2'
function titleRun(nodes, anywhere = false) {
  let i = 0
  while (i < nodes.length && (blank(nodes[i]) || (anywhere && !heading(nodes[i])))) i++
  if (i === nodes.length || !heading(nodes[i])) return [-1, -1]
  let end = i + 1
  for (let j = end; j < nodes.length && (blank(nodes[j]) || heading(nodes[j])); j++) if (heading(nodes[j])) end = j + 1
  return [i, end]
}
const marked = (nodes) => nodes.map((n) => (heading(n) ? cloneVNode(n, { class: 'ph-title' }) : n))
// the nodes with their title marked .ph-title, in place; { nodes, tag } (its first heading's tag)
function mark(nodes, anywhere) {
  const [first, end] = titleRun(nodes, anywhere)
  if (first < 0) return { nodes, tag: null }
  return { nodes: [...nodes.slice(0, first), ...marked(nodes.slice(first, end)), ...nodes.slice(end)], tag: nodes[first].type }
}
// split's header and image-*'s text side: #title, then the default slot, the title marked
function titled() {
  const scope = { step: step.value }
  const title = slots.title?.(scope)
  const rest = slots.default?.(scope) ?? []
  return title ? [...mark(title, true).nodes, ...rest] : mark(rest).nodes
}
// the default layout: the header (#title, else the title the default slot starts with), the body
function zoned() {
  const scope = { step: step.value }
  const content = slots.default?.(scope) ?? []
  let head = null
  let body = content
  if (slots.title) {
    head = mark(slots.title(scope), true)
  } else {
    const [first, end] = titleRun(content)
    if (first >= 0) {
      head = { nodes: marked(content.slice(first, end)), tag: content[first].type }
      body = [...content.slice(0, first), ...content.slice(end)]
    }
  }
  const zones = []
  if (head) {
    zones.push(h('div', {
      key: 'ph-header',
      class: ['ph-header', head.tag && `ph-header-${head.tag}`, { 'ph-header-band': band.value }],
    }, head.nodes))
  }
  // a body of nothing visible (only Notes, v-if comments) gets no box; its Notes still mount
  if (body.some((n) => !blank(n))) zones.push(h('div', { key: 'ph-body', class: ['ph-body', `ph-body-${align.value}`] }, body))
  else zones.push(...body)
  return zones
}

// Body alignment: the prop, else the theme's token; and whether the theme gives the header a
// band (--ph-header-height). Tokens are CSS, so they are read from the slide's computed style
// once mounted and again whenever the theme changes (before the first paint either way);
// per-layout values (.layout-x { --ph-body-align: … }) work too.
const themeAlign = ref('center')
const band = ref(false)
let warned = false
function readTokens() {
  if (!el.value) return
  const style = getComputedStyle(el.value)
  const v = style.getPropertyValue('--ph-body-align').trim()
  if (v && !ALIGN.includes(v) && !warned && import.meta.env.DEV) {
    warned = true
    console.warn(`[phoenyx] --ph-body-align: "${v}" is not start, center or end: the body is centred`)
  }
  themeAlign.value = ALIGN.includes(v) ? v : 'center'
  const hh = style.getPropertyValue('--ph-header-height').trim()
  band.value = !!hh && hh !== 'auto'
}
onMounted(readTokens)
if (deck.api.theme) watch(deck.api.theme, readTokens, { flush: 'post' })
const align = computed(() => props.align || themeAlign.value)

// The deck's #footer slot (Deck.vue provides it), shown on this slide or not
const footerSlot = inject(FOOTER, () => undefined)
const footed = () => !!footerSlot() && (props.footer ?? !flat.value)

const elements = new Set()
onUpdated(() => sweep(elements))

function registerStep(n) {
  counts.set(n, (counts.get(n) || 0) + 1)
  return () => {
    const c = counts.get(n) - 1
    c > 0 ? counts.set(n, c) : counts.delete(n)
  }
}
function addNote(note) {
  notes.push(note)
  return () => {
    const i = notes.indexOf(note)
    if (i >= 0) notes.splice(i, 1)
  }
}
// components reach the slide through useSlide(); v-step through the DOM; Notes through addNote
provide(SLIDE, { step, registerStep, addNote })

slides.set(id, {
  step,
  active,
  still,
  elements,
  registerStep,
})

onBeforeUnmount(() => {
  slides.delete(id)
  deck.unregister(id)
})
</script>
