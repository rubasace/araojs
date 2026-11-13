<!-- Internal. One deck's cover in the list of decks (views/DeckSelectorView.vue): the deck itself,
     drawn as a thumbnail (state/deck.ts provideThumbnail, components/internal/Thumbnail.vue), filling the
     positioned box it is placed in. It mounts once its box comes near the viewport
     (IntersectionObserver, 400 px ahead) and stays mounted; until then, and while the deck's code
     loads, it is empty (the box shows through). A deck that fails to load or to draw says so
     instead ("No preview", in the reader's language), with one warning: the rest of the list goes on.
       load    the deck's loader (virtual:arao/decks)
       name    the deck's name, for the warning
       @title  the cover's title once it is drawn (its first heading, else its title prop), or '' -->
<template>
  <div class="ar-cover" ref="root">
    <p class="ar-cover-failed" v-if="failed">{{ t('noPreview') }}</p>
    <DeckFile v-else-if="near" />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onErrorCaptured, onMounted, ref, watch, type AsyncComponentLoader, type PropType } from 'vue'
import { provideThumbnail } from '../../state/deck'
import { t } from '../../i18n/i18n'

const props = defineProps({
  load: { type: Function as PropType<AsyncComponentLoader>, required: true },
  name: { type: String, required: true },
})
const emit = defineEmits(['title'])

// the deck's .vue file, loaded when first drawn
const DeckFile = defineAsyncComponent(props.load)
const title = ref('')
provideThumbnail({ title })
watch(title, (t) => emit('title', t))

const failed = ref(false)
onErrorCaptured((e) => {
  if (!failed.value) console.warn(`[arao] the list of decks cannot draw the cover of "${props.name}": ${(e as Error)?.message ?? e}`)
  failed.value = true
  return false
})

// near the viewport: mounted once, for good
const root = ref<HTMLElement>()
const near = ref(false)
let io: IntersectionObserver | null = null
onMounted(() => {
  if (typeof IntersectionObserver !== 'function') return void (near.value = true)
  io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return
    near.value = true
    io?.disconnect()
  }, { rootMargin: '400px 0px' })
  if (root.value) io.observe(root.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<style>
.ar-cover { position: absolute; inset: 0; }
.ar-cover-failed { margin: 0; height: 100%; display: grid; place-items: center; font-size: calc(var(--ar-ui-text) * .875); opacity: .6; }
</style>
