// Windows of the same deck in the same browser (audience, presenter, a second audience) share a
// few values through a BroadcastChannel: where the deck stands, its theme, the talk's timer and
// the length the presenter set for it.
//
// Each value is a register, and the last change wins. A change carries a stamp [time, window]:
// the wall clock (strictly increasing per register, so a change always beats the one it
// replaces) and, for ties, the window's age (the older window wins). A window takes a value
// only if its stamp is newer than the one it holds, so two windows changed at the same moment
// end up agreeing on one of the two changes instead of swapping them.
//
// A value nobody changed yet holds stamp [0, window]: among those the older window wins. A new
// window asks the others for their values when it starts; it adopts them, being the youngest,
// unless the register was created with adopt: false (it keeps its own until a live change).
//
// keep: true makes a value outlive a reload of the window: the value and its stamp are saved in
// the tab's sessionStorage whenever they change, and a window that starts takes them back from
// there before it asks the others (so it has them even when no window is left to answer; a
// window still open with a newer change wins, as always). Closing the tab forgets them.
//
// Usage:
//   const sync = createSync(key)
//   sync.register('pos', { get: () => ({ index, step }), set: (v, { reply }) => place(v) })
//   sync.register('timer', { get, set, keep: true })
//   watch(pos, () => sync.publish('pos'))   // after a local change; returns true if it was sent
// publish() sends only when the value differs from the one held, so a watcher that sees a value
// it just received does not echo it back; publish(name, true) sends it anyway.
export function createSync(key) {
  // older window → larger rank; two windows started within the same microsecond: random
  const rank = -((performance.timeOrigin || Date.now()) + Math.random() / 1000)
  const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(key) : null
  const registers = new Map() // name → { get, set, adopt, keep, held: { value, stamp } }
  // storage can be missing or refuse (privacy settings, quota): then nothing is kept
  const stored = (name) => `${key} ${name}`
  const load = (name) => {
    try {
      const v = JSON.parse(sessionStorage.getItem(stored(name)))
      return Array.isArray(v?.stamp) && v.stamp.length === 2 && 'value' in v ? v : null
    } catch { return null }
  }
  const hold = (name, held) => {
    const r = registers.get(name)
    r.held = held
    if (r.keep) try { sessionStorage.setItem(stored(name), JSON.stringify(held)) } catch {}
  }

  const newer = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1])
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  // a plain copy: reactive proxies cannot be posted
  const plain = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)))
  const post = (msg) => channel?.postMessage(msg)
  const send = (name, reply = false) => {
    const { held } = registers.get(name)
    post({ kind: 'set', name, value: held.value, stamp: held.stamp, reply })
  }

  if (channel) {
    channel.onmessage = ({ data: m }) => {
      if (m?.kind === 'hello') for (const name of registers.keys()) send(name, true)
      if (m?.kind !== 'set') return
      const r = registers.get(m.name)
      if (!r || !newer(m.stamp, r.held.stamp) || (m.reply && !r.adopt)) return
      hold(m.name, { value: m.value, stamp: m.stamp })
      r.set(plain(m.value), { reply: m.reply })
    }
  }

  return {
    register(name, { get, set, adopt = true, keep = false }) {
      registers.set(name, { get, set, adopt, keep, held: { value: plain(get()), stamp: [0, rank] } })
      const kept = keep && load(name)
      if (!kept) return
      registers.get(name).held = kept
      set(plain(kept.value), { reply: false })
    },
    // ask the windows already open for their values (call once every register is in)
    hello() {
      post({ kind: 'hello' })
    },
    publish(name, force = false) {
      const r = registers.get(name)
      const value = plain(r.get())
      if (!force && same(value, r.held.value)) return false
      hold(name, { value, stamp: [Math.max(Date.now(), r.held.stamp[0] + 1), rank] })
      send(name)
      return true
    },
    close() {
      channel?.close()
    },
  }
}

// The channel of a deck: the deck's path (state/deck.js: the one the app gives it, else the
// address bar's) and the same query, apart from the parameters that only say how this window
// shows it (presenter, theme). /demo and /demo?presenter talk; /demo and /framework do not. The
// path is taken as it is: /Demo and /demo are two channels.
export function deckKey(path, search) {
  const params = new URLSearchParams(search)
  params.delete('presenter')
  params.delete('theme')
  params.sort()
  return `arao:${path}?${params}`
}
