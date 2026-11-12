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
     A file that is not in the folder (or a URL that does not load) shows a dashed box with its
     name, in place of the picture, and a warning in the console during development. -->
<template lang="pug">
.ph-img(:class="{ 'ph-img-missing': missing }" :style="box" :title="missing ? name : undefined")
  img(
    v-if="!missing"
    :src="url"
    :alt="alt"
    :style="picture"
    draggable="false"
    decoding="async"
    @load="loaded"
    @error="failed = url"
  )
  span.ph-img-name(v-else) {{ stem }}#[wbr]{{ ext }}
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'
import { images, imagesDir } from 'virtual:phoenyx/images'
import { blurStyle, blurValue, isBlur, isOpacity, opacityValue, warnOnce } from './image'

const props = defineProps({
  file: String, // path inside the images folder
  src: String, // any URL, instead of file
  alt: { type: String, default: '' },
  fit: { type: String, validator: (v) => ['cover', 'contain'].includes(v) },
  position: String,
  opacity: { type: [Number, String], validator: isOpacity },
  blur: { type: [Number, String], validator: isBlur },
  rounded: { type: [Boolean, String, Number], default: false },
})

const path = computed(() => props.file?.trim().replace(/^\.?\/+/, ''))
const url = computed(() => (path.value ? images[path.value] : props.src))
const failed = ref(null) // the URL that did not load, if it is still the current one
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
const ratio = ref(null)
function loaded(e) {
  const { naturalWidth: w, naturalHeight: h } = e.target
  ratio.value = w > 0 && h > 0 ? w / h : null
}

const radius = (r) => {
  if (r === true || r === '') return 'var(--ph-radius)'
  if (r === 'full') return '50%'
  if (typeof r === 'number' || /^\d*\.?\d+$/.test(r)) return `${Number(r)}px`
  return r || undefined // a CSS length: "1em", "12px"
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
