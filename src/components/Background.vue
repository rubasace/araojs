<!-- A slide's background: anywhere inside a Slide, it is drawn behind all of the slide's content,
     edge to edge, and never catches the pointer.
       Slide
         Background(src="city.jpg" opacity="0.25" position="center 30%" blur="4")
         h2 Built for the city
     src: a picture, as Img's: a URL when it starts with a scheme or a slash (https://…, data:…,
          /from-public.jpg, served under Vite's base), else a file of the images folder, by its
          name there (city.jpg, team/ana.png, "photo (1).jpg"; one not there shows as missing,
          and warns)
     opacity: 0..1 · blur: px · position: what stays in view when cropped, as CSS object-position
     fit: cover (default) or contain
     Without src, its content is the background: a video, an svg, a div with a gradient, several
     of them. Each element of it covers the whole slide, stacked in order (an Img, then a tint
     above it); fit and position apply to its pictures and videos, opacity and blur to all of it.
       Background
         video(src="/loop.mp4" autoplay muted loop)
         .tint
     Steps: v-step on it (Background(v-step="2")), on an element around it, or inside it, as
     anywhere in the slide. Several Backgrounds stack in the order they are written. A slide with one
     shows it instead of the theme's default background (--ar-slide-bg-*, Slide.vue); a plain
     colour or a gradient needs no Background, it is CSS on the Slide
     (Slide(style="background: #1d2b4a")). Headings in it are not the slide's title.
     A class or a style on it goes on what it draws (Background.dim(src="city.jpg")), styled by
     the deck's scoped styles too.
     How: it renders an empty, hidden element where it is written (its root: what v-step and
     v-step-from apply to), and teleports what it draws into the slide's background layer
     (useSlideLayer, state/slide.ts), where that layer follows the step state of the element and of
     the elements around it (a MutationObserver on their classes) and stacks in the order of those
     elements in the slide (z-index: the layers mount in no set order). Outside a slide it warns
     and draws nothing.
     Printing: with src, blur is the picture's (Img's), which the export draws as on screen
     (core/exporter.ts); blur on content is a filter on the whole layer, printed as Chromium
     prints it (a darker edge). -->
<template>
  <span class="ar-background-anchor" ref="anchor" hidden>
    <Teleport v-if="layer" :to="layer">
      <div class="ar-background" :class="{ 'ar-step-hidden': stepped }" :style="style" v-bind="{ ...$attrs, ...scope }">
        <Img v-if="picture" v-bind="picture" />
        <slot v-else />
      </div>
    </Teleport>
  </span>
</template>

<script lang="ts">
import { ref } from 'vue'
// bumped whenever a Background mounts or unmounts, so that each finds its place again
const drawn = ref(0)
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, onUnmounted, type PropType } from 'vue'
import { useSlideLayer } from '../state/slide'
import { blurStyle, blurValue, isBlur, isOpacity, isUrl, opacityValue } from '../core/image'
import Img from './Img.vue'

// its class and style go on the layer it draws, not on its hidden root
defineOptions({ name: 'Background', inheritAttrs: false })

const props = defineProps({
  src: String, // a file of the images folder, or a URL
  opacity: { type: [Number, String], validator: isOpacity },
  position: String,
  blur: { type: [Number, String], validator: isBlur },
  fit: { type: String as PropType<'cover' | 'contain'>, validator: (v: string) => ['cover', 'contain'].includes(v) },
})

const slideLayer = useSlideLayer()
if (!slideLayer) console.warn('[arao] Background used outside a <Slide>: it shows nowhere')
const layer = computed(() => slideLayer?.value ?? null)

// the scoped styles of the template it is written in (a deck's <style scoped>) reach the layer
// it draws, as they would its root: the layer is teleported, so it carries their attribute itself
const scopeId = getCurrentInstance()?.vnode.scopeId
const scope = scopeId ? { [scopeId]: '' } : {}

// a picture: an Img of the file or the URL, which takes fit, position and blur itself (a blurred
// img is what the export knows how to print); a blank src is none (the content, if any, instead)
const picture = computed(() => {
  const v = props.src?.trim()
  if (!v) return null
  return { ...(isUrl(v) ? { src: v } : { file: v }), fit: props.fit || 'cover', position: props.position, blur: props.blur }
})
// its place among the slide's Backgrounds, in the order they are written: its stacking order
const anchor = ref<HTMLElement | null>(null)
const order = computed(() => {
  void drawn.value
  const el = anchor.value
  const host = el?.closest('[data-ar-slide]')
  return el && host ? [...host.querySelectorAll('.ar-background-anchor')].indexOf(el) : 0
})
// opacity on the whole layer; without a picture, blur too (a blurred layer grows past the slide's
// edges, which clip it: blurStyle), and fit and position reach its pictures and videos through
// private properties (below)
const style = computed(() => ({
  zIndex: order.value,
  opacity: opacityValue(props.opacity),
  ...(picture.value ? {} : {
    ...blurStyle(blurValue(props.blur)),
    '--_ar-bg-fit': props.fit,
    '--_ar-bg-position': props.position,
  }),
}))

// Steps: whether the hidden root, or an element around it in the slide, is hidden by v-step right
// now (directives/step.ts marks them with these classes); the layer follows, fading as any step
const stepped = ref(false)
const STEPPED = '.ar-step-hidden, .ar-step-collapsed'
let observer: MutationObserver | undefined
onMounted(() => {
  const el = anchor.value
  const host = el?.closest<HTMLElement>('[data-ar-slide]')
  if (!el || !host) return
  const check = () => {
    const hit = el.closest(STEPPED)
    stepped.value = !!hit && host.contains(hit)
  }
  observer = new MutationObserver(check)
  for (let e: HTMLElement | null = el; e && e !== host; e = e.parentElement) observer.observe(e, { attributes: true, attributeFilter: ['class'] })
  check()
  drawn.value++
})
onBeforeUnmount(() => observer?.disconnect())
onUnmounted(() => drawn.value++)
</script>

<style>
/* every element of it covers the slide, stacked in order (it sits in the slide's background
   layer, .ar-slide-bg, whose children all cover it: Slide.vue) */
.ar-background > * { position: absolute; inset: 0; width: 100%; height: 100%; }
/* the pictures and videos of its content cover it unless fit says contain; position is what
   stays in view (an Img's own fit or position, given to it directly, still wins) */
.ar-background > :is(img, video),
.ar-background .ar-img > img {
  object-fit: var(--_ar-bg-fit, cover);
  object-position: var(--_ar-bg-position, center);
}
/* a missing picture: framed inside the slide, its name in the top-right corner (the bottom
   corners belong to the addons) */
.ar-background > .ar-img-missing { inset: 24px; width: auto; height: auto; align-items: flex-start; justify-content: flex-end; }
</style>
