import { computed, inject, provide, readonly, ref, shallowRef, watch } from 'vue'
import { exportOptions } from '../core/exporter'
import { IDLE, parseDuration, start } from '../core/timer'
import { useDeckSync } from '../composables/useDeckSync'
import { useFullscreen } from '../composables/useFullscreen'
import { useHashRoute } from '../composables/useHashRoute'
import { usePresenterWindow } from '../composables/usePresenterWindow'
import { ahead, createStage, titleOf, useStage } from './stage'

// The deck's state: where it stands, the theme it wears, the talk's timer, fullscreen, the
// presenter window. One per Deck:
//   const deck = createDeck(props)   in Deck.vue, with its props (themes, duration). Provides the
//                                    public face (useDeck) to everything inside the Deck, and
//                                    returns the deck with its internals, for the views
//   useDeck()                        public: for components inside <Deck> (below)
// The window shows one of three views (Deck.vue): deck.mode is 'audience' (the default),
// 'presenter' (?presenter) or 'export' (?export, which wins over ?presenter).
// Internals (on the returned deck, not on the face):
//   stage, preview      the stages (state/stage.js): the one that moves, and in the presenter view
//                       the copy that follows it one step ahead (null elsewhere)
//   next                where one more press leads: { index, step } or { end: true }
//   notes, titles()     the Notes of the slide on screen; every slide's title (jump menu)
//   theme, setTheme, cycleTheme, themes()
//   timer, setTimer, duration    the talk's timer (core/timer.js) and its length in ms, or null
//   viewport            the element fullscreen fills: the audience view's viewport (it sets it);
//                       without one (the presenter window), the page. fullscreen is true while
//                       anything in the window is fullscreen, and "f" then leaves it
//   presenterWindow     { name, blocked, dismiss } (composables/usePresenterWindow.js)
// The URL's hash and the other windows of the deck follow the stage, except while exporting.
const KEY = Symbol('arao-deck')

export function createDeck(props) {
  const query = new URLSearchParams(location.search)
  // ?export wins over ?presenter: the window prints the deck, nothing else
  const exporting = exportOptions(query)
  const mode = exporting ? 'export' : query.has('presenter') ? 'presenter' : 'audience'

  // ---- slides ------------------------------------------------------------
  // The audience's stage; the presenter view adds a second rendering of the deck that stands one
  // step ahead of it, for the "next" preview.
  const stage = createStage({ onMove: moved, role: mode })
  const next = computed(() => ahead(stage))
  const preview = mode === 'presenter' ? createStage({ follow: () => next.value, role: 'preview' }) : null
  const notes = computed(() => stage.current.value?.notes ?? [])
  const titles = () => stage.list.map(titleOf)

  // ---- the theme: ?theme=<name> in the URL, else the first of its themes ------------------
  // setTheme(name) wears a theme and writes it in the URL (replacing the history entry);
  // cycleTheme() wears the next one of the list ("t").
  const theme = ref(query.get('theme') || props.themes[0])
  function setTheme(name) {
    theme.value = name
    const url = new URL(location.href)
    url.searchParams.set('theme', theme.value)
    history.replaceState(null, '', url)
  }
  function cycleTheme() {
    const list = props.themes
    setTheme(list[(list.indexOf(theme.value) + 1) % list.length])
  }

  // ---- the talk's timer, kept by every window (useDeckSync shares it), and its length ---------
  // duration: in ms, or null; a value that is no length warns (once per value). startTimer()
  // starts it if it is idle (the deck's first move); a paused timer stays paused.
  const timer = shallowRef(IDLE)
  const setTimer = (t) => (timer.value = t)
  const duration = computed(() => parseDuration(props.duration))
  watch(() => props.duration, (v) => {
    if (v != null && String(v).trim() && duration.value == null) {
      console.warn(`[arao] Deck duration="${v}" is not a length (90, "45m", "1h30", "45:00"…): the presenter view shows no countdown`)
    }
  }, { immediate: true })
  function startTimer() {
    if (timer.value.state === 'idle') timer.value = start(timer.value, Date.now())
  }

  // ---- fullscreen, the presenter window ----------------------------------------------------
  const viewport = shallowRef(null)
  const { fullscreen, toggle: toggleFullscreen } = useFullscreen(viewport)
  const presenterWindow = usePresenterWindow()

  // ---- the URL, the other windows (not while exporting) ------------------------------------
  let sync = null
  if (!exporting) {
    useHashRoute(stage) // first: the position the URL gives is in place before the windows sync
    sync = useDeckSync(stage, { theme, setTheme, adoptTheme: !query.has('theme'), timer, setTimer })
  }
  // A move made here (keys, controls, an addon, the URL; not a position received, nor the deck
  // renumbering its slides after an edit): the other windows follow, and the first one starts the
  // timer.
  function moved() {
    if (sync?.moved()) startTimer()
  }

  const face = {
    ...stage.view,
    theme: readonly(theme),
    themes: computed(() => props.themes),
    fullscreen: readonly(fullscreen),
    timer: computed(() => timer.value),
    setTheme,
    toggleFullscreen,
    openPresenter: presenterWindow.open,
  }
  provide(KEY, face)

  return {
    mode, exporting, face, stage, preview, next, notes, titles,
    theme, setTheme, cycleTheme, themes: () => props.themes,
    timer, setTimer, duration,
    viewport, presenterWindow,
  }
}

// For components inside <Deck> (addons, or anything in a slide): where the deck is, and moving it.
//   const deck = useDeck()
//   index, step, total, steps, progress   read-only refs: the slide on screen (0-based), its step
//                                         (1-based), the slide count, its step count, and the
//                                         progress over every step of the deck (0..1)
//   next(), prev(), go(i, step)           move it
//   theme, themes                         the theme worn, the deck's list (read-only refs);
//                                         setTheme(name) wears another
//   fullscreen, toggleFullscreen()        read-only ref; enters or leaves fullscreen
//   timer                                 read-only ref of the talk's timer (core/timer.js)
//   openPresenter()                       opens the presenter window (from the audience's)
//   role                                  a plain string: which drawing of the deck this is
// The position is that of the drawing the caller is in. The presenter view draws the deck twice,
// the current slide and a preview of the next step: in the preview, a component reads the
// preview's position, and next/prev/go do nothing.
// role: 'audience' (the audience window), 'presenter' (the presenter view's current slide),
// 'preview' (its next step) or 'export' (the deck being printed, ?export: each page is a static
// copy, so what plays does not print). Everything mounts once per drawing, so a presenter window
// runs it twice: skip side effects (timers, fetches, autoplay, sound) where they do not belong.
//   onMounted(() => deck.role === 'audience' && video.value.play())
// Outside every drawing (the controls, the presenter view's bar) it is the audience's stage.
const views = new WeakMap() // stage → the face of the deck drawn in it

export function useDeck() {
  const deck = inject(KEY, null)
  if (!deck) throw new Error('[arao] useDeck() must be used inside <Deck>')
  const stage = useStage()
  if (!stage) return deck
  if (!views.has(stage)) views.set(stage, { ...deck, ...stage.view })
  return views.get(stage)
}
