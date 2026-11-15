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
     v-step works in it, as anywhere in the slide. Several Backgrounds stack in the order they are
     drawn. A slide with one shows it instead of the theme's default background (--ar-slide-bg-*,
     Slide.vue); a plain colour or a gradient needs no Background, it is CSS on the Slide
     (Slide(style="background: #1d2b4a")). Headings in it are not the slide's title.
     A class or a style on it goes on what it draws (Background.dim(src="city.jpg")).
     It is drawn in the slide's background layer (Teleport: useSlideLayer, state/slide.ts), so
     where it sits in the slide changes nothing; outside a slide it warns and draws nothing. -->
<template>
  <Teleport v-if="layer" :to="layer">
    <div class="ar-background" :style="style" v-bind="$attrs">
      <Img v-if="picture" v-bind="picture" />
      <slot v-else />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useSlideLayer } from '../state/slide'
import { blurStyle, blurValue, isBlur, isOpacity, isUrl, opacityValue } from '../core/image'
import Img from './Img.vue'

// its class and style go on the layer it draws (its root is the Teleport, which takes none)
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

// a picture: an Img of the file or the URL; a blank src is none (the content, if any, instead)
const picture = computed(() => {
  const v = props.src?.trim()
  return v ? (isUrl(v) ? { src: v } : { file: v }) : null
})
// opacity and blur on the whole layer (a blurred one grows past the slide's edges, which clip
// it: blurStyle); fit and position reach its pictures and videos through private properties (below)
const style = computed(() => ({
  opacity: opacityValue(props.opacity),
  ...blurStyle(blurValue(props.blur)),
  '--_ar-bg-fit': props.fit,
  '--_ar-bg-position': props.position,
}))
</script>

<style>
/* every element of it covers the slide, stacked in order (it sits in the slide's background
   layer, .ar-slide-bg, whose children all cover it: Slide.vue) */
.ar-background > * { position: absolute; inset: 0; width: 100%; height: 100%; }
/* its pictures and videos cover it unless fit says contain; position is what stays in view
   (Img's own fit or position, given to it directly, still wins) */
.ar-background > :is(img, video),
.ar-background .ar-img > img {
  object-fit: var(--_ar-bg-fit, cover);
  object-position: var(--_ar-bg-position, center);
}
/* a missing picture: framed inside the slide, its name in the top-right corner (the bottom
   corners belong to the addons) */
.ar-background > .ar-img-missing { inset: 24px; width: auto; height: auto; align-items: flex-start; justify-content: flex-end; }
</style>
