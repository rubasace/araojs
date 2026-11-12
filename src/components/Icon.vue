<!-- An icon of an Iconify set, drawn inline as SVG: name="prefix:name".
       Icon(name="lucide:rocket")                       as tall as the text around it (1em)
       Icon(name="simple-icons:vuedotjs" size="96")     96 px tall
       Icon(name="lucide:triangle-alert" label="Warning") says something: role="img" + aria-label
       Icon(:name="item.icon")                          any expression, as long as the name is
                                                        spelled out somewhere in the source
     Sets: lucide (UI icons) and simple-icons (tech logos) come with the library; any other set
     once the project installs @iconify-json/<prefix>. The Vite plugin reads the project's source
     for the names it uses and builds only those in: no network when presenting, vectors in the PDF
     (vite/icons.js). A name built at runtime goes in arao({ icons: ['lucide:x'] }).
     Colour: currentColor, so the text colour (style it like text: color: var(--ar-accent)).
     Size: 1em tall by default, so it follows the font size (a class with font-size resizes it);
     size="64" is px. Width follows the icon's shape (square for lucide and simple-icons). The
     size is given as width and height attributes, so a CSS rule with width/height wins over it.
     Decorative by default (aria-hidden); label="…" makes it an image with that name.
     A name that is not in the module (no such set installed, a typo, a name built at runtime)
     shows an empty dashed box of the same size, and a warning once in development. -->
<template>
  <svg
    class="ar-icon"
    v-if="icon"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${icon.width} ${icon.height}`"
    :width="box.width"
    :height="box.height"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    v-html="body"
  ></svg>
  <span
    class="ar-icon ar-icon-missing"
    v-else
    :style="box"
    :title="key"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  ></span>
</template>

<script setup>
import { computed, watchEffect } from 'vue'
import { iconData, uniqueIds, warnMissing } from '../core/icons'

const props = defineProps({
  name: { type: String, required: true }, // prefix:name
  size: { type: [Number, String], validator: (v) => /^\d*\.?\d+(px)?$/.test(String(v).trim()) }, // px, the height
  label: String,
})

const key = computed(() => (props.name ?? '').trim())
const icon = computed(() => iconData(key.value))
watchEffect(() => {
  if (!icon.value) warnMissing(key.value)
})

// height: size px, else 1em; width from the icon's shape
const box = computed(() => {
  const ratio = icon.value ? Math.round((icon.value.width / icon.value.height) * 1e4) / 1e4 : 1
  const size = props.size != null && props.size !== '' ? parseFloat(props.size) : null
  return size ? { width: `${size * ratio}px`, height: `${size}px` } : { width: `${ratio}em`, height: '1em' }
})

// the same icon twice in the page must not share ids (gradients, masks): each drawing gets its own
const body = computed(() => uniqueIds(icon.value?.body ?? ''))
</script>

<style>
/* inline SVG sized by its width/height attributes (1em tall unless size says otherwise), sitting
   on the text's baseline like a glyph; never squeezed in a flex row */
.ar-icon { display: inline-block; flex: none; vertical-align: -.125em; }
/* missing icon: an empty dashed box of the same size, so nothing around it moves */
.ar-icon-missing {
  box-sizing: border-box;
  border: max(1px, .06em) dashed color-mix(in srgb, var(--ar-placeholder, currentColor) 45%, transparent);
  border-radius: .15em;
}
</style>
