// The talk's timer, as plain data every window can hold (it is shared through sync.js):
//   { state: 'idle' | 'running' | 'paused', acc: ms counted before `since`, since: ms | null }
// Time is read from the wall clock, so windows that hold the same timer show the same time.
export const IDLE = Object.freeze({ state: 'idle', acc: 0, since: null })

export const elapsed = (t, now) => t.acc + (t.state === 'running' ? now - t.since : 0)
export const start = (t, now) => (t.state === 'running' ? t : { state: 'running', acc: t.acc, since: now })
export const pause = (t, now) => (t.state === 'running' ? { state: 'paused', acc: elapsed(t, now), since: null } : t)
export const toggle = (t, now) => (t.state === 'running' ? pause(t, now) : start(t, now))

// Deck(duration="…"): "45m", "1h30m", "1h 30m", "90s", or a plain number of minutes (90, "90").
// Returns ms, or null when it is none of those (or zero).
export function parseDuration(v) {
  if (typeof v === 'number') return v > 0 ? v * 60000 : null
  const s = String(v ?? '').trim().toLowerCase()
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s) > 0 ? Number(s) * 60000 : null
  const m = s.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?\s*(?:(\d+)\s*s)?$/)
  if (!m || !(m[1] || m[2] || m[3])) return null
  const ms = ((Number(m[1] || 0) * 60 + Number(m[2] || 0)) * 60 + Number(m[3] || 0)) * 1000
  return ms > 0 ? ms : null
}

// How the time left looks: 'over' past the duration; 'low' in the last 10 % of it, but never
// earlier than 5 minutes before the end; 'ok' otherwise.
export function phase(left, duration) {
  if (left < 0) return 'over'
  return left <= Math.min(duration * 0.1, 5 * 60000) ? 'low' : 'ok'
}

// 75000 → "1:15"; 3725000 → "1:02:05". Whole seconds, rounded down (the absolute value).
export function clock(ms) {
  const t = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(t / 3600)
  const m = Math.floor(t / 60) % 60
  const s = String(t % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}
