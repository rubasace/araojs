import { computed, inject, provide, readonly, ref, shallowRef, watch, watchPostEffect } from 'vue'
import { exportOptions } from '../core/exporter'
import { useDeckSync } from '../composables/useDeckSync'
import { useFullscreen } from '../composables/useFullscreen'
import { useHashRoute } from '../composables/useHashRoute'
import { usePresenterWindow } from '../composables/usePresenterWindow'
import { themes as projectThemes, themesDir } from 'virtual:arao/themes'
import { ahead, createStage, headingOf, titleOf, useStage } from './stage'
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
//   titles()            every slide's title (jump menu)
//   theme, setTheme, cycleTheme, themes()   themes() is the deck's list, resolved (below)
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
// default, or in a local partial such a file @import-s: the Vite plugin reads them and loads their
// CSS).
const ALL_THEMES = Object.freeze(['default', ...projectThemes.filter((n) => n !== 'default')])

// Whether a stylesheet of the page declares a theme: a [data-theme="<name>"] selector, outside
// :not(…), in any rule (inside @media, @supports, @layer, @container, nested rules, @import-ed
// sheets). For a name a deck lists that the themes folder does not give: a theme the project
// imports itself (from src/styles, a package, a .scss file, a deck's own <style>), or one in a
// partial the plugin does not follow. A sheet of another origin that keeps its rules to itself is
// passed over. The browser writes every selector back in one form: the value in double quotes,
// " and \ escaped, then " i" or " s" for a flag. A name with white space is no theme's, here as
// in the plugin.
function declaresTheme(name) {
  if (typeof name !== 'string' || !name || /\s/.test(name)) return false
  const needle = `[data-theme="${name.replace(/["\\]/g, (c) => `\\${c}`)}"`
  const names = (selector) => {
    const text = withoutNot(selector)
    for (let at = text.indexOf(needle); at >= 0; at = text.indexOf(needle, at + 1)) {
      if (/^(?: [is])?\]/.test(text.slice(at + needle.length))) return true
    }
    return false
  }
  const inRules = (rules) => {
    for (const rule of rules) {
      if (rule.selectorText && names(rule.selectorText)) return true
      if ((rule.styleSheet && inSheet(rule.styleSheet)) || (rule.cssRules && inRules(rule.cssRules))) return true
    }
    return false
  }
  const inSheet = (sheet) => {
    if (sheet.disabled) return false
    try {
      return inRules(sheet.cssRules)
    } catch {
      return false // another origin's, unreadable
    }
  }
  return [...document.styleSheets, ...(document.adoptedStyleSheets ?? [])].some(inSheet)
}
// a selector without what each :not(…) holds (its parentheses nested; strings and escapes skipped)
function withoutNot(selector) {
  let out = ''
  let from = 0
  for (let at = selector.indexOf(':not('); at >= 0; at = selector.indexOf(':not(', from)) {
    out += selector.slice(from, at)
    let i = at + 5
    for (let depth = 1, quoted = false; i < selector.length && depth; i++) {
      const c = selector[i]
      if (c === '\\') i++
      else if (c === '"') quoted = !quoted
      else if (!quoted && c === '(') depth++
      else if (!quoted && c === ')') depth--
    }
    from = i
  }
  return out + selector.slice(from)
}
// a name a deck can list: a theme there is, or one the page's stylesheets declare
const isTheme = (name) => ALL_THEMES.includes(name) || declaresTheme(name)

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

  // ---- the theme: ?theme=<name> in the URL, else the first of its themes ------------------
  // The deck's themes: Deck(:themes), in its order, or without it every theme there is
  // (ALL_THEMES). A name that is no theme there is, and whose rule no stylesheet of the page
  // declares either (isTheme: a theme imported by hand), is skipped, with one warning per list
  // (said where the deck is shown, not by each thumbnail of it); a list left with none is
  // ['default']. The page's stylesheets are read when the list is: a stylesheet the page loads
  // later does not count. A thumbnail wears the first of the list.
  // setTheme(name) wears a theme and writes it in the URL (replacing the history entry);
  // cycleTheme() wears the next one of the list ("t").
  const themes = computed(() => {
    if (props.themes == null) return ALL_THEMES
    const known = [...new Set(props.themes.filter(isTheme))]
    return known.length ? known : ['default']
  })
  if (!thumbnail) {
    watch(() => props.themes, (list) => {
      const unknown = (list ?? []).filter((n) => !isTheme(n))
      if (unknown.length) {
        const names = unknown.map((n) => JSON.stringify(n)).join(', ')
        console.warn(`[arao] Deck themes: no theme ${names} (there are: ${ALL_THEMES.join(', ')}; a theme is a [data-theme="<name>"] rule in a CSS file of ${themesDir}, or in any stylesheet the page has loaded): skipped`)
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
    useHashRoute(stage) // first: the position the URL gives is in place before the windows sync
    sync = useDeckSync(stage, { path, theme, setTheme, adoptTheme: !query.has('theme'), timer, setTimer: talk.setTimer, override: talk.override, setOverride: talk.setOverride })
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
    name: route?.name ?? null, mode, exporting, face, stage, preview, next, titles,
    theme, setTheme, cycleTheme, themes: () => themes.value,
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
