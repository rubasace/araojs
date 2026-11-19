<!-- A slide. Its one prop, layout, is a name: the slide's section carries the class layout-<name>
     (layout-default without it), and CSS does the rest. The engine renders every slide the same
     way, whatever its layout, and has no code for any of them: a layout is one CSS file, named as
     the layout, in the library's layouts/ folder (cover, section, split, grid, quote, statement,
     overlay, caption, agenda, image-left, image-right: each file starts with a doc block saying
     what it is for, how to use it, its zones and its parameters: vite/layout-docs.js reads it) or
     the project's src/layouts (the Vite plugin loads both, the project's after; one of the same
     name replaces the library's). A name with no CSS is the default layout, below.
     A layout's parameters are attributes: each token of its own its CSS reads,
     --ar-layout-<layout>-<thing>, is an attribute <thing> of a slide of that layout (or <thing>
     in camelCase), whose value is set as that token in the section's style, verbatim, instead of
     an attribute: Slide(layout="image-right" columns="2fr 1fr") sets
     --ar-layout-image-right-columns: 2fr 1fr on that slide (params(), below). Which tokens a
     layout has comes from the Vite plugin (virtual:arao/layout-tokens; what is one:
     vite/layout-params.js): there is no code here for any layout. Any other attribute goes on the
     section as it is.
     What a slide renders, in this order:
       the background layer     .ar-slide-bg, behind everything, edge to edge (below)
       the header               .ar-header: the title the default slot starts with, and its
                                subtitle (below)
       the body                 .ar-body: the rest of the default slot
       a zone per named slot    .ar-zone-<name>: template(#image), a project layout's… each in a box
                                of its own, in the order written; a layout's CSS places them
                                (#title is the header's, below). Any name renders; the types take
                                the layout's zones only (its @zone, the .ar-zone-<name> it styles)
       the footer               .ar-footer: the Deck's #footer slot
     The default layout lays them out in a column, inside the slide's padding (--ar-pad-y, --ar-pad-x): the
     header, then the body filling the rest.
       Slide
         h2 Three pillars          ← header
         Cols …                    ← body
     Header: when the default slot starts with a heading (h1 or h2), that is the slide's title and
     goes into the header, with the headings right after it: those of its tag are titles too (one
     title per step with v-step.only), any other is its subtitle (h2 then h3, the convention: h1 on
     a cover or a section, h2 a slide's title, h3 a subtitle or a heading inside). Notes and
     Background before it do not count. A #title slot, when given, is the header instead (complex
     headers) and the whole default slot is the body. With neither, the body takes the whole
     slide. The title carries .ar-title and looks the same whatever its tag (h1 or h2): the
     --ar-title-* tokens (below), which a layout may set for its slides; a subtitle .ar-subtitle,
     its own --ar-subtitle-* tokens. --ar-header-height makes the header a band (read from the
     slide's computed style).
     Body: a column, its content from the top, right under the header, on every slide alike. The
     token --ar-body-align places it (start, the default; center; end), so a theme or a layout can
     change it, and so can a class on the slide: top, center (the text centred too) or bottom
     (utility classes, below). In a centred or end-aligned body, Cols/Rows/Grid placed directly in
     it centre their rows too (below); what fills the body (Img, Snippet, an element with flex: 1,
     the 1fr rows of Grid and Rows) still fills it.
     Footer: the Deck's #footer slot, drawn on every slide (a band --ar-footer-height tall over the
     bottom of the slide, in its padding); whether it shows is CSS: the default layout shows it, a
     layout's token can hide it (cover and section do), and a class on the slide overrides both:
     no-footer hides it, with-footer shows it. The slide's bottom padding is always at least the band
     (max(--ar-pad-y, --ar-footer-height)), footer or not, so the content never sits under it and
     every slide's body ends at the same place. Its slot props are { number, total }: this slide's number (1-based) and the
     deck's slide count.
     Background: a layer under the content, as big as the slide, never in the pointer's way. It
     shows the theme's default background (--ar-slide-bg-* tokens, below), unless the slide holds
     a Background (Background.vue), which draws itself there instead. A plain colour or a gradient
     is CSS on the slide, which the theme's default background (if any) covers like any other:
       Slide(style="background: #1d2b4a; --ar-slide-bg-image: none")
     Classes and styles on a Slide go on its section, as a layout's own do (a parameter's token
     is set after the slide's style, so it wins over the same token there).
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
      v-bind="params()"
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
      <!-- the others draw their title alone, hidden, so the deck knows every slide's title there
           too (an Agenda on the cover lists the sections') -->
      <VNodes v-else :nodes="titleOnly()" />
    </section>
  </Transition>
</template>

<script lang="ts">
import type { ComponentPublicInstance, PublicProps } from 'vue'
import type { LibraryLayoutZones, LibraryLayouts } from './library-layouts'

/**
 * The project's layouts, and the attributes a slide of each takes: added by module augmentation,
 * which the Vite plugin writes for src/layouts (src/arao-layouts.d.ts), with what each file's doc
 * block says of it (vite/layout-docs.js): layout, its name, documented, and one optional string
 * per token the layout's CSS reads, under its <thing> in camelCase:
 *   declare module 'araojs' { interface ProjectLayouts { quote: { size?: string } } }
 * A layout named like a library one replaces it here too, its parameters with it.
 */
export interface ProjectLayouts {}

/**
 * The zones of the project's layouts, the named templates each places (besides #title): added the
 * same way, one member per zone (what it is does not matter: Slide's slots make each a slot), its
 * description as its doc:
 *   declare module 'araojs' { interface ProjectLayoutZones { quote: { author: true } } }
 * A project layout with no entry here (a name declared by hand in ProjectLayouts) has none.
 */
export interface ProjectLayoutZones {}

/**
 * Every layout a Slide can name, and its attributes: the library's (layouts/, plus default:
 * library-layouts.ts, generated from that folder by scripts/layout-types.mjs), with the project's
 * over them (ProjectLayouts). keyof SlideLayouts is the names, what the layout prop accepts in a
 * template checked by Volar / vue-tsc; SlideLayouts[name] the attributes a slide of that layout
 * takes (its parameters, and layout, documented with what the layout says of itself, which an
 * editor shows on hovering layout="…"). Types only: at runtime the prop is any string (one with no
 * CSS is the default layout).
 */
export type SlideLayouts = {
  [K in keyof LibraryLayouts | keyof ProjectLayouts]: K extends keyof ProjectLayouts ? ProjectLayouts[K]
    : K extends keyof LibraryLayouts ? LibraryLayouts[K] : never
}

/**
 * Every layout's zones, the named templates a slide of it takes besides #title: the library's
 * (LibraryLayoutZones), with the project's over them (ProjectLayoutZones; a project layout that
 * has no entry there has none, not the library's of its name).
 */
export type SlideLayoutZones = {
  [K in keyof SlideLayouts]: K extends keyof ProjectLayoutZones ? ProjectLayoutZones[K]
    : K extends keyof ProjectLayouts ? {}
    : K extends keyof LibraryLayoutZones ? LibraryLayoutZones[K] : {}
}

/** A Slide's props for a layout: the layout's name, and its parameters. */
type SlideProps<L extends keyof SlideLayouts> = { layout?: L } & SlideLayouts[L]
/** A slot of a Slide, given the slide's current step. */
type SlideSlot = (props: { step: number }) => unknown
/**
 * The zones of a slide whose layout is L, each a slot, with the zone's description as its doc (a
 * mapped type of the zones keeps it): that layout's, or, when L is several (:layout="x", x one of
 * them), any of theirs, as it takes any of their parameters: each layout's zone slots, put together
 * (a union of function parameters infers their intersection). The mapped type is written out, not
 * named, so that an error lists the zones there are.
 */
type SlideZoneSlots<L extends keyof SlideLayouts> =
  (L extends keyof SlideLayouts ? (zones: { [Z in keyof SlideLayoutZones[L]]?: SlideSlot }) => void : never) extends (zones: infer Z) => void ? Z : never
/** Its slots for a layout: the default and #title, every slide's, and the layout's zones. */
type SlideSlots<L extends keyof SlideLayouts> = {
  /** The slide's content: its title (the h1 or h2 it starts with) and its subtitle (the headings right after it) in the header, then the body. */
  default?: SlideSlot
  /** The slide's header instead of the heading its content starts with (a kicker line, a logo): the whole content is then the body. */
  title?: SlideSlot
} & SlideZoneSlots<L>
/**
 * Slide as templates see it (exported as such, src/index.ts): generic in its layout, so that the
 * attributes it accepts are that layout's parameters, and no other layout's, besides what every
 * component takes (class, style, key, ref), and its named templates that layout's zones, and no
 * other's, besides #title. Volar infers L from layout="…"; without one it is default, which takes
 * no parameter and has no zone.
 */
export type SlideComponent = new <L extends keyof SlideLayouts = 'default'>(props: SlideProps<L> & PublicProps) =>
  Omit<ComponentPublicInstance<SlideProps<L>, {}, {}, {}, {}, {}, PublicProps>, '$slots'> & { $slots: SlideSlots<L> }
</script>

<script setup lang="ts">
import { Comment, Fragment, Text, camelize, cloneVNode, h, onMounted, onUpdated, ref, shallowRef, useAttrs, useSlots, watch, type FunctionalComponent, type PropType, type StyleValue, type VNode } from 'vue'
import { layoutTokens } from 'virtual:arao/layout-tokens'
import { useDeck } from '../state/deck'
import { createSlide } from '../state/slide'
import Notes from './Notes.vue'
import Background from './Background.vue'

// the attributes go on the section, a layout's parameters as tokens (params(), below)
defineOptions({ inheritAttrs: false })
const props = defineProps({
  // the layout: the section's class is layout-<name>, and the layout's CSS (layouts/) does the rest
  layout: { type: String as PropType<keyof SlideLayouts>, default: 'default' },
})
const slots = useSlots()
const attrs = useAttrs()

// ---- the layout's parameters ------------------------------------------------------------------
// The slide's attributes, for its section: each one named as a parameter of its layout (a token
// its CSS reads, --ar-layout-<layout>-<thing>: <thing>, or <thing> in camelCase, the form a
// template may also write) becomes that token in the style, its value as it is, after the slide's
// own style (the same token there loses); one empty sets nothing (the layout's default stays).
// The rest go on as they are. Called by the render, so a change in the attributes or the layout
// applies at once.
function params() {
  const things = layoutTokens[props.layout] ?? []
  const tokens: Record<string, string> = {}
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(attrs)) {
    const thing = things.find((t) => t === key || camelize(t) === key)
    if (thing === undefined) rest[key] = value
    else if (value != null && value !== false && value !== '') tokens[`--ar-layout-${props.layout}-${thing}`] = String(value)
  }
  return { ...rest, style: [rest.style as StyleValue, tokens] }
}

const deck = useDeck()
const el = ref<HTMLElement | null>(null)
// the background layer, where a Background inside the slide draws itself (Background.vue)
const layer = shallowRef<HTMLElement | null>(null)
// its place in the stage (with its layout, for useDeck().slides), its step; still: export mode or
// a thumbnail, no transition; drawn: whether its content is (state/slide.ts)
const { id, index, active, drawn, step, still, total, footer: footerSlot } = createSlide({ el, layer, layout: () => props.layout })

// ---- zones: header, body, a zone per named slot -----------------------------------------------
// Slot content rendered by this component's own render (VNodes only places it), so a change in
// it re-renders the slide as before, and onUpdated still sweeps v-step.
const VNodes: FunctionalComponent<{ nodes: VNode[] }> = (p) => p.nodes
VNodes.props = ['nodes']

// The title: the heading(s) a slot's content starts with: an h1 or an h2, then any heading right
// after it. Those of its tag are titles (one title, or one per step: h2(v-step.only.collapse="1"),
// h2(…="2")…), any other its subtitle (h2 then h3). Comments (v-if), blank text, Notes and
// Background (they draw nothing where they are) do not count. In a #title slot, which is all
// header, the headings may come after something else (a kicker line).
// → [first, end): the title is nodes[first] up to nodes[end - 1]; first = -1 when there is none.
const blank = (n: VNode) => n.type === Comment || n.type === Notes || n.type === Background || (n.type === Text && !String(n.children).trim())
const opens = (n: VNode) => n.type === 'h1' || n.type === 'h2'
const heading = (n: VNode) => typeof n.type === 'string' && /^h[1-6]$/.test(n.type)
// A slot's nodes, its fragments opened: a component wrapping Slide passes its own slot on as one
// fragment (Slide: slot), a v-for at the top is one, and what they hold is the slide's content
// all the same (its title first). The DOM is the same either way.
const flat = (nodes: VNode[]): VNode[] => nodes.flatMap((n) => (n.type === Fragment && Array.isArray(n.children) ? flat(n.children as VNode[]) : [n]))
function titleRun(nodes: VNode[], anywhere = false): [number, number] {
  let i = 0
  while (i < nodes.length && (blank(nodes[i]) || (anywhere && !opens(nodes[i])))) i++
  if (i === nodes.length || !opens(nodes[i])) return [-1, -1]
  let end = i + 1
  for (let j = end; j < nodes.length && (blank(nodes[j]) || heading(nodes[j])); j++) if (heading(nodes[j])) end = j + 1
  return [i, end]
}
// a title's run (it starts with its first heading), its headings marked: .ar-title, or
// .ar-subtitle for a tag other than the first one's
function marked(nodes: VNode[]) {
  const tag = nodes[0].type
  return nodes.map((n) => (heading(n) ? cloneVNode(n, { class: n.type === tag ? 'ar-title' : 'ar-subtitle' }) : n))
}
// the nodes with their title marked, in place; { nodes, tag } (its first heading's tag)
type Marked = { nodes: VNode[]; tag: VNode['type'] | null }
function mark(nodes: VNode[], anywhere?: boolean): Marked {
  const [first, end] = titleRun(nodes, anywhere)
  if (first < 0) return { nodes, tag: null }
  return { nodes: [...nodes.slice(0, first), ...marked(nodes.slice(first, end)), ...nodes.slice(end)], tag: nodes[first].type }
}
// the header (#title, else the title the default slot starts with) and the body (the rest)
function zoned() {
  const scope = { step: step.value }
  const content = flat(slots.default?.(scope) ?? [])
  let head: Marked | null = null
  let body = content
  if (slots.title) {
    head = mark(flat(slots.title(scope)), true)
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
// A slide whose content is not drawn (a thumbnail's, but its cover): its title alone, hidden, for
// the deck's list of slides (state/slide.ts reads it); nothing else of it mounts.
function titleOnly() {
  const scope = { step: step.value }
  const nodes = flat((slots.title ?? slots.default)?.(scope) ?? [])
  const [first, end] = titleRun(nodes, !!slots.title)
  return first < 0 ? [] : [h('div', { class: 'ar-header', style: { display: 'none' } }, marked(nodes.slice(first, end)))]
}
// the named slots that are zones: all but the default slot and #title (the header's), and only
// slots: after a hot reload Vue's own flag (_) is among the keys of the slots object
const zoneNames = () => Object.keys(slots).filter((n) => n !== 'default' && n !== 'title' && typeof slots[n] === 'function')

// What CSS alone cannot say, read from the computed style: whether the theme gives the header a
// band (--ar-header-height). Read once mounted, after every render, and whenever the theme or the
// layout changes, before the first paint either way; per-layout values (.layout-x { … }) work too.
const band = ref(false)
function readTokens() {
  if (!el.value) return
  const hh = getComputedStyle(el.value).getPropertyValue('--ar-header-height').trim()
  band.value = !!hh && hh !== 'auto'
}
onMounted(readTokens)
onUpdated(readTokens)
watch([deck.theme, () => props.layout], readTokens, { flush: 'post' })
</script>

<style>
/* The slide: the canvas's size, padded (the safe margin), its content in a column: the default
   layout. A layout (layouts/) restyles it through its class, layout-<name>. */
.ar-slide {
  position: absolute; inset: 0;
  box-sizing: border-box;
  /* the safe margin; the bottom is at least the footer's band, whether it shows or not */
  padding: var(--ar-pad-y) var(--ar-pad-x) max(var(--ar-pad-y), var(--ar-footer-height));
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
   The header is as tall as its title (and its subtitle), and its margin (--ar-title-gap, below)
   separates it from the body. When the theme sets --ar-header-height, the header is a band at
   least that tall with the title centred in it, the gap under the band. */
.ar-header { flex: none; display: flex; flex-direction: column; margin-bottom: var(--_ar-title-gap); }
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

/* The deck's footer (Deck #footer): a band --ar-footer-height tall at the bottom of the slide, in
   its bottom padding, with the slide's side padding, its children in a row (--ar-footer-align:
   space-between puts one at the start, two at both ends), above the content. A layout hides it
   with a token of its own (cover, section); a slide's class wins over both: no-footer hides it,
   with-footer shows it. The slide's bottom padding is always at least the band (.ar-slide), so
   the content never sits under it; a layout that pads its zones itself instead of the slide
   (image-*) does the same for them, with the same max(). */
.ar-footer {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 1;
  box-sizing: border-box; height: var(--ar-footer-height);
  padding: 0 var(--ar-pad-x);
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

/* The slide's title (.ar-title) and its subtitle (.ar-subtitle): the headings of its header, in
   every layout. The title looks the same whatever its tag, h1 or h2: its look is the tokens' (and
   a layout's, which may set them or style its own title: a cover's and a section's are larger),
   never the tag's. Its defaults are an h2's (the convention: h2 a slide's title, h1 on a cover or
   a section, h3 a subtitle or a heading inside); the headings of the body keep the rules above.
     --ar-title-size       its font size (default 0.6x --ar-title)
     --ar-title-color      its colour (default --ar-accent)
     --ar-title-align      start | center | end, the subtitle's too (default: as the slide's text)
     --ar-title-gap        the space under the header, before the body (default 0.6x the title's
                           size; em there is the slide's text size)
     --ar-subtitle-size    the subtitle's font size (default 0.45x --ar-title)
     --ar-subtitle-color   its colour (default --ar-muted)
     --ar-subtitle-gap     the space above it, under the title (default .2em: its own size)
   Same specificity as the rules above, after them: a deck's own h2 rule still wins. The tokens
   whose default is another token are read through a private --_ar-… (tokens.css). */
.ar-slide :is(h1, h2, h3, h4, h5, h6):where(.ar-title) {
  font-size: var(--_ar-title-size);
  line-height: inherit;
  color: var(--_ar-title-color);
  text-align: var(--ar-title-align);
  margin: 0;
}
.ar-slide :is(h1, h2, h3, h4, h5, h6):where(.ar-subtitle) {
  font-size: var(--_ar-subtitle-size);
  font-weight: 400;
  line-height: inherit;
  color: var(--_ar-subtitle-color);
  text-align: var(--ar-title-align);
  margin: var(--ar-subtitle-gap) 0 0;
}

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
