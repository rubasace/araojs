import { computed, inject, provide, readonly, ref, shallowRef, watch, watchPostEffect } from 'vue'
import { exportOptions } from '../core/exporter'
import { IDLE, clock, parseDuration, start, withinBounds } from '../core/timer'
import { useDeckSync } from '../composables/useDeckSync'
import { useFullscreen } from '../composables/useFullscreen'
import { useHashRoute } from '../composables/useHashRoute'
import { usePresenterWindow } from '../composables/usePresenterWindow'
import { themes as projectThemes, themesDir } from 'virtual:arao/themes'
import { ahead, createStage, headingOf, titleOf, useStage } from './stage'

// The deck's state: where it stands, the theme it wears, the talk's timer, fullscreen, the
// presenter window. One per Deck:
//   const deck = createDeck(props)   in Deck.vue, with its props (themes, duration). Provides the
//                                    public face (useDeck) to everything inside the Deck, and
//                                    returns the deck with its internals, for the views
//   useDeck()                        public: for components inside <Deck> (below)
// The window shows one of three views (Deck.vue): deck.mode is 'audience' (the default),
// 'presenter' (?presenter) or 'export' (?export, which wins over ?presenter). A fourth one, not
// from the URL: 'thumbnail', a deck drawn inside something that called provideThumbnail(): its
// first slide at step 1, on a stage that cannot move; no URL read or written, no keys, no other
// window, no presenter window, and every action of its face does nothing.
//   provideThumbnail({ title })    title: a ref the deck fills with its cover's title (its first
//                                  heading, else its title prop), '' if it has neither
// Which deck it is: provideDeckRoute(app, { name, path }), from the app that picked it (app.js):
// its file name and its path as the list writes it (/talk, under the app's base). Its windows
// sync on that path (core/sync.js deckKey) and its presenter window opens there, whatever the
// address bar shows: a project's only deck opens at / too, and / and /talk are one deck. Without
// one (an app of its own, createApp(MyApp).use(Arao)), the address bar's path, and no name.
// Internals (on the returned deck, not on the face):
//   name                the deck's file name (provideDeckRoute), or null: the export reports it
//   stage, preview      the stages (state/stage.js): the one that moves, and in the presenter view
//                       the copy that follows it one step ahead (null elsewhere)
//   next                where one more press leads: { index, step } or { end: true }
//   notes, titles()     the Notes of the slide on screen; every slide's title (jump menu)
//   theme, setTheme, cycleTheme, themes()   themes() is the deck's list, resolved (below)
//   timer, setTimer     the talk's timer (core/timer.js)
//   duration            the talk's length in effect, in ms, or null: the presenter's, else the deck's
//   deckDuration        the deck's own (its duration prop), in ms, or null
//   setDuration(ms)     sets the presenter's length (ms); null goes back to the deck's. It wins
//                       until reset, even over a new duration prop, unless that prop equals it
//   viewport            the element fullscreen fills: the audience view's viewport (it sets it);
//                       without one (the presenter window), the page. fullscreen is true while
//                       anything in the window is fullscreen, and "f" then leaves it
//   presenterWindow     { name, blocked, dismiss } (composables/usePresenterWindow.js); null in
//                       a thumbnail
// The URL's hash and the other windows of the deck follow the stage, except while exporting and
// in a thumbnail.
const KEY = Symbol('arao-deck')
const THUMBNAIL = Symbol('arao-thumbnail')
const ROUTE = Symbol('arao-route')
const COVER = Object.freeze({ index: 0, step: 1 })

export function provideDeckRoute(app, { name, path }) {
  app.provide(ROUTE, Object.freeze({ name, path }))
}

export function provideThumbnail(cover) {
  provide(THUMBNAIL, cover)
}

// Every theme there is: 'default' (the engine's own tokens, styles/tokens.css: no file), then the
// project's, by name (each [data-theme="<name>"] of a CSS file in its themes folder, src/themes by
// default: the Vite plugin reads them and loads their CSS).
const ALL_THEMES = Object.freeze(['default', ...projectThemes.filter((n) => n !== 'default')])

export function createDeck(props) {
  // a thumbnail reads nothing of the URL: the page it is drawn in is not its own
  const thumbnail = inject(THUMBNAIL, null)
  const query = new URLSearchParams(thumbnail ? '' : location.search)
  // ?export wins over ?presenter: the window prints the deck, nothing else
  const exporting = exportOptions(query)
  const mode = thumbnail ? 'thumbnail' : exporting ? 'export' : query.has('presenter') ? 'presenter' : 'audience'
  // which deck this is, and the path its windows share (a thumbnail has neither)
  const route = thumbnail ? null : inject(ROUTE, null)
  const path = route?.path ?? location.pathname

  // ---- slides ------------------------------------------------------------
  // The audience's stage; the presenter view adds a second rendering of the deck that stands one
  // step ahead of it, for the "next" preview. A thumbnail's stage stands at the cover.
  const stage = thumbnail
    ? createStage({ follow: () => COVER, role: mode })
    : createStage({ onMove: moved, role: mode })
  const next = computed(() => ahead(stage))
  const preview = mode === 'presenter' ? createStage({ follow: () => next.value, role: 'preview' }) : null
  const notes = computed(() => stage.current.value?.notes ?? [])
  const titles = () => stage.list.map(titleOf)
  if (thumbnail?.title) {
    watchPostEffect(() => {
      const cover = stage.list[0]
      thumbnail.title.value = cover ? headingOf(cover) || cover.title.value || '' : ''
    })
  }

  // ---- the theme: ?theme=<name> in the URL, else the first of its themes ------------------
  // The deck's themes: Deck(:themes), in its order, or without it every theme there is
  // (ALL_THEMES). A name that is no theme is skipped, with one warning per list (said where the
  // deck is shown, not by each thumbnail of it); a list left with none is ['default']. A thumbnail
  // wears the first of the list.
  // setTheme(name) wears a theme and writes it in the URL (replacing the history entry);
  // cycleTheme() wears the next one of the list ("t").
  const themes = computed(() => {
    if (props.themes == null) return ALL_THEMES
    const known = [...new Set(props.themes.filter((n) => ALL_THEMES.includes(n)))]
    return known.length ? known : ['default']
  })
  if (!thumbnail) {
    watch(() => props.themes, (list) => {
      const unknown = (list ?? []).filter((n) => !ALL_THEMES.includes(n))
      if (unknown.length) {
        const names = unknown.map((n) => JSON.stringify(n)).join(', ')
        console.warn(`[arao] Deck themes: no theme ${names} (there are: ${ALL_THEMES.join(', ')}; a theme is a [data-theme="<name>"] rule in a CSS file of ${themesDir}): skipped`)
      }
    }, { immediate: true })
  }
  const theme = ref(query.get('theme') || themes.value[0])
  function setTheme(name) {
    theme.value = name
    const url = new URL(location.href)
    url.searchParams.set('theme', theme.value)
    history.replaceState(null, '', url)
  }
  function cycleTheme() {
    const list = themes.value
    setTheme(list[(list.indexOf(theme.value) + 1) % list.length])
  }

  // ---- the talk's timer and its length, kept by every window (useDeckSync shares both) --------
  // startTimer() starts the timer if it is idle (the deck's first move); a paused one stays paused.
  // The length is the deck's (its duration prop, in ms, or null; a value that is no length warns,
  // and so does one outside 1 min – 24 h, which still counts; once per value) unless the
  // presenter set another: override, in ms, or null. setDuration(ms) sets it; null, or the deck's
  // own value, goes back to the deck's (no override left).
  // An override wins until it is reset, even over a new duration prop (an edit of the deck, HMR).
  // One equal to the deck's value is dropped, as setting the deck's own value would be: when an
  // edit of the deck reaches it, or when a window an edit remounted takes it back from
  // sessionStorage (the drop is a change like any other: the other windows follow).
  const timer = shallowRef(IDLE)
  const setTimer = (t) => (timer.value = t)
  const deckDuration = computed(() => parseDuration(props.duration))
  const override = shallowRef(null)
  // anything but a length (a value kept by another version, say) is no override
  const setOverride = (ms) => (override.value = Number.isFinite(ms) && ms > 0 ? ms : null)
  const setDuration = (ms) => setOverride(ms === deckDuration.value ? null : ms)
  const duration = computed(() => override.value ?? deckDuration.value)
  // (said where the deck is shown, not by each thumbnail of it)
  if (!thumbnail) {
    watch(() => props.duration, (v) => {
      const ms = deckDuration.value
      if (v != null && String(v).trim() && ms == null) {
        console.warn(`[arao] Deck duration="${v}" is not a length (90, "45m", "1h30", "45:00"…): the presenter view shows no countdown`)
      } else if (ms != null && !withinBounds(ms)) {
        console.warn(`[arao] Deck duration="${v}" is ${clock(ms)}, outside 1 min – 24 h: the presenter view counts it down anyway, but its field takes nothing outside them`)
      }
    }, { immediate: true })
  }
  watch([override, deckDuration], ([o, d]) => {
    if (o != null && o === d) setOverride(null)
  })
  function startTimer() {
    if (timer.value.state === 'idle') timer.value = start(timer.value, Date.now())
  }

  // ---- fullscreen, the presenter window ----------------------------------------------------
  const viewport = shallowRef(null)
  const { fullscreen, toggle: toggleFullscreen } = useFullscreen(viewport)
  const presenterWindow = thumbnail ? null : usePresenterWindow(path)

  // ---- the URL, the other windows (not while exporting, nor in a thumbnail) ----------------
  let sync = null
  if (mode === 'audience' || mode === 'presenter') {
    useHashRoute(stage) // first: the position the URL gives is in place before the windows sync
    sync = useDeckSync(stage, { path, theme, setTheme, adoptTheme: !query.has('theme'), timer, setTimer, override, setOverride })
  }
  // A move made here (keys, controls, an addon, the URL; not a position received, nor the deck
  // renumbering its slides after an edit): the other windows follow, and the first one starts the
  // timer.
  function moved() {
    if (sync?.moved()) startTimer()
  }

  // The public face (useDeck): read-only refs (deeply: the themes' array and the timer's object
  // too) and the actions, in a frozen object, so no component can reassign a field or edit the
  // deck's state in place. Its setTheme only wears one of the deck's themes. Its duration is the
  // one in effect (a computed, so read-only); setting it stays with the presenter view. A
  // thumbnail's actions act on nothing.
  const face = Object.freeze({
    ...stage.view,
    theme: readonly(theme),
    themes: readonly(themes),
    fullscreen: readonly(fullscreen),
    timer: readonly(timer),
    duration,
    setTheme(name) {
      if (themes.value.includes(name)) setTheme(name)
      else console.warn(`[arao] setTheme("${name}"): not one of the deck's themes (${themes.value.join(', ')}); ignored`)
    },
    toggleFullscreen,
    openPresenter: presenterWindow?.open,
    ...(thumbnail && inert),
  })
  provide(KEY, face)

  return {
    name: route?.name ?? null, mode, exporting, face, stage, preview, next, notes, titles,
    theme, setTheme, cycleTheme, themes: () => themes.value,
    timer, setTimer, duration, deckDuration, setDuration,
    viewport, presenterWindow,
  }
}

// For components inside <Deck> (addons, or anything in a slide): where the deck is, and moving it.
//   const deck = useDeck()
//   index, step, total, steps, progress   read-only refs: the slide on screen (0-based), its step
//                                         (1-based), the slide count, its step count, and the
//                                         progress over every step of the deck (0..1)
//   next(), prev(), go(i, step)           move it
//   theme, themes                         the theme worn, the deck's list (read-only refs; the
//                                         list is its themes prop, or every theme there is);
//                                         setTheme(name) wears another of the list (any other
//                                         name warns and is ignored)
//   fullscreen, toggleFullscreen()        read-only ref; enters or leaves fullscreen
//   timer                                 read-only ref of the talk's timer (core/timer.js)
//   duration                              read-only ref: the talk's length in ms, or null; the
//                                         one the presenter set in the presenter view, else the
//                                         deck's duration prop
//   openPresenter()                       opens the presenter window (from the audience's)
//   role                                  a plain string: which drawing of the deck this is
// The position is that of the drawing the caller is in. The presenter view draws the deck twice,
// the current slide and a preview of the next step: in the preview, a component reads the
// preview's position, and no action does anything (next/prev/go, setTheme, toggleFullscreen,
// openPresenter): the preview is a copy, it cannot act.
// The face is frozen and its refs read-only, deeply: only its actions change the deck. Frozen, it
// stays as it is inside reactive() or data() (its refs are not unwrapped there): read its refs
// directly (deck.index.value).
// role: 'audience' (the audience window), 'presenter' (the presenter view's current slide),
// 'preview' (its next step), 'export' (the deck being printed, ?export: each page is a static
// copy, so what plays does not print) or 'thumbnail' (its cover, drawn small: a picture, nothing
// acts). Everything mounts once per drawing, so a presenter window runs it
// twice: skip side effects (timers, fetches, autoplay, sound) where they do not belong.
//   onMounted(() => deck.role === 'audience' && video.value.play())
// Outside every drawing (the controls, the presenter view's bar) it is the audience's stage.
const views = new WeakMap() // stage → the face of the deck drawn in it
const noop = () => {}
// the actions of a copy, the preview's or a thumbnail's (their next/prev/go are no-ops already:
// their stages are followers, state/stage.js)
const inert = { setTheme: noop, toggleFullscreen: noop, openPresenter: noop }
const copies = ['preview', 'thumbnail']

export function useDeck() {
  const deck = inject(KEY, null)
  if (!deck) throw new Error('[arao] useDeck() must be used inside <Deck>')
  const stage = useStage()
  if (!stage) return deck
  if (!views.has(stage)) views.set(stage, Object.freeze({ ...deck, ...stage.view, ...(copies.includes(stage.role) && inert) }))
  return views.get(stage)
}
