<!-- A picture. file="team.jpg" names a file in the project's images folder (src/images by default,
     set in the Vite plugin; subfolders allowed: "team/ana.jpg"); src="https://…" takes any URL instead.
       Img(file="team.jpg" fit="cover" position="center 30%" opacity="0.5" rounded alt="The team")
     Size: an Img has no size of its own. It takes the box its container gives it (the rest of the
     slide under the title, a column of Cols, a cell of Grid, a zone, Center) and fits the picture in:
       fit="contain"   the whole picture, centred, with empty bands if the shapes differ (default)
       fit="cover"     fills the box and crops what does not fit (default in #image and backgrounds)
     In a plain block (no flex or grid around it) it is as wide as the block and as tall as the
     picture's shape makes it. For a box of your own, size it with a class: width and height, or
     one of them and the other auto to follow the picture's shape (.icon { height: 1em; width: auto }).
     A file and its src take the first that is given: file, then src.
     position: what stays in view when cropped, as CSS object-position ("center 30%", "left top")
     opacity: 0..1 · blur: px · rounded: the theme's radius; rounded="full" a circle; rounded="24" px
     alt: describe the picture when it says something; without alt it is decorative (alt="")
     src="/logo.svg" (root-relative: a file in public/) is served under Vite's base ("/talk/logo.svg").
     A file that is not in the folder (or a URL that does not load) shows a dashed box with its
     name, and its alt above it when there is one, in place of the picture, and a warning in the
     console during development.
     Names are case-sensitive, as on most servers: file="Team.jpg" is not team.jpg.
     Loading: every picture of the folder has its URL at hand from the start, so a slide never
     shows an empty box first; and every slide is in the page, so the browser fetches all the
     deck's pictures when it opens. Size them for the screen you present on: text and SVG stay sharp
     at any scale, but a photo is upscaled with the canvas, so on a 4K screen a full-slide picture
     wants ~3840 px wide (twice the size it shows at in canvas px); use WebP/AVIF/JPEG for photos.
     Until its picture has loaded (or failed) it carries data-ar-busy, set to its URL: the export
     waits for it, and for a URL that never answers only once (exporter.ts). -->
<template>
  <div
    class="ar-img"
    :class="{ 'ar-img-missing': missing }"
    :style="box"
    :title="missing ? (alt ? `${alt} — ${name}` : name) : undefined"
    :role="missing && alt ? 'img' : undefined"
    :aria-label="missing && alt ? alt : undefined"
    :data-ar-busy="missing || shown === url ? undefined : url"
  >
    <img
      v-if="!missing"
      :src="url"
      :alt="alt"
      :style="picture"
      draggable="false"
      decoding="async"
      @load="loaded"
      @error="failed = url ?? null"
    />
    <span class="ar-img-name" v-else>
      <span class="ar-img-alt" v-if="alt">{{ alt }}</span>
      <span class="ar-img-file">{{ stem }}<wbr />{{ ext }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect, type PropType } from 'vue'
import { blurStyle, blurValue, fileUrl, imagesDir, isBlur, isOpacity, opacityValue, warnOnce, withBase } from '../core/image'

const props = defineProps({
  file: String, // path inside the images folder
  src: String, // any URL, instead of file
  alt: { type: String, default: '' },
  fit: { type: String as PropType<'cover' | 'contain'>, validator: (v: string) => ['cover', 'contain'].includes(v) },
  position: String,
  opacity: { type: [Number, String], validator: isOpacity },
  blur: { type: [Number, String], validator: isBlur },
  rounded: { type: [Boolean, String, Number], default: false },
})

const path = computed(() => props.file?.trim().replace(/^\.?\/+/, ''))
const url = computed(() => (path.value ? fileUrl(path.value) : withBase(props.src?.trim())))
const failed = ref<string | null>(null) // the URL that did not load, if it is still the current one
const missing = computed(() => !url.value || failed.value === url.value)

// the label of the placeholder: the file as written, or the last part of the URL
const name = computed(() => path.value || props.src?.split(/[?#]/)[0].split('/').filter(Boolean).pop() || '')
// break long names before the extension rather than mid-word
const dot = computed(() => name.value.lastIndexOf('.'))
const stem = computed(() => (dot.value > 0 ? name.value.slice(0, dot.value) : name.value))
const ext = computed(() => (dot.value > 0 ? name.value.slice(dot.value) : ''))

watchEffect(() => {
  if (path.value && !url.value) warnOnce(`files not found in ${imagesDir}`, path.value)
  else if (path.value == null && !props.src) warnOnce('no file or src given', '(empty)')
  else if (missing.value) warnOnce('pictures that did not load', name.value)
})

// the picture's own shape, once known: what sizes it where nothing else does (a plain block)
const ratio = ref<number | null>(null)
const shown = ref<string | null>(null) // the URL that has loaded
function loaded(e: Event) {
  shown.value = url.value ?? null
  const { naturalWidth: w, naturalHeight: h } = e.target as HTMLImageElement
  ratio.value = w > 0 && h > 0 ? w / h : null
}

const radius = (r: boolean | string | number) => {
  if (r === true || r === '') return 'var(--ar-radius)'
  if (r === 'full') return '50%'
  if (typeof r === 'number' || (typeof r === 'string' && /^\d*\.?\d+$/.test(r))) return `${Number(r)}px`
  return typeof r === 'string' ? r || undefined : undefined // a CSS length: "1em", "12px"
}
const box = computed(() => ({
  borderRadius: radius(props.rounded),
  aspectRatio: !missing.value && ratio.value ? ratio.value : undefined,
}))
const picture = computed(() => ({
  objectFit: props.fit,
  objectPosition: props.position,
  opacity: opacityValue(props.opacity),
  ...blurStyle(blurValue(props.blur), true),
}))
</script>

<style>
/* no size of its own: it fills the box its container gives it and fits the picture inside.
   Zero specificity: a class on it wins (set width and height both, or one plus width/height: auto
   to follow the picture's shape). Where its container has no height to give (a plain block), the
   picture's shape, learnt on load, sets it (aspect-ratio). */
:where(.ar-img) {
  position: relative; box-sizing: border-box; overflow: hidden;
  flex: 1 1 0; width: 100%; height: 100%; min-width: 0; min-height: 0;
}
.ar-img > img {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  display: block; object-fit: contain;
}
/* in a slide's image zone and in its background it covers its box, edge to edge (fit="contain"
   still wins) */
.ar-zone-image > .ar-img > img, .ar-slide-bg > .ar-img > img { object-fit: cover; }
/* missing file: a dashed box (colour from --ar-placeholder, default the text colour) with its name */
.ar-img-missing {
  display: flex; align-items: center; justify-content: center;
  border: 3px dashed color-mix(in srgb, var(--ar-placeholder) 40%, transparent);
  border-radius: var(--ar-radius);
  background: color-mix(in srgb, var(--ar-placeholder) 5%, transparent);
}
.ar-img-name {
  padding: 8px 12px;
  font: calc(var(--ar-text-base) * .5) / 1.2 var(--ar-font-mono);
  color: color-mix(in srgb, var(--ar-placeholder) 85%, transparent);
  text-align: center; text-transform: none; font-weight: normal;
  overflow-wrap: anywhere;
}
/* the alt, when there is one, is what the picture was meant to say: first and stronger; the file
   name under it is the secondary line */
.ar-img-alt { display: block; margin-bottom: 4px; font-family: var(--ar-font-sans); }
.ar-img-file { opacity: .75; }
/* a missing background: framed inside the slide, its name in the top-right corner (the bottom
   corners belong to the addons) */
.ar-slide-bg > .ar-img-missing { inset: 24px; width: auto; height: auto; align-items: flex-start; justify-content: flex-end; }
</style>
