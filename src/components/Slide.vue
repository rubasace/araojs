<!-- A slide. Its one prop, layout, is a name: the slide's section carries the class layout-<name>
     (layout-default without it), and CSS does the rest. The engine renders every slide the same
     way, whatever its layout, and has no code for any of them: a layout is one CSS file, named as
     the layout, in the library's layouts/ folder (cover, section, split, image-left,
     image-right: each file says what it does and the tokens it reads) or the project's
     src/layouts (the Vite plugin loads both, the project's after; one of the same name replaces
     the library's). A name with no CSS is the default layout, below.
     What a slide renders, in this order:
       the background layer     .ar-slide-bg, behind everything, edge to edge (below)
       the header               .ar-header: the title the default slot starts with (below)
       the body                 .ar-body: the rest of the default slot
       a zone per named slot    .ar-zone-<name>: template(#image), template(#left)… each in a box
                                of its own, in the order written; a layout's CSS places them
                                (#title is the header's, below)
       the footer               .ar-footer: the Deck's #footer slot
     The default layout lays them out in a column, inside the slide's padding (--ar-pad): the
     header, then the body filling the rest.
       Slide
         h2 Three pillars          ← header
         Cols …                    ← body
     Header: when the default slot starts with a heading (h1 or h2), that is the slide's title and
     goes into the header, with the headings right after it (a subtitle, or one title per step
     with v-step.only); Notes and Background before it do not count. A #title slot, when given, is
     the header instead (complex headers) and the whole default slot is the body. With neither, the
     body takes the whole slide. The title carries .ar-title and follows the --ar-title-* tokens
     (below); --ar-header-height makes the header a band (read from the slide's computed style).
     Body: a column, its content from the top, right under the header, on every slide alike. The
     token --ar-body-align places it (start, the default; center; end), so a theme or a layout can
     change it, and so can a class on the slide: top, center (the text centred too) or bottom
     (utility classes, below). In a centred or end-aligned body, Cols/Rows/Grid placed directly in
     it centre their rows too (below); what fills the body (Img, Snippet, an element with flex: 1,
     the 1fr rows of Grid and Rows) still fills it.
     Footer: the Deck's #footer slot, drawn on every slide (a band --ar-footer-height tall over the
     bottom of the slide, in its padding); whether it shows is CSS: the default layout shows it, a
     layout's token can hide it (cover and section do), and a class on the slide overrides both:
     no-footer hides it, with-footer shows it. Its slot props are { number, total }: this slide's
     number (1-based) and the deck's slide count.
     Background: a layer under the content, as big as the slide, never in the pointer's way. It
     shows the theme's default background (--ar-slide-bg-* tokens, below), unless the slide holds
     a Background (Background.vue), which draws itself there instead. A plain colour or a gradient
     is CSS on the slide, which the theme's default background (if any) covers like any other:
       Slide(style="background: #1d2b4a; --ar-slide-bg-image: none")
     Classes and styles on a Slide go on its section, as a layout's own do.
     The slide's name in the jump menu, the presenter view and the notes pages is the text of its
     first heading outside the background and the footer (state/stage.ts).
     Speaker notes: Notes anywhere inside the slide (notes.ts); only the presenter view shows them. -->
<template>
  <Transition name="ar-slide" :css="!still">
    <!-- export mode switches slides at once (no CSS transition): the book copies the slide on screen -->
    <section
      class="ar-slide"
      ref="el"
      v-show="active"
      :data-ar-slide="id"
      :class="'layout-' + layout"
    >
      <!-- in a thumbnail only the cover draws its content -->
      <template v-if="drawn">
        <div class="ar-slide-bg" ref="layer" aria-hidden="true">
          <div class="ar-slide-bg-theme"></div>
        </div>
        <VNodes :nodes="zoned()" />
        <div v-for="name in zoneNames()" :key="name" :class="['ar-zone', 'ar-zone-' + name]">
          <slot :name="name" :step="step" />
        </div>
        <footer class="ar-footer" v-if="footerSlot()">
          <VNodes :nodes="footerSlot()({ number: index + 1, total })" />
        </footer>
      </template>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { Comment, Text, cloneVNode, h, onMounted, ref, shallowRef, useSlots, watch, type FunctionalComponent, type VNode } from 'vue'
import { useDeck } from '../state/deck'
import { createSlide } from '../state/slide'
import Notes from './Notes.vue'
import Background from './Background.vue'

const props = defineProps({
  // the layout: the section's class is layout-<name>, and the layout's CSS (layouts/) does the rest
  layout: { type: String, default: 'default' },
})
const slots = useSlots()

const deck = useDeck()
const el = ref<HTMLElement | null>(null)
// the background layer, where a Background inside the slide draws itself (Background.vue)
const layer = shallowRef<HTMLElement | null>(null)
// its place in the stage, its step; still: export mode or a thumbnail, no transition; drawn:
// whether its content is (state/slide.ts)
const { id, index, active, drawn, step, still, total, footer: footerSlot } = createSlide({ el, layer })

// ---- zones: header, body, a zone per named slot -----------------------------------------------
// Slot content rendered by this component's own render (VNodes only places it), so a change in
// it re-renders the slide as before, and onUpdated still sweeps v-step.
const VNodes: FunctionalComponent<{ nodes: VNode[] }> = (p) => p.nodes
VNodes.props = ['nodes']

// The title: the heading(s) a slot's content starts with, h1 or h2: one title, a title and its
// subtitle, or one title per step (h2(v-step.only.collapse="1"), h2(…="2")…). Comments (v-if),
// blank text, Notes and Background (they draw nothing where they are) do not count. In a #title
// slot, which is all header, the headings may come after something else (a kicker line).
// → [first, end): the title is nodes[first] up to nodes[end - 1]; first = -1 when there is none.
const blank = (n: VNode) => n.type === Comment || n.type === Notes || n.type === Background || (n.type === Text && !String(n.children).trim())
const heading = (n: VNode) => n.type === 'h1' || n.type === 'h2'
function titleRun(nodes: VNode[], anywhere = false): [number, number] {
  let i = 0
  while (i < nodes.length && (blank(nodes[i]) || (anywhere && !heading(nodes[i])))) i++
  if (i === nodes.length || !heading(nodes[i])) return [-1, -1]
  let end = i + 1
  for (let j = end; j < nodes.length && (blank(nodes[j]) || heading(nodes[j])); j++) if (heading(nodes[j])) end = j + 1
  return [i, end]
}
const marked = (nodes: VNode[]) => nodes.map((n) => (heading(n) ? cloneVNode(n, { class: 'ar-title' }) : n))
// the nodes with their title marked .ar-title, in place; { nodes, tag } (its first heading's tag)
type Marked = { nodes: VNode[]; tag: VNode['type'] | null }
function mark(nodes: VNode[], anywhere?: boolean): Marked {
  const [first, end] = titleRun(nodes, anywhere)
  if (first < 0) return { nodes, tag: null }
  return { nodes: [...nodes.slice(0, first), ...marked(nodes.slice(first, end)), ...nodes.slice(end)], tag: nodes[first].type }
}
// the header (#title, else the title the default slot starts with) and the body (the rest)
function zoned() {
  const scope = { step: step.value }
  const content = slots.default?.(scope) ?? []
  let head: Marked | null = null
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
  const zones: VNode[] = []
  if (head) {
    zones.push(h('div', {
      key: 'ar-header',
      class: ['ar-header', head.tag && `ar-header-${String(head.tag)}`, { 'ar-header-band': band.value }],
    }, head.nodes))
  }
  // a body of nothing visible (only Notes, Backgrounds, v-if comments) gets no box; they still mount
  if (body.some((n) => !blank(n))) zones.push(h('div', { key: 'ar-body', class: 'ar-body' }, body))
  else zones.push(...body)
  return zones
}
// the named slots that are zones: all but the default slot and #title (the header's)
const zoneNames = () => Object.keys(slots).filter((n) => n !== 'default' && n !== 'title')

// Whether the theme gives the header a band (--ar-header-height). Tokens are CSS, so it is read
// from the slide's computed style once mounted, and again whenever the theme or the layout
// changes (before the first paint either way); per-layout values (.layout-x { … }) work too.
const band = ref(false)
function readBand() {
  if (!el.value) return
  const hh = getComputedStyle(el.value).getPropertyValue('--ar-header-height').trim()
  band.value = !!hh && hh !== 'auto'
}
onMounted(readBand)
watch([deck.theme, () => props.layout], readBand, { flush: 'post' })
</script>

<style>
/* The slide: the canvas's size, padded (the safe margin), its content in a column: the default
   layout. A layout (layouts/) restyles it through its class, layout-<name>. */
.ar-slide {
  position: absolute; inset: 0;
  box-sizing: border-box;
  padding: var(--ar-pad);
  display: flex; flex-direction: column;
  isolation: isolate; /* its own stacking context: the background layer stays inside it */
}

/* Layers, bottom to top: the slide's own background (CSS on the slide, a layout's colour), the
   background layer (.ar-slide-bg), the content, the footer, then the addons (z-index 10, outside
   the slides). The layer never catches the pointer, so it never gets in the way of the content. */
.ar-slide-bg {
  position: absolute; inset: 0; z-index: -1;
  overflow: hidden; pointer-events: none; user-select: none;
}
/* each child of the layer (the theme's default, every Background) covers the whole slide,
   stacked in order */
.ar-slide-bg > * { position: absolute; inset: 0; }
/* the theme's default background (tokens, tokens.css):
     --ar-slide-bg-image      a CSS background-image: a gradient, or url(…) relative to the theme
                              file, url(../images/venue.jpg), which Vite resolves (default none)
     --ar-slide-bg-position   where it sits, as CSS background-position (default center)
     --ar-slide-bg-opacity    0..1 (default 1)
   It is drawn to cover the slide, but on a slide with a Background of its own. A theme can leave
   a layout out, and a slide too (style="--ar-slide-bg-image: none"):
     [data-theme="x"] .layout-section { --ar-slide-bg-image: none; } */
.ar-slide-bg-theme {
  background: var(--ar-slide-bg-image) var(--ar-slide-bg-position) / cover no-repeat;
  opacity: var(--ar-slide-bg-opacity);
}
.ar-slide-bg:has(> .ar-background) > .ar-slide-bg-theme { display: none; }

/* Zones (default layout): the header (its title), the body.
   The header is as tall as its title, whose margin (--ar-title-gap, below) separates it from the
   body. When the theme sets --ar-header-height, the header is a band at least that tall with the
   title centred in it, and the gap goes under the band (.ar-header-band, below). */
.ar-header { flex: none; display: flex; flex-direction: column; }
.ar-header-band { min-height: var(--ar-header-height); justify-content: center; box-sizing: border-box; }
/* The body fills the rest: a column like the slide itself, so pieces and flex: 1 fill it. What
   does not fill it sits where --ar-body-align says (start, center, end; default start); what does
   not fit overflows at the bottom, never at the top (safe; an invalid value is start). Pieces
   placed directly in it still fill it, but their auto rows shrink to their content and move with
   it (1fr rows, as Grid's, still fill), unless they hold something that needs the full height: a
   Snippet, an Img or another piece (those keep the rows as tall as the body), or set their own
   --_ar-align-content (Cols align="stretch"). Zero specificity: a class on the piece wins. */
.ar-body {
  flex: 1 1 auto; min-height: 0;
  display: flex; flex-direction: column;
  justify-content: safe var(--ar-body-align);
}
:where(.ar-body > :is(.ar-cols, .ar-rows, .ar-grid):not(:has(.ar-snippet, .ar-img, .ar-cols, .ar-rows, .ar-grid, .ar-center))) {
  align-content: var(--_ar-align-content, safe var(--ar-body-align));
}

/* A zone, one per named slot (template(#image) → .ar-zone-image): a column, placed by the
   layout's CSS (a slide whose layout places none shows them below the body). It keeps its width:
   what is wider is clipped at its edge, never painted over its neighbour; heights do not clip. */
.ar-zone { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow-x: clip; }

/* The deck's footer (Deck #footer): a band --ar-footer-height tall at the bottom of the slide, over
   its bottom padding (keep that padding at least as tall: the body ends where the padding begins,
   footer or not), with the slide's side padding, its children in a row (--ar-footer-align:
   space-between puts one at the start, two at both ends), above the content. A layout hides it
   with a token of its own (cover, section); a slide's class wins over both: no-footer hides it,
   with-footer shows it. */
.ar-footer {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 1;
  box-sizing: border-box; height: var(--ar-footer-height);
  padding: var(--ar-pad); padding-top: 0; padding-bottom: 0;
  display: flex; align-items: center; justify-content: var(--ar-footer-align); gap: var(--ar-gap-sm);
  font-size: var(--ar-footer-size); line-height: 1.2; color: var(--_ar-footer-color);
  white-space: nowrap;
}
.ar-slide.no-footer > .ar-footer { display: none; }
.ar-slide.with-footer > .ar-footer { display: flex; }

/* utility classes: an escape hatch for one-off tweaks, not a styling system */
.ar-slide .muted { color: var(--ar-muted); }
.ar-slide .upper { text-transform: uppercase; }
.ar-slide .small { font-size: var(--ar-text-small); }
/* Where content sits. On a Slide: its body, from the top (top), centred both ways (center: its
   text centred too, the title's included) or at the bottom (bottom), whatever the theme's
   --ar-body-align. On a block inside a slide: its content within it, when the block is taller
   than it (a column of Cols, a cell of Grid, a block given a height); center centres its text
   too. */
.ar-slide.top { --ar-body-align: start; }
.ar-slide.center { --ar-body-align: center; text-align: center; }
.ar-slide.bottom { --ar-body-align: end; }
.ar-slide .top { align-content: start; }
.ar-slide .center { align-content: safe center; text-align: center; }
.ar-slide .bottom { align-content: safe end; }

/* slide transition */
.ar-slide-enter-active, .ar-slide-leave-active { transition: opacity var(--ar-slide-duration) ease; }
.ar-slide-enter-from, .ar-slide-leave-to { opacity: 0; }

/* Content, styled only through tokens. Headings in the theme's heading font (--ar-font-heading),
   else in the font around them, as before it existed (it has no default: the fallback inherits);
   zero specificity of the slide: a deck's own heading rule wins. */
:where(.ar-slide) :is(h1, h2, h3, h4, h5, h6) { font-family: var(--ar-font-heading, inherit); }
.ar-slide h1 { font-size: var(--ar-title); line-height: 1.05; margin: 0 0 .4em; }
.ar-slide h2 { font-size: calc(var(--ar-title) * .6); margin: 0 0 .6em; color: var(--ar-accent); }
.ar-slide p { margin: 0 0 .6em; }

/* The slide's title (.ar-title): the heading(s) of its header, in every layout. Without the
   tokens it looks as any h1/h2 does:
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
</style>
