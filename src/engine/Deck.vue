<!-- The deck: its slides on a fixed canvas, the controls, the keyboard, the URL.
     Two ways to show it, from the same URL:
       audience view    the slides, full window (the default)
       presenter view   ?presenter, or "p" / the controls' button (opens it in a new window):
                        the current slide, a preview of the next step, the speaker notes (Notes),
                        a wall clock and the talk's timer (Presenter.vue)
     Every window of the same deck in the same browser stays in step (sync.js): moving in any of
     them moves the others, and so does a theme change; the last move wins. A window that opens
     takes the position of the ones already open (and their theme, unless its URL names one).
     duration="45m" (also "1h30m", "90" minutes) is the talk's length: the presenter view counts
     down to it. The timer starts with the first move of the deck, in any window. -->
<template lang="pug">
.ph-viewport(v-if="!presenter" ref="viewport" :data-theme="theme" :class="{ 'ph-nocursor': cursorHidden }")
  Stage(:stage="main" :width="width" :height="height")
    slot
  Controls(
    ref="controls"
    :deck="main.api"
    :visible="hud"
    :theme="theme"
    :themes="themes"
    :fullscreen="fullscreen"
    :titles="titles"
    @theme="setTheme"
    @fullscreen="toggleFullscreen"
    @presenter="openPresenter"
  )
Presenter(
  v-else
  :deck="main.api"
  :title="titles[main.index.value] || ''"
  :next="next"
  :notes="notes"
  :timer="timer"
  :duration="durationMs"
  :ratio="`${width} / ${height}`"
  @timer="setTimer"
)
  template(#current)
    Stage(:stage="main" :width="width" :height="height" :theme="theme")
      slot
  template(#next)
    Stage(:stage="preview" :width="width" :height="height" :theme="theme")
      slot
  template(#controls)
    Controls(
      ref="controls"
      docked
      :deck="main.api"
      :theme="theme"
      :themes="themes"
      :fullscreen="fullscreen"
      :titles="titles"
      @theme="setTheme"
      @fullscreen="toggleFullscreen"
    )
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, readonly, ref, shallowRef, watch } from 'vue'
import { ahead, createStage } from './stage'
import { createSync, deckKey } from './sync'
import { IDLE, parseDuration, start } from './timer'
import Controls from './Controls.vue'
import Presenter from './Presenter.vue'
import Stage from './Stage.vue'

const props = defineProps({
  width: { type: Number, default: 1920 },
  height: { type: Number, default: 1080 },
  themes: { type: Array, default: () => ['default'] },
  // hide the mouse cursor after this many ms without moving it (0 = never)
  hideCursorAfter: { type: Number, default: 5000 },
  // the talk's length, for the presenter view's countdown: "45m", "1h30m", "90" (minutes)
  duration: { type: [String, Number], validator: (v) => parseDuration(v) != null },
})

const query = new URLSearchParams(location.search)
const presenter = query.has('presenter')

// ---- slides ------------------------------------------------------------
// The audience's stage; the presenter view adds a second rendering of the deck that stands one
// step ahead of it, for the "next" preview.
const main = createStage({ onMove: moved })
const next = computed(() => ahead(main))
const preview = presenter ? createStage({ follow: () => next.value }) : null

// ---- URL: #/slide/step (1-based) -----------------------------------------
function readHash() {
  const [, i, s] = location.hash.match(/^#\/(\d+)(?:\/(\d+))?/) || []
  if (i) main.go(Number(i) - 1, Number(s || 1))
}

// ---- theme: ?theme=name, or cycle with "t" -------------------------------
const theme = ref(query.get('theme') || props.themes[0])
// addons/components can follow theme changes
main.api.theme = readonly(theme)
if (preview) preview.api.theme = main.api.theme
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

// ---- timer (shown by the presenter view, kept by every window) -------------
const timer = shallowRef(IDLE)
const setTimer = (t) => (timer.value = t)
const durationMs = computed(() => parseDuration(props.duration))

// ---- windows in step -------------------------------------------------------
// Started once the URL has placed the deck: that position is this window's own, not a move.
let sync = null
function startSync() {
  sync = createSync(deckKey(location))
  sync.register('pos', {
    get: () => ({ index: main.index.value, step: main.step.value }),
    set: (v) => main.place(v.index, v.step),
  })
  // a window whose URL names a theme keeps it when it opens; later changes still reach it
  sync.register('theme', { get: () => theme.value, set: setTheme, adopt: !query.has('theme') })
  sync.register('timer', { get: () => timer.value, set: setTimer })
  sync.hello()
}
// A move made here (keys, controls, an addon, the URL; not a position received, nor the deck
// renumbering its slides after an edit): the others follow, and the first one starts the timer.
// Each window renumbers on its own, so an edit (HMR) never sends anyone to another slide.
function moved() {
  if (!sync) return // the URL placing the deck as it opens
  sync.publish('pos', true)
  if (timer.value.state === 'idle') timer.value = start(timer.value, Date.now())
}
watch([main.index, main.step], () => history.replaceState(null, '', `#/${main.index.value + 1}/${main.step.value}`))
watch(theme, () => sync?.publish('theme'))
watch(timer, () => sync?.publish('timer'))

// ---- presenter view ---------------------------------------------------------
// notes of the slide on screen
const notes = computed(() => main.current.value?.notes ?? [])
let presenterWindow = null
function openPresenter() {
  if (presenterWindow && !presenterWindow.closed) return presenterWindow.focus()
  const params = new URLSearchParams(location.search)
  params.delete('presenter')
  const q = params.toString()
  const url = `${location.pathname}?${q ? q + '&' : ''}presenter${location.hash}`
  // a window of its own (not a tab), to drag to the speaker's screen
  presenterWindow = window.open(url, `phoenyx-presenter ${deckKey(location)}`, 'popup,width=1280,height=800')
}

// ---- controls ------------------------------------------------------------
const viewport = ref()
const controls = ref()
const fullscreen = ref(false)
function toggleFullscreen() {
  document.fullscreenElement ? document.exitFullscreen() : (viewport.value ?? document.documentElement).requestFullscreen()
}
const onFullscreen = () => (fullscreen.value = !!document.fullscreenElement)
// slide titles for the jump menu: Slide(title="…"), else its first heading outside the background
const HEADING = ':is(h1, h2, h3):not(.ph-slide-bg *)'
const titles = computed(() => {
  // re-read headings whenever the controls show up (the presenter view shows the title: on every move)
  presenter ? main.index.value : hud.value
  return main.list.map((s) => s.title.value || s.el.value?.querySelector(HEADING)?.textContent.trim() || '')
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
  // a button with the focus (the presenter view's) keeps Space and Enter for itself
  if ((e.key === ' ' || e.key === 'Enter') && e.target.closest?.('button')) return
  const k = e.key
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) main.next()
  else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) main.prev()
  else if (k === 'Home') main.go(0)
  else if (k === 'End') main.last()
  else if (k === 'f') toggleFullscreen()
  else if (k === 't') cycleTheme()
  else if (k === 'p' && !presenter) openPresenter()
  else if (k === 'g') controls.value.toggleMenu()
  else if (/^[0-9]$/.test(k)) controls.value.openMenu(k) // type a slide number to jump
  else if (k === 'Escape') controls.value.closeMenu()
  else return
  e.preventDefault()
  // the controls only show up on mouse movement, never on keyboard navigation
}

const PRESENTER_TITLE = 'Presentador · '
onMounted(() => {
  readHash()
  startSync()
  if (presenter && !document.title.startsWith(PRESENTER_TITLE)) document.title = PRESENTER_TITLE + document.title
  window.addEventListener('keydown', onKey)
  window.addEventListener('hashchange', readHash)
  if (!presenter) window.addEventListener('mousemove', onMouseMove)
  document.addEventListener('fullscreenchange', onFullscreen)
})
onBeforeUnmount(() => {
  sync?.close()
  clearTimeout(hudTimer)
  clearTimeout(cursorTimer)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('hashchange', readHash)
  window.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('fullscreenchange', onFullscreen)
})
</script>
