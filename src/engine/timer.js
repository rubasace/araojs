// The talk's timer, as plain data every window can hold (it is shared through sync.js):
//   { state: 'idle' | 'running' | 'paused', acc: ms counted before `since`, since: ms | null }
// Time is read from the wall clock, so windows that hold the same timer show the same time.
// A reading taken before `since` (a clock read a moment before the timer started, or a wall clock
// set back) counts nothing for that stretch: the time never goes below what was counted before.
export const IDLE = Object.freeze({ state: 'idle', acc: 0, since: null })

export const elapsed = (t, now) => t.acc + (t.state === 'running' ? Math.max(0, now - t.since) : 0)
export const start = (t, now) => (t.state === 'running' ? t : { state: 'running', acc: t.acc, since: now })
export const pause = (t, now) => (t.state === 'running' ? { state: 'paused', acc: elapsed(t, now), since: null } : t)
export const toggle = (t, now) => (t.state === 'running' ? pause(t, now) : start(t, now))

// Deck(duration="…") → ms, or null when it is none of these (or not above zero):
//   a number of minutes   90, "90", "7.5"
//   units                 "45m", "45min", "1h30m", "1h 30m", "1h30" (minutes after h), "90s"
//   a clock, as shown     "45:00" (m:ss), "1:30:00" (h:mm:ss); so "1:30" is 1 min 30 s
const UNITS = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?\s*(?:(\d+)\s*s)?$/
const HOURS_MINUTES = /^(\d+)\s*h\s*(\d+)$/
const CLOCK = /^(\d+)(?::([0-5]\d))?:([0-5]\d)$/
export function parseDuration(v) {
  const s = typeof v === 'number' ? null : String(v ?? '').trim().toLowerCase()
  let ms = null
  let m
  if (s == null) ms = v * 60000
  else if (/^\d+(\.\d+)?$/.test(s)) ms = Number(s) * 60000
  else if ((m = s.match(CLOCK))) {
    const [h, min] = m[2] == null ? [0, m[1]] : [m[1], m[2]]
    ms = ((Number(h) * 60 + Number(min)) * 60 + Number(m[3])) * 1000
  } else if ((m = s.match(HOURS_MINUTES))) ms = (Number(m[1]) * 60 + Number(m[2])) * 60000
  else if ((m = s.match(UNITS)) && (m[1] || m[2] || m[3])) {
    ms = ((Number(m[1] || 0) * 60 + Number(m[2] || 0)) * 60 + Number(m[3] || 0)) * 1000
  }
  // NaN, Infinity (a number, or digits too long for one) and zero are no length
  return Number.isFinite(ms) && ms > 0 ? ms : null
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
