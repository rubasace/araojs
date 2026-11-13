import { computed, inject, provide, readonly, ref, toValue, watch, type InjectionKey, type MaybeRefOrGetter, type Ref } from 'vue'
import { themes as sourceThemes, themeSources } from 'virtual:arao/themes'

// The theme a deck wears, and the ones it offers. One per Deck: the CSS of every theme is the
// project's, shared by all its decks; which of them a deck offers (its themes prop) and which it
// wears are the deck's own.
//   const theme = createTheme({ themes, initial, warn })   in createDeck: themes, the deck's
//                                    themes prop (a getter, ref or value); initial, the name the
//                                    URL gives (?theme=), or null; warn: false in a thumbnail (it
//                                    says nothing of the prop). Provides the controls (useTheme)
//                                    and returns { controls, theme, set } (internals below)
//   useTheme()                       the controls, for the deck's controls (the themes list, "t")
// The deck's themes: Deck(:themes), in its order, or without it every theme there is
// (ALL_THEMES). A name that is no theme there is (none of the plugin's theme sources gives it) is
// skipped, with one warning per list; a list left with none is the first theme there is
// ('default'). It wears the URL's
// theme, else the first of the list (a thumbnail: the first).
// The controls (useTheme), a frozen object:
//   theme               read-only ref: the theme worn
//   themes              read-only ref: the deck's list, resolved
//   setTheme(name)      wears one of the list and writes it in the URL (?theme=, replacing the
//                       history entry); any other name warns and is ignored
//   cycle()             wears the next one of the list ("t")
// Internals (on what createTheme returns, beside the controls): theme, the writable ref, and
// set(name), which wears any name without checking it (another window's theme, through
// useDeckSync).
export interface ThemeControls {
  readonly theme: Readonly<Ref<string>>
  readonly themes: Readonly<Ref<readonly string[]>>
  setTheme(name: string): void
  cycle(): void
}
const KEY: InjectionKey<ThemeControls> = Symbol('arao-theme')

// Every theme there is, in the plugin's order: 'default' (the library's themes/default.css), then
// the project's, source after source, then the library's built-in themes (those arao({
// builtinThemes }) loads, and no project theme replaces), by name in each (each [data-theme="<name>"]
// of a CSS file in a source's folder, or in a local partial such a file @import-s: the Vite plugin
// reads them and loads their CSS).
const ALL_THEMES: readonly string[] = Object.freeze([...sourceThemes])

// a name a deck can list: a theme there is (no stylesheet of the page is read: a theme comes from
// a source of arao({ themes }) or it is none)
const isTheme = (name: unknown): name is string => typeof name === 'string' && ALL_THEMES.includes(name)

export function createTheme({ themes: prop, initial = null, warn = true }: { themes: MaybeRefOrGetter<readonly string[] | null | undefined>; initial?: string | null; warn?: boolean }) {
  const themes = computed((): readonly string[] => {
    const list = toValue(prop)
    if (list == null) return ALL_THEMES
    const known = [...new Set(list.filter(isTheme))]
    return known.length ? known : ALL_THEMES.slice(0, 1)
  })
  // (said where the deck is shown, not by each thumbnail of it)
  if (warn) {
    watch(() => toValue(prop), (list) => {
      const unknown = (list ?? []).filter((n) => !isTheme(n))
      if (unknown.length) {
        const names = unknown.map((n) => JSON.stringify(n)).join(', ')
        console.warn(`[arao] Deck themes: no theme ${names} (there are: ${ALL_THEMES.join(', ')}; a theme is a [data-theme="<name>"] rule in a CSS file of a theme source, arao({ themes }): ${themeSources.join(', ')}): skipped`)
      }
    }, { immediate: true })
  }
  const theme = ref(initial || themes.value[0])
  function set(name: string) {
    theme.value = name
    const url = new URL(location.href)
    url.searchParams.set('theme', theme.value)
    history.replaceState(null, '', url)
  }

  const controls: ThemeControls = Object.freeze({
    theme: readonly(theme),
    themes: readonly(themes),
    setTheme(name: string) {
      if (themes.value.includes(name)) set(name)
      else console.warn(`[arao] setTheme("${name}"): not one of the deck's themes (${themes.value.join(', ')}); ignored`)
    },
    cycle() {
      const list = themes.value
      set(list[(list.indexOf(theme.value) + 1) % list.length])
    },
  })
  provide(KEY, controls)
  return { controls, theme, set }
}

export function useTheme(): ThemeControls {
  const theme = inject(KEY, null)
  if (!theme) throw new Error('[arao] useTheme() must be used inside <Deck>')
  return theme
}
