<!-- A slide. `layout` picks the arrangement:
       default                    zones, top to bottom: the header (the title), the body (the
                                  rest) and the deck's footer. Any name other than the ones below
                                  is the same, with a layout-<name> class for the theme (two-cols…)
       cover | section            content centred, no zones; no footer unless asked for
       split                      header on top, then two zones side by side: #left and #right
       image-left | image-right   #image fills its side edge to edge; the default slot is the
                                  text side, padded like any slide
     Zones (default layout): when the default slot starts with a heading (h1 or h2), that is the
     slide's title and goes into the header (.ar-header), with the headings right after it (a
     subtitle, or one title per step with v-step.only); everything else is the body (.ar-body).
     A #title slot, when given, is the header instead (complex headers) and the whole default slot
     is the body. With neither, the body takes the whole slide.
       Slide
         h2 Three pillars          ← header
         Cols …                    ← body
     align="start|center|end" places the body vertically; without it, the theme's --ar-body-align
     decides (center unless the theme says otherwise; read from the slide's computed style). In a
     centred or end-aligned body, Cols/Rows/Grid placed directly in it centre their rows too
     (below). What fills the body (Img, Snippet, an element with flex: 1, the 1fr rows of
     Grid and Rows) still fills it, exactly as in a start-aligned body.
     The title in every layout (the header's heading, the split header's, the text side's in
     image-*) carries .ar-title and follows the --ar-title-* tokens (below).
     Footer: the Deck's #footer slot, drawn at the bottom of every slide (.ar-footer, a band
     --ar-footer-height tall) except on cover and section. :footer="false" hides it on a slide,
     :footer="true" shows it on a cover or a section. Its slot props are { number, total }: this
     slide's number (1-based) and the deck's slide count. The band takes the place of the slide's
     bottom padding: the body (split's and image-*'s zones too) ends where the footer begins.
     ratio="2 1" sizes the two zones left to right, whichever holds the image (default "1 1").
       Two entries, each a share (proportions: "2 1" = "0.5 0.25"), auto or a px size, as in
       Cols (layout/layout.js); an invalid ratio warns in development and the zones stay "1 1".
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
     (--ar-slide-bg-* tokens, below), and the bg-* props tune that one.
     Headings in the background or the footer are not the slide's title (the jump menu skips them).
     Speaker notes: Notes anywhere inside the slide (notes.js); only the presenter view shows them. -->
<template>
  <Transition name="ar-slide" :css="!still">
    <!-- export mode switches slides at once (no CSS transition): the book copies the slide on screen -->
    <section
      class="ar-slide"
      ref="el"
      v-show="active"
      :data-ar-slide="id"
      :class="['layout-' + layout, { 'ar-footed': footed() && !flat }]"
      :style="image ? zones : undefined"
    >
      <!-- in a thumbnail only the cover draws its content -->
      <template v-if="drawn">
        <div class="ar-slide-bg" aria-hidden="true">
          <Img v-if="picture" v-bind="picture" />
          <div class="ar-slide-bg-fill" v-else-if="kind || !renders($slots.background, { step })" :class="{ 'ar-slide-bg-theme': !kind }" :style="fill"></div>
          <slot name="background" :step="step" />
        </div>
        <template v-if="layout === 'split'">
          <div class="ar-slide-head" v-if="$slots.title || $slots.default">
            <VNodes :nodes="titled()" />
          </div>
          <div class="ar-zones" :style="zones">
            <div class="ar-zone ar-zone-left">
              <slot name="left" :step="step" />
            </div>
            <div class="ar-zone ar-zone-right">
              <slot name="right" :step="step" />
            </div>
          </div>
        </template>
        <!-- zones in visual order, left to right, so the DOM (and reading order) matches the screen -->
        <template v-else-if="layout === 'image-left'">
          <div class="ar-zone ar-zone-image">
            <slot name="image" :step="step" />
          </div>
          <div class="ar-zone ar-zone-text">
            <VNodes :nodes="titled()" />
          </div>
        </template>
        <template v-else-if="layout === 'image-right'">
          <div class="ar-zone ar-zone-text">
            <VNodes :nodes="titled()" />
          </div>
          <div class="ar-zone ar-zone-image">
            <slot name="image" :step="step" />
          </div>
        </template>
        <template v-else-if="flat">
          <slot name="title" :step="step" />
          <slot :step="step" />
        </template>
        <VNodes v-else :nodes="zoned()" />
        <footer class="ar-footer" v-if="footed()">
          <VNodes :nodes="footerSlot()({ number: index + 1, total })" />
        </footer>
      </template>
    </section>
  </Transition>
</template>

<script setup>
import { Comment, Fragment, Text, cloneVNode, computed, h, onMounted, ref, useSlots, watch, watchEffect } from 'vue'
import { useDeck } from '../state/deck'
import { createSlide } from '../state/slide'
import { isRatio, tracks } from './layout/layout'
import { bgKind, blurStyle, blurValue, imagesDir, isBlur, isOpacity, opacityValue } from '../core/image'
import Notes from './Notes.vue'
import Img from './Img.vue'

const ALIGN = ['start', 'center', 'end']
// layouts without zones: content centred, and no footer unless the slide asks for it
const FLAT = ['cover', 'section']

const props = defineProps({
  layout: { type: String, default: 'default' },
  // shown in the jump menu; defaults to the slide's first heading
  title: String,
  // vertical place of the body (default layout): start | center | end; default --ar-body-align
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
      console.warn(`[arao] Slide: bg="${v}" is none of the three: no file "${v}" in ${imagesDir}, not a URL (https://…, /…), and not a valid CSS background`)
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

const deck = useDeck()
const el = ref(null)
// its place in the stage, its step; still: export mode or a thumbnail, no transition; drawn:
// whether its content is (state/slide.js)
const { id, index, active, drawn, step, still, total, footer: footerSlot } = createSlide({ el, title: computed(() => props.title) })

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
const marked = (nodes) => nodes.map((n) => (heading(n) ? cloneVNode(n, { class: 'ar-title' }) : n))
// the nodes with their title marked .ar-title, in place; { nodes, tag } (its first heading's tag)
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
      key: 'ar-header',
      class: ['ar-header', head.tag && `ar-header-${head.tag}`, { 'ar-header-band': band.value }],
    }, head.nodes))
  }
  // a body of nothing visible (only Notes, v-if comments) gets no box; its Notes still mount
  if (body.some((n) => !blank(n))) zones.push(h('div', { key: 'ar-body', class: ['ar-body', `ar-body-${align.value}`] }, body))
  else zones.push(...body)
  return zones
}

// Body alignment: the prop, else the theme's token; and whether the theme gives the header a
// band (--ar-header-height). Tokens are CSS, so they are read from the slide's computed style
// once mounted and again whenever the theme changes (before the first paint either way);
// per-layout values (.layout-x { --ar-body-align: … }) work too.
const themeAlign = ref('center')
const band = ref(false)
let warned = false
function readTokens() {
  if (!el.value) return
  const style = getComputedStyle(el.value)
  const v = style.getPropertyValue('--ar-body-align').trim()
  if (v && !ALIGN.includes(v) && !warned && import.meta.env.DEV) {
    warned = true
    console.warn(`[arao] --ar-body-align: "${v}" is not start, center or end: the body is centred`)
  }
  themeAlign.value = ALIGN.includes(v) ? v : 'center'
  const hh = style.getPropertyValue('--ar-header-height').trim()
  band.value = !!hh && hh !== 'auto'
}
onMounted(readTokens)
watch(deck.theme, readTokens, { flush: 'post' })
const align = computed(() => props.align || themeAlign.value)

// The deck's #footer slot (Deck.vue provides it), shown on this slide or not
const footed = () => !!footerSlot() && (props.footer ?? !flat.value)
</script>

<style>
/* The slide: the canvas's size, padded (the safe margin), its content in a column. Its layout is
   a class, layout-<name>: the rules for cover, section, split, image-left, image-right and the
   legacy two-cols are below; any other name is the default layout, a class for the theme. */
.ar-slide {
  position: absolute; inset: 0;
  box-sizing: border-box;
  padding: var(--ar-pad);
  display: flex; flex-direction: column;
  isolation: isolate; /* its own stacking context: the background layer stays inside it */
}

/* Layers, bottom to top: the background (.ar-slide-bg), the content, then the addons (z-index 10,
   outside the slides). The background is Slide(bg="…"), the #background slot, or else the
   theme's default; it never catches the pointer, so it never gets in the way of the content. */
.ar-slide-bg {
  position: absolute; inset: 0; z-index: -1;
  overflow: hidden; pointer-events: none; user-select: none;
}
/* each child of the layer (the bg, every element of #background) covers the whole slide,
   stacked in order: an Img, then an overlay above it */
.ar-slide-bg > * { position: absolute; inset: 0; }
/* the theme's default background, on slides with none of their own (tokens, tokens.css):
     --ar-slide-bg-image      a CSS background-image: a gradient, or url(…) relative to the theme
                              file, url(../images/venue.jpg), which Vite resolves (default none)
     --ar-slide-bg-position   where it sits, as CSS background-position (default center)
     --ar-slide-bg-opacity    0..1 (default 1)
   It is drawn to cover the slide. A theme can leave a layout out:
     [data-theme="x"] .layout-section { --ar-slide-bg-image: none; } */
.ar-slide-bg-theme {
  background: var(--ar-slide-bg-image) var(--ar-slide-bg-position) / cover no-repeat;
  opacity: var(--ar-slide-bg-opacity);
}

/* Zones (default layout): the header (its title), the body, the footer.
   The header is as tall as its title, whose margin (--ar-title-gap, below) separates it from the
   body. When the theme sets --ar-header-height, the header is a band at least that tall with the
   title centred in it, and the gap goes under the band (.ar-header-band, below). */
.ar-header { flex: none; display: flex; flex-direction: column; }
.ar-header-band { min-height: var(--ar-header-height); justify-content: center; box-sizing: border-box; }
/* the body fills the rest: a column like the slide itself, so pieces and flex: 1 fill it */
.ar-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
/* centred / end-aligned (Slide align, --ar-body-align): what does not fill the body moves; what
   does not fit overflows at the bottom, as in a start-aligned body (safe). Pieces placed directly
   in it still fill it, but their auto rows shrink to their content and move with it (1fr rows,
   as Grid's, still fill), unless they hold something that needs the full height: a Snippet, an
   Img or another piece (those keep the rows as tall as the body, as in a start-aligned body),
   or set their own --_ar-align-content (Cols align="stretch"). Margins count as part of the
   content (a full-height body stays exactly as when start-aligned). */
.ar-body-center { justify-content: safe center; }
.ar-body-end { justify-content: safe flex-end; }
.ar-body-center > :is(.ar-cols, .ar-rows, .ar-grid):not(:has(.ar-snippet, .ar-img, .ar-cols, .ar-rows, .ar-grid, .ar-center)) { align-content: var(--_ar-align-content, safe center); }
.ar-body-end > :is(.ar-cols, .ar-rows, .ar-grid):not(:has(.ar-snippet, .ar-img, .ar-cols, .ar-rows, .ar-grid, .ar-center)) { align-content: var(--_ar-align-content, safe end); }

/* The deck's footer (Deck #footer): a band --ar-footer-height tall at the bottom of the slide, with
   the slide's side padding, its children in a row (--ar-footer-align: space-between puts one at
   the start, two at both ends). On slides with zones it takes the place of the bottom padding, so
   the content ends where it begins; on cover and section (only when asked for) it sits over the
   bottom padding. On a section it takes the section's text colour unless the theme sets
   --ar-footer-color for .layout-section. */
.ar-footer {
  position: absolute; left: 0; right: 0; bottom: 0;
  box-sizing: border-box; height: var(--ar-footer-height);
  padding: var(--ar-pad); padding-top: 0; padding-bottom: 0;
  display: flex; align-items: center; justify-content: var(--ar-footer-align); gap: var(--ar-gap-sm);
  font-size: var(--ar-footer-size); line-height: 1.2; color: var(--_ar-footer-color);
  white-space: nowrap;
}
.ar-slide.ar-footed { padding-bottom: var(--ar-footer-height); }
.ar-footed > .ar-zone-text { padding-bottom: 0; }
:where(.layout-section) { --ar-footer-color: currentColor; }

/* zones: Slide(layout="split" | "image-left" | "image-right" ratio="…") */
.ar-zones {
  flex: 1 1 auto; min-height: 0;
  display: grid; grid-template-rows: minmax(0, 1fr); gap: var(--ar-gap-lg);
}
/* a zone keeps its width: what is wider is clipped at its edge, never painted over the other zone */
.ar-zone { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow-x: clip; }
.layout-image-left, .layout-image-right { display: grid; grid-template-rows: minmax(0, 1fr); padding: 0; }
.ar-zone-text { box-sizing: border-box; padding: var(--ar-pad); }
/* the image fills its zone edge to edge (a theme may inset it) */
.ar-zone-image { position: relative; overflow: hidden; box-sizing: border-box; padding: var(--ar-image-inset); }
.ar-zone-image > * { flex: 1 1 0; min-height: 0; }
.ar-zone-image > :is(img, video, picture, svg, canvas) { display: block; width: 100%; height: 100%; object-fit: cover; }

/* utility classes: an escape hatch for one-off tweaks, not a styling system */
.ar-slide .muted { color: var(--ar-muted); }
.ar-slide .center { text-align: center; }
.ar-slide .upper { text-transform: uppercase; }
.ar-slide .small { font-size: var(--ar-text-small); }

/* slide transition */
.ar-slide-enter-active, .ar-slide-leave-active { transition: opacity var(--ar-slide-duration) ease; }
.ar-slide-enter-from, .ar-slide-leave-to { opacity: 0; }

/* Content, styled only through tokens */
.ar-slide h1 { font-size: var(--ar-title); line-height: 1.05; margin: 0 0 .4em; }
.ar-slide h2 { font-size: calc(var(--ar-title) * .6); margin: 0 0 .6em; color: var(--ar-accent); }
.ar-slide p { margin: 0 0 .6em; }

/* The slide's title (.ar-title): the heading of the header, of split's header, of the text side
   of image-*. Without the tokens it looks as any h1/h2 does:
     --ar-title-size    its font size (default: an h2 is 0.6x --ar-title, an h1 --ar-title)
     --ar-title-color   its colour (default: an h2 in the accent, an h1 in the text colour)
     --ar-title-align   start | center | end (default: as the slide's text)
     --ar-title-gap     the space under it, before the body (default .6em of an h2, .4em of an h1;
                        em is the title's size, as for any margin of it)
   Same specificity as the rules above, after them: a deck's own h2 rule still wins. Each reads
   the token, or its default for that heading, through a private --_ar-h1-…/--_ar-h2-… (tokens.css). */
.ar-slide h1:where(.ar-title) {
  font-size: var(--_ar-h1-size);
  color: var(--_ar-h1-color);
  text-align: var(--ar-title-align);
  margin-bottom: var(--_ar-h1-gap);
}
.ar-slide h2:where(.ar-title) {
  font-size: var(--_ar-h2-size);
  color: var(--_ar-h2-color);
  text-align: var(--ar-title-align);
  margin-bottom: var(--_ar-h2-gap);
}
/* in a header band (--ar-header-height) the gap goes under the band, so the title sits centred in
   it; its default is the same length as above (em of the title, computed from the size tokens) */
.ar-header-band > .ar-title { margin-bottom: 0; }
.ar-header-band { margin-bottom: var(--_ar-band-gap); }
.ar-header-band.ar-header-h1 { margin-bottom: var(--_ar-h1-band-gap); }
.ar-header-band.ar-header-h2 { margin-bottom: var(--_ar-h2-band-gap); }

/* lists: --ar-list-gap between items (default 0). Zero specificity: a deck's li rule wins. */
:where(.ar-slide li + li) { margin-top: var(--ar-list-gap); }

/* tables: a plain default, full width, all of it from tokens (zero specificity: a deck's table rules win)
     --ar-table-pad         cell padding (default .4em .8em)
     --ar-table-border      the line under every row (default 2px, the text colour at 15 %)
     --ar-table-head-bg     header cells' background (default none)
     --ar-table-head-color  header cells' text (default --ar-muted)
     --ar-table-stripe      background of every other body row (default none) */
:where(.ar-slide table) { width: 100%; border-collapse: collapse; }
:where(.ar-slide :is(th, td)) {
  padding: var(--ar-table-pad);
  text-align: start;
  border-bottom: var(--_ar-table-border);
}
:where(.ar-slide th) {
  background: var(--ar-table-head-bg);
  color: var(--_ar-table-head-color);
  font-weight: 600;
}
:where(.ar-slide tbody tr:nth-child(even)) { background: var(--ar-table-stripe); }

/* the footer's own paragraphs, if any, sit on its line */
.ar-footer p { margin: 0; }

/* layouts */
.layout-cover { justify-content: center; }
.layout-cover h1 { font-size: calc(var(--ar-title) * 1.25); }
.layout-cover .bar { width: 160px; height: 10px; background: var(--ar-accent); border-radius: 5px; margin: 0 0 48px; }

.layout-section { justify-content: center; align-items: center; text-align: center;
  background: var(--ar-accent); color: var(--ar-accent-fg); }
.layout-section h1 { font-size: calc(var(--ar-title) * 1.4); }

.layout-two-cols .cols { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ar-gap-lg); flex: 1; }
</style>
