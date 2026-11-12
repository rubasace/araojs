<template lang="pug">
.ph-viewport(ref="viewport" :data-theme="theme" :class="{ 'ph-nocursor': cursorHidden }")
  .ph-canvas(ref="canvas" :style="canvasStyle")
    slot
  Controls(
    ref="controls"
    :deck="api"
    :visible="hud"
    :theme="theme"
    :themes="themes"
    :fullscreen="fullscreen"
    :titles="titles"
    @theme="setTheme"
    @fullscreen="toggleFullscreen"
  )
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, provide, readonly, ref, shallowReactive, watch } from 'vue'
import { DECK } from './registry'
import Controls from './Controls.vue'

const props = defineProps({
  width: { type: Number, default: 1920 },
  height: { type: Number, default: 1080 },
  themes: { type: Array, default: () => ['default'] },
  // hide the mouse cursor after this many ms without moving it (0 = never)
  hideCursorAfter: { type: Number, default: 5000 },
})

// ---- slides ------------------------------------------------------------
const list = shallowReactive([])
const index = ref(0)
const step = ref(1)
const current = computed(() => list[index.value])

// public, read-only view for addons (useDeck)
const api = {
  index: readonly(index),
  step: readonly(step),
  total: computed(() => list.length),
  steps: computed(() => current.value?.steps.value ?? 1),
  // progress over every step of the deck, 0..1
  progress: computed(() => {
    const all = list.reduce((n, s) => n + s.steps.value, 0)
    const done = list.slice(0, index.value).reduce((n, s) => n + s.steps.value, 0) + step.value
    return all > 1 ? (done - 1) / (all - 1) : 1
  }),
  next, prev, go,
}

provide(DECK, {
  index,
  step,
  api,
  // slide = { id, steps, title, el }; el is a ref to its <section>
  register(slide) {
    change()
    list.push(slide)
    return computed(() => list.findIndex((s) => s.id === slide.id))
  },
  unregister(id) {
    const i = list.findIndex((s) => s.id === id)
    if (i < 0) return
    const tick = change()
    // the slide on screen is going away: who takes its place is decided once the tick settles
    if (i === index.value && !tick.vacancy) tick.vacancy = { slide: list[i], step: step.value }
    list.splice(i, 1)
    if (i < index.value) index.value--
    if (index.value >= list.length) index.value = Math.max(0, list.length - 1)
  },
})

// Slide order is document order, not mount order: a slide mounted later (v-if, inserted by
// HMR) or moved (keyed v-for, in the deck or in any component inside it) takes its place in
// the template. Mounts, unmounts and moves of one tick are settled together once the DOM is
// final; nothing else (a step, a re-render of the deck) reorders.
let pending = null // { before: list at the start of the tick, vacancy: { slide, step } | null }
function change() {
  if (!pending) {
    pending = { before: list.slice(), vacancy: null }
    nextTick(settle)
  }
  return pending
}
function settle() {
  const { before, vacancy } = pending
  pending = null
  const placed = list.filter((s) => s.el.value?.isConnected)
  placed.sort((a, b) => (a.el.value.compareDocumentPosition(b.el.value) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
  const sorted = [...placed, ...list.filter((s) => !placed.includes(s))]
  if (vacancy) {
    list.splice(0, list.length, ...sorted)
    return fill(vacancy, before)
  }
  // the slide on screen stays on screen
  if (sorted.every((s, i) => s === list[i])) return
  const shown = list[index.value]
  list.splice(0, list.length, ...sorted)
  if (shown) index.value = list.indexOf(shown)
}

// The slide on screen went away this tick. A slide mounted in its place in the same tick
// (re-keyed, v-if/v-else swapped, reloaded by HMR, every slide remounted) takes over at the
// same step, clamped to its own total. Otherwise the next slide takes its place from step 1;
// with no next slide, the previous one is shown complete, as if the audience stepped back.
function fill({ slide, step: at }, before) {
  const i = before.indexOf(slide)
  if (i < 0) return go(index.value, 1) // mounted and gone within the same tick
  const was = new Set(before)
  const is = new Set(list)
  // nearest slide before it that survived, and how many removed slides sat in between
  let p = i - 1
  while (p >= 0 && !is.has(before[p])) p--
  const skipped = i - p - 1
  // slides mounted this tick right after that survivor: the same gap, in the new order
  const from = p >= 0 ? list.indexOf(before[p]) + 1 : 0
  let to = from
  while (to < list.length && !was.has(list[to])) to++
  if (to > from) go(from + Math.min(skipped, to - from - 1), at)
  else if (from < list.length) go(from, 1)
  else if (list.length) go(list.length - 1, list[list.length - 1].steps.value)
  else step.value = 1
}

// Moves that mount nothing (keyed v-for reordered) only show up in the DOM: watch the canvas
// for slide sections being inserted. Changes inside a slide are skipped at once.
const SLIDE_EL = '[data-ph-slide]'
const insertsSlide = (r) => !r.target.closest?.(SLIDE_EL) &&
  [...r.addedNodes].some((n) => n.nodeType === 1 && (n.matches(SLIDE_EL) || n.querySelector(SLIDE_EL)))
const canvas = ref()
let mo

function go(i, s = 1) {
  if (i < 0 || i >= list.length) return
  index.value = i
  step.value = Math.min(Math.max(1, s), list[i].steps.value)
}
function next() {
  if (step.value < current.value.steps.value) step.value++
  else go(index.value + 1, 1)
}
function prev() {
  if (step.value > 1) step.value--
  else if (index.value > 0) go(index.value - 1, list[index.value - 1].steps.value)
}

// ---- URL: #/slide/step (1-based) -----------------------------------------
function readHash() {
  const [, i, s] = location.hash.match(/^#\/(\d+)(?:\/(\d+))?/) || []
  if (i) go(Number(i) - 1, Number(s || 1))
}
watch([index, step], () => history.replaceState(null, '', `#/${index.value + 1}/${step.value}`))

// ---- theme: ?theme=name, or cycle with "t" -------------------------------
const theme = ref(new URLSearchParams(location.search).get('theme') || props.themes[0])
api.theme = readonly(theme) // addons/components can follow theme changes
function setTheme(name) {
  theme.value = name
  const url = new URL(location.href)
  url.searchParams.set('theme', theme.value)
  history.replaceState(null, '', url)
}
function cycleTheme() {
  const i = props.themes.indexOf(theme.value)
  setTheme(props.themes[(i + 1) % props.themes.length])
}

// ---- fixed canvas, scaled to fit (letterboxed) ----------------------------
const viewport = ref()
const scale = ref(1)
const canvasStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `translate(-50%, -50%) scale(${scale.value})`,
}))
let ro
function fit() {
  const { clientWidth: w, clientHeight: h } = viewport.value
  scale.value = Math.min(w / props.width, h / props.height)
}

// ---- keyboard + HUD -------------------------------------------------------
// ---- controls ------------------------------------------------------------
const controls = ref()
const fullscreen = ref(false)
function toggleFullscreen() {
  document.fullscreenElement ? document.exitFullscreen() : viewport.value.requestFullscreen()
}
const onFullscreen = () => (fullscreen.value = !!document.fullscreenElement)
// slide titles for the jump menu: Slide(title="…"), else its first heading outside the background
const HEADING = ':is(h1, h2, h3):not(.ph-slide-bg *)'
const titles = computed(() => {
  hud.value // re-read headings whenever the controls show up
  return list.map((s) =>
    s.title.value ||
    viewport.value?.querySelector(`[data-ph-slide="${s.id}"]`)?.querySelector(HEADING)?.textContent.trim() ||
    '')
})

const hud = ref(false)
let hudTimer
const cursorHidden = ref(false)
let cursorTimer
function poke() {
  hud.value = true
  clearTimeout(hudTimer)
  hudTimer = setTimeout(() => (hud.value = false), 2500)
}
function onMouseMove() {
  poke()
  cursorHidden.value = false
  clearTimeout(cursorTimer)
  if (props.hideCursorAfter > 0) cursorTimer = setTimeout(() => (cursorHidden.value = true), props.hideCursorAfter)
}
function onKey(e) {
  if (e.target.closest?.('input, textarea, [contenteditable]')) return
  const k = e.key
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) next()
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) prev()
  else if (k === 'Home') go(0)
  else if (k === 'End') go(list.length - 1, list[list.length - 1].steps.value)
  else if (k === 'f') toggleFullscreen()
  else if (k === 't') cycleTheme()
  else if (k === 'g') controls.value.toggleMenu()
  else if (/^[0-9]$/.test(k)) controls.value.openMenu(k) // type a slide number to jump
  else if (k === 'Escape') controls.value.closeMenu()
  else return
  e.preventDefault()
  // the controls only show up on mouse movement, never on keyboard navigation
}

onMounted(() => {
  ro = new ResizeObserver(fit)
  ro.observe(viewport.value)
  fit()
  readHash()
  mo = new MutationObserver((records) => records.some(insertsSlide) && change())
  mo.observe(canvas.value, { childList: true, subtree: true })
  window.addEventListener('keydown', onKey)
  window.addEventListener('hashchange', readHash)
  window.addEventListener('mousemove', onMouseMove)
  document.addEventListener('fullscreenchange', onFullscreen)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  mo?.disconnect()
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('hashchange', readHash)
  window.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('fullscreenchange', onFullscreen)
})
</script>
