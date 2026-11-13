import { computed, inject, onMounted, provide, readonly, shallowRef, watch, watchPostEffect } from 'vue'
import { useEventListener } from '@vueuse/core'
import { exportOptions } from '../core/exporter'
import { useDeckSync } from '../composables/useDeckSync'
import { useFullscreen } from '../composables/useFullscreen'
import { usePresenterWindow } from '../composables/usePresenterWindow'
import { ahead, createStage, headingOf, titleOf, useStage } from './stage'
import { createTheme } from './theme'
import { createTimer } from './timer'

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
//   titles()            every slide's title (the presenter view's bar)
//   theme               the theme's controls (state/theme.js): the shortcuts' "t" cycles them
//   viewport            the element fullscreen fills and touch is read on (the shortcuts,
//                       composables/useShortcuts.js): the audience view's viewport (it sets it);
//                       without one (the presenter window), the page. fullscreen is true while
//                       anything in the window is fullscreen, and "f" then leaves it
//   presenterWindow     { name, blocked, dismiss } (composables/usePresenterWindow.js); null in
//                       a thumbnail
// The URL's hash and the other windows of the deck follow the stage, except while exporting and
// in a thumbnail. The theme is state/theme.js (createTheme: the deck's list, the one it wears).
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
  const titles = () => stage.list.map(titleOf)
  if (thumbnail?.title) {
    watchPostEffect(() => {
      const cover = stage.list[0]
      thumbnail.title.value = cover ? headingOf(cover) || cover.title.value || '' : ''
    })
  }

  // ---- the theme (state/theme.js): ?theme=<name> in the URL, else the first of its themes ---
  const look = createTheme({ themes: () => props.themes, initial: query.get('theme'), warn: !thumbnail })
  const { theme } = look

  // ---- the talk's timer and its length (state/timer.js), kept by every window ----------------
  const talk = createTimer({ duration: () => props.duration, warn: !thumbnail })
  const { timer, duration } = talk

  // ---- fullscreen, the presenter window ----------------------------------------------------
  const viewport = shallowRef(null)
  const { fullscreen, toggle: toggleFullscreen } = useFullscreen(viewport)
  const presenterWindow = thumbnail ? null : usePresenterWindow(path)

  // ---- the URL, the other windows (not while exporting, nor in a thumbnail) ----------------
  let sync = null
  if (mode === 'audience' || mode === 'presenter') {
    hashRoute() // first: the position the URL gives is in place before the windows sync
    sync = useDeckSync(stage, { path, theme, setTheme: look.set, adoptTheme: !query.has('theme'), timer, setTimer: talk.setTimer, override: talk.override, setOverride: talk.setOverride })
  }
  // The URL's hash is where the deck stands: #/slide/step, both 1-based. Read once the deck has
  // mounted and whenever the hash changes (stage.go: a move like any other); written on every
  // change of position, replacing the history entry instead of adding one.
  function hashRoute() {
    function read() {
      const [, i, s] = location.hash.match(/^#\/(\d+)(?:\/(\d+))?/) || []
      if (i) stage.go(Number(i) - 1, Number(s || 1))
    }
    onMounted(read)
    useEventListener(window, 'hashchange', read)
    watch([stage.index, stage.step], () => history.replaceState(null, '', `#/${stage.index.value + 1}/${stage.step.value}`))
  }
  // A move made here (keys, controls, an addon, the URL; not a position received, nor the deck
  // renumbering its slides after an edit): the other windows follow, and the first one starts the
  // timer if it is idle (a paused one stays paused).
  function moved() {
    if (sync?.moved() && timer.value.state === 'idle') talk.start()
  }

  // The public face (useDeck): read-only refs (deeply: the themes' array and the timer's object
  // too) and the actions, in a frozen object, so no component can reassign a field or edit the
  // deck's state in place. Its setTheme only wears one of the deck's themes. Its duration is the
  // one in effect (a computed, so read-only); setting it stays with the presenter view. A
  // thumbnail's actions act on nothing.
  const face = Object.freeze({
    ...stage.view,
    theme: look.controls.theme,
    themes: look.controls.themes,
    fullscreen: readonly(fullscreen),
    timer: readonly(timer),
    duration,
    setTheme: look.controls.setTheme,
    titles,
    toggleFullscreen,
    openPresenter: presenterWindow?.open,
    ...(thumbnail && inert),
  })
  provide(KEY, face)

  return {
    name: route?.name ?? null, mode, exporting, face, stage, preview, next, titles,
    theme: look.controls, viewport, presenterWindow,
  }
}

// For components inside <Deck> (addons, or anything in a slide): where the deck is, and moving it.
//   const deck = useDeck()
//   index, step, total, steps, progress   read-only refs: the slide on screen (0-based), its step
//                                         (1-based), the slide count, its step count, and the
//                                         progress over every step of the deck (0..1)
//   next(), prev(), go(i, step)           move it
//   titles()                              every slide's title, in order ('' for one without)
//   theme, themes                         the theme worn, the deck's list (read-only refs; the
//                                         list is its themes prop, or every theme there is);
//                                         setTheme(name) wears another of the list (any other
//                                         name warns and is ignored)
//   fullscreen, toggleFullscreen()        read-only ref; enters or leaves fullscreen
//   timer                                 read-only ref of the talk's timer (state/timer.js)
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
