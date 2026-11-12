<!-- The deck: its slides on a fixed canvas, the controls, the keyboard, the URL.
     Two ways to show it, from the same URL:
       audience view    the slides, full window (the default)
       presenter view   ?presenter, or "p" / the controls' button (opens it in a new window):
                        the current slide, a preview of the next step, the speaker notes (Notes),
                        a wall clock and the talk's timer (Presenter.vue)
     "p" brings an open presenter window forward instead of reloading it; if the browser blocks the
     new window, a notice above the controls links to the presenter view to open it by hand.
     The presenter view mounts every slide twice (current + preview): see useDeck().role.
     touch (phones, tablets): tap the right quarter → next, the left quarter → previous, the middle
     → show/hide the controls; swipe left/right → next/previous. Links, buttons and inputs inside a
     slide keep their own taps (add data-ph-touch="ignore" to any other element that needs them).
     Every window of the same deck in the same browser stays in step (sync.js): moving in any of
     them moves the others, and so does a theme change; the last move wins. A window that opens
     takes the position of the ones already open (and their theme, unless its URL names one).
     duration="45m" is the talk's length (formats: timer.js parseDuration): the presenter view
     counts down to it. The timer starts with the first move of the deck, in any window, and
     survives reloading the windows (not closing them).
     Export: ?export prints the deck, one page per slide (&per-step: per step; &notes: a page of
     notes after each slide that has them): exporter.js, and npm run export for the PDF.
     Footer: the #footer slot is drawn at the bottom of every slide except covers and sections
     (each Slide draws it, so it fades, prints and shows in the presenter view with its slide);
     its slot props are { number, total }, the slide's number (1-based) and the slide count:
       template(#footer="{ number, total }")
         span ACME · Conf 2026
         span {{ number }} / {{ total }} -->
<template>
  <div
    class="ph-viewport"
    v-if="!presenter"
    ref="viewport"
    :data-theme="theme"
    :class="{ 'ph-nocursor': cursorHidden, 'ph-export': exporting, 'ph-export-done': exported }"
  >
    <Stage :stage="main" :width="width" :height="height">
      <slot />
    </Stage>
    <template v-if="exporting">
      <!-- the notes of the slide on screen, copied into the book after its page(s); never shown -->
      <div class="ph-export-notes" v-if="exporting.notes" ref="exportNotes">
        <div class="ph-note" v-for="n in shownNotes" :key="n.id" :data-step="n.step">
          <NoteBody :note="n" />
        </div>
      </div>
      <!-- filled by exporter.js, not by Vue -->
      <div class="ph-book" ref="book"></div>
    </template>
    <Controls
      v-else
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
    />
    <!-- the browser blocked the presenter window: the same URL as a link, which it does not block -->
    <Transition v-if="!exporting" name="ph-toast">
      <div class="ph-toast" v-if="blocked" role="status">
        <span>El navegador ha bloqueado la ventana del presentador.</span>
        <a :href="blocked" :target="presenterName" :title="blocked" @click="blocked = null">Abrirla aquí</a>
      </div>
    </Transition>
  </div>
  <Presenter
    v-else
    :deck="main.api"
    :title="titles[main.index.value] || ''"
    :next="next"
    :notes="notes"
    :timer="timer"
    :duration="durationMs"
    :ratio="`${width} / ${height}`"
    @timer="setTimer"
  >
    <template #current>
      <Stage :stage="main" :width="width" :height="height" :theme="theme">
        <slot />
      </Stage>
    </template>
    <!-- A second copy of every slide, one step ahead: each slide and addon mounts again here, so
         its side effects run twice in this window and its element ids repeat (useDeck().role is
         'preview' in this copy, 'presenter' in the one above). -->
    <template #next>
      <Stage :stage="preview" :width="width" :height="height" :theme="theme">
        <slot />
      </Stage>
    </template>
    <template #controls>
      <Controls
        ref="controls"
        docked
        :deck="main.api"
        :theme="theme"
        :themes="themes"
        :fullscreen="fullscreen"
        :titles="titles"
        @theme="setTheme"
        @fullscreen="toggleFullscreen"
      />
    </template>
  </Presenter>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, provide, readonly, ref, shallowRef, useSlots, watch } from 'vue'
import { ahead, createStage } from './stage'
import { createSync, deckKey } from './sync'
import { IDLE, parseDuration, start } from './timer'
import { buildBook, exportOptions, reportReady } from './exporter'
import { NoteBody } from './notes'
import { FOOTER } from './registry'
import Controls from './Controls.vue'
import Presenter from './Presenter.vue'
import Stage from './Stage.vue'

const props = defineProps({
  width: { type: Number, default: 1920 },
  height: { type: Number, default: 1080 },
  themes: { type: Array, default: () => ['default'] },
  // hide the mouse cursor after this many ms without moving it (0 = never)
  hideCursorAfter: { type: Number, default: 5000 },
  // the talk's length, for the presenter view's countdown: 90 or "90" (minutes), "45m", "1h30m",
  // "1h30", "90s", "45:00" (m:ss), "1:30:00" (h:mm:ss). Anything else warns and counts nothing.
  duration: [String, Number],
})

// the #footer slot, read when each slide renders (the slots object is updated in place)
const slots = useSlots()
provide(FOOTER, () => slots.footer)

const query = new URLSearchParams(location.search)
// ?export wins over ?presenter: the window prints the deck, nothing else
const exporting = exportOptions(query)
const presenter = !exporting && query.has('presenter')

// ---- slides ------------------------------------------------------------
// The audience's stage; the presenter view adds a second rendering of the deck that stands one
// step ahead of it, for the "next" preview.
const main = createStage({ onMove: moved, role: exporting ? 'export' : presenter ? 'presenter' : 'audience' })
const next = computed(() => ahead(main))
const preview = presenter ? createStage({ follow: () => next.value, role: 'preview' }) : null

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
watch(() => props.duration, (v) => {
  if (v != null && String(v).trim() && durationMs.value == null) {
    console.warn(`[phoenyx] Deck duration="${v}" is not a length (90, "45m", "1h30", "45:00"…): the presenter view shows no countdown`)
  }
}, { immediate: true })

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
  // kept through a reload of every window (sessionStorage), not past closing them
  sync.register('timer', { get: () => timer.value, set: setTimer, keep: true })
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
if (!exporting) watch([main.index, main.step], () => history.replaceState(null, '', `#/${main.index.value + 1}/${main.step.value}`))
watch(theme, () => sync?.publish('theme'))
watch(timer, () => sync?.publish('timer'))

// ---- presenter view ---------------------------------------------------------
// notes of the slide on screen
const notes = computed(() => main.current.value?.notes ?? [])
const presenterName = `phoenyx-presenter ${deckKey(location)}`
// the notice that the browser blocked the window: the URL to open by hand while it shows
const blocked = ref(null)
let blockedTimer
function openPresenter() {
  const params = new URLSearchParams(location.search)
  params.delete('presenter')
  const q = params.toString()
  const url = new URL(`${location.pathname}?${q ? q + '&' : ''}presenter${location.hash}`, location.href).href
  // A window of its own (not a tab), to drag to the speaker's screen, found by its name: one
  // already open (even by this page before a reload) is only brought forward, keeping its scroll;
  // a new one opens blank and is sent to the presenter view.
  const w = window.open('', presenterName, 'popup,width=1280,height=800')
  if (!w) {
    console.warn(`[phoenyx] The browser blocked the presenter window: allow pop-ups for this site, or open ${url}`)
    blocked.value = url
    clearTimeout(blockedTimer)
    blockedTimer = setTimeout(() => (blocked.value = null), 10000)
    return
  }
  blocked.value = null
  let blank = false
  try { blank = w.location.href === 'about:blank' } catch {} // a page of another site: leave it be
  if (blank) w.location.replace(url)
  w.focus()
}

// ---- controls ------------------------------------------------------------
const viewport = ref()
const controls = ref()
const fullscreen = ref(false)
function toggleFullscreen() {
  document.fullscreenElement ? document.exitFullscreen() : (viewport.value ?? document.documentElement).requestFullscreen()
}
const onFullscreen = () => (fullscreen.value = !!document.fullscreenElement)
// slide titles for the jump menu: Slide(title="…"), else its first heading outside the
// background and the footer
const HEADING = ':is(h1, h2, h3):not(.ph-slide-bg *, .ph-footer *)'
const titleOf = (s) => s.title.value || s.el.value?.querySelector(HEADING)?.textContent.trim() || ''
const titles = computed(() => {
  // re-read headings whenever the controls show up (the presenter view shows the title: on every move)
  presenter ? main.index.value : hud.value
  return main.list.map(titleOf)
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
let lastTouch = 0
function onMouseMove() {
  // browsers follow a tap with a compatibility mousemove: that one is not the mouse
  if (performance.now() - lastTouch < 800) return
  poke()
  cursorHidden.value = false
  clearTimeout(cursorTimer)
  if (props.hideCursorAfter > 0) cursorTimer = setTimeout(() => (cursorHidden.value = true), props.hideCursorAfter)
}
// ---- touch: edge taps and swipes navigate, a tap in the middle toggles the controls ---------
const TAP_MS = 500, TAP_MOVE = 12, SWIPE = 50
let touch = null
function onPointerDown(e) {
  if (e.pointerType === 'mouse') return
  lastTouch = performance.now()
  touch = e.isPrimary ? { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId } : null
}
function onPointerUp(e) {
  if (e.pointerType === 'mouse' || !touch || e.pointerId !== touch.id) return
  lastTouch = performance.now()
  const { x, y, t } = touch
  touch = null
  if (e.target.closest?.('.ph-controls, .ph-toast, a, button, input, select, textarea, label, [contenteditable], [data-ph-touch="ignore"]')) return
  const dx = e.clientX - x, dy = e.clientY - y
  if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) return dx < 0 ? main.next() : main.prev()
  if (e.timeStamp - t > TAP_MS || Math.hypot(dx, dy) > TAP_MOVE) return
  controls.value?.closeMenu()
  const w = viewport.value?.clientWidth || innerWidth
  if (e.clientX > w * 0.75) main.next()
  else if (e.clientX < w * 0.25) main.prev()
  else if (hud.value) { clearTimeout(hudTimer); hud.value = false }
  else { hud.value = true; clearTimeout(hudTimer); hudTimer = setTimeout(() => (hud.value = false), 4000) }
}
const onPointerCancel = () => (touch = null)

function onKey(e) {
  if (e.target.closest?.('input, textarea, [contenteditable]')) return
  // Ctrl/Cmd/Alt + key belongs to the browser (print, find, tabs, history); Shift is ours
  if (e.ctrlKey || e.metaKey || e.altKey) return
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

// ---- export: the book of pages (exporter.js) ---------------------------------
const book = ref()
const exportNotes = ref()
const exported = ref(false)
// the notes the presenter view would show at this step (the book takes them at the slide's last)
const shownNotes = computed(() => notes.value.filter((n) => n.step <= main.step.value))
async function exportBook() {
  if (!props.themes.includes(theme.value))
    return reportReady({ error: `theme "${theme.value}" is not one of the deck's themes: ${props.themes.join(', ')}` })
  try {
    const done = await buildBook({
      stage: main,
      canvas: viewport.value.querySelector(':scope > .ph-stage > .ph-canvas'),
      book: book.value,
      notes: exporting.notes ? exportNotes.value : null,
      title: (i) => titleOf(main.list[i]),
      perStep: exporting.perStep,
      width: props.width,
      height: props.height,
    })
    exported.value = true
    reportReady({ ...done, theme: theme.value })
  } catch (e) {
    console.error('[phoenyx] export failed', e)
    reportReady({ error: String(e?.message || e) })
  }
}

const PRESENTER_TITLE = 'Presentador · '
onMounted(() => {
  if (exporting) return exportBook()
  readHash()
  startSync()
  if (presenter && !document.title.startsWith(PRESENTER_TITLE)) document.title = PRESENTER_TITLE + document.title
  window.addEventListener('keydown', onKey)
  window.addEventListener('hashchange', readHash)
  if (!presenter) {
    window.addEventListener('mousemove', onMouseMove)
    viewport.value?.addEventListener('pointerdown', onPointerDown)
    viewport.value?.addEventListener('pointerup', onPointerUp)
    viewport.value?.addEventListener('pointercancel', onPointerCancel)
  }
  document.addEventListener('fullscreenchange', onFullscreen)
})
onBeforeUnmount(() => {
  sync?.close()
  clearTimeout(hudTimer)
  clearTimeout(cursorTimer)
  clearTimeout(blockedTimer)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('hashchange', readHash)
  window.removeEventListener('mousemove', onMouseMove)
  viewport.value?.removeEventListener('pointerdown', onPointerDown)
  viewport.value?.removeEventListener('pointerup', onPointerUp)
  viewport.value?.removeEventListener('pointercancel', onPointerCancel)
  document.removeEventListener('fullscreenchange', onFullscreen)
})
</script>

<style>
/* a notice above the controls (the presenter window was blocked); window px, not canvas px */
.ph-toast {
  position: absolute; left: 50%; bottom: 128px; z-index: 101; transform: translateX(-50%);
  display: flex; align-items: baseline; gap: 14px; max-width: calc(100% - 32px); box-sizing: border-box;
  padding: 12px 16px; border: 1px solid rgba(255, 255, 255, .16); border-radius: 12px;
  background: #1c1c22; box-shadow: 0 12px 32px rgba(0, 0, 0, .35);
  color: rgba(255, 255, 255, .94); font: 15px/1.35 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.ph-toast a { color: #8ab4ff; font-weight: 600; white-space: nowrap; }
.ph-toast-enter-active, .ph-toast-leave-active { transition: opacity .2s, translate .2s; }
.ph-toast-enter-from, .ph-toast-leave-to { opacity: 0; translate: 0 6px; }
</style>
