import { computed, inject, provide, readonly, ref, toValue, watch } from 'vue'
import { themes as projectThemes, themesDir } from 'virtual:arao/themes'

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
// (ALL_THEMES). A name that is no theme there is, and whose rule no stylesheet of the page
// declares either (isTheme: a theme imported by hand), is skipped, with one warning per list; a
// list left with none is ['default']. The page's stylesheets are read when the list is: a
// stylesheet the page loads later does not count. It wears the URL's theme, else the first of
// the list (a thumbnail: the first).
// The controls (useTheme), a frozen object:
//   theme               read-only ref: the theme worn
//   themes              read-only ref: the deck's list, resolved
//   setTheme(name)      wears one of the list and writes it in the URL (?theme=, replacing the
//                       history entry); any other name warns and is ignored
//   cycle()             wears the next one of the list ("t")
// Internals (on what createTheme returns, beside the controls): theme, the writable ref, and
// set(name), which wears any name without checking it (another window's theme, through
// useDeckSync).
const KEY = Symbol('arao-theme')

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

export function createTheme({ themes: prop, initial = null, warn = true }) {
  const themes = computed(() => {
    const list = toValue(prop)
    if (list == null) return ALL_THEMES
    const known = [...new Set(list.filter(isTheme))]
    return known.length ? known : ['default']
  })
  // (said where the deck is shown, not by each thumbnail of it)
  if (warn) {
    watch(() => toValue(prop), (list) => {
      const unknown = (list ?? []).filter((n) => !isTheme(n))
      if (unknown.length) {
        const names = unknown.map((n) => JSON.stringify(n)).join(', ')
        console.warn(`[arao] Deck themes: no theme ${names} (there are: ${ALL_THEMES.join(', ')}; a theme is a [data-theme="<name>"] rule in a CSS file of ${themesDir}, or in any stylesheet the page has loaded): skipped`)
      }
    }, { immediate: true })
  }
  const theme = ref(initial || themes.value[0])
  function set(name) {
    theme.value = name
    const url = new URL(location.href)
    url.searchParams.set('theme', theme.value)
    history.replaceState(null, '', url)
  }

  const controls = Object.freeze({
    theme: readonly(theme),
    themes: readonly(themes),
    setTheme(name) {
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

export function useTheme() {
  const theme = inject(KEY, null)
  if (!theme) throw new Error('[arao] useTheme() must be used inside <Deck>')
  return theme
}
