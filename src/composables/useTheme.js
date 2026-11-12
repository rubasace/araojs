import { readonly, ref, toValue } from 'vue'

// Internal. The theme the deck wears: ?theme=<name> in the URL, else the first of its themes.
//   const { theme, setTheme, cycleTheme } = useTheme(() => props.themes)
// theme is a read-only ref; setTheme(name) wears a theme and writes it in the URL (replacing the
// history entry); cycleTheme() wears the next one of the list ("t").
export function useTheme(themes) {
  const theme = ref(new URLSearchParams(location.search).get('theme') || toValue(themes)[0])
  function setTheme(name) {
    theme.value = name
    const url = new URL(location.href)
    url.searchParams.set('theme', theme.value)
    history.replaceState(null, '', url)
  }
  function cycleTheme() {
    const list = toValue(themes)
    setTheme(list[(list.indexOf(theme.value) + 1) % list.length])
  }
  return { theme: readonly(theme), setTheme, cycleTheme }
}
