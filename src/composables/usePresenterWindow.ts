import { onBeforeUnmount, readonly, ref } from 'vue'
import { deckKey } from '../core/sync'

// Internal. Opens the presenter view (the deck's path with this URL's query and ?presenter:
// /talk → /talk?presenter, the hash kept) from the audience's window.
//   const { open, name, blocked, dismiss } = usePresenterWindow(path)
// path: the deck's (state/deck.ts), which may not be the address bar's: a project's only deck,
// opened at /, opens its presenter view at /talk?presenter.
// A window of its own (not a tab), to drag to the speaker's screen, found by its name (one per
// deck): one already open, even by this page before a reload, is only brought forward, keeping
// its scroll; a new one opens blank and is sent to the presenter view.
// If the browser blocks it, blocked holds the presenter view's URL for 10 s (Deck shows it as a
// link, which the browser does not block); dismiss() clears it.
export function usePresenterWindow(path: string) {
  const name = `arao-presenter ${deckKey(path, location.search)}`
  const blocked = ref<string | null>(null)
  let blockedTimer: ReturnType<typeof setTimeout> | undefined
  function open() {
    const params = new URLSearchParams(location.search)
    params.delete('presenter')
    const q = params.toString()
    const url = new URL(`${path}?${q ? q + '&' : ''}presenter${location.hash}`, location.href).href
    const w = window.open('', name, 'popup,width=1280,height=800')
    if (!w) {
      console.warn(`[arao] The browser blocked the presenter window: allow pop-ups for this site, or open ${url}`)
      blocked.value = url
      clearTimeout(blockedTimer)
      blockedTimer = setTimeout(() => { blocked.value = null }, 10000)
      return
    }
    blocked.value = null
    let blank = false
    try { blank = w.location.href === 'about:blank' } catch {} // a page of another site: leave it be
    if (blank) w.location.replace(url)
    w.focus()
  }
  onBeforeUnmount(() => clearTimeout(blockedTimer))
  return { open, name, blocked: readonly(blocked), dismiss: () => { blocked.value = null } }
}
