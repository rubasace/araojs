import { computed, inject, provide, readonly, shallowRef, toValue, watch, type ComputedRef, type DeepReadonly, type InjectionKey, type MaybeRefOrGetter, type Ref } from 'vue'

// ---- the timer as data, the talk's length, how time reads: pure (no Vue) -----------------------
// The talk's timer, as plain data every window can hold (it is shared through sync.ts):
//   { state: 'idle' | 'running' | 'paused', acc: ms counted before `since`, since: ms | null }
// Time is read from the wall clock, so windows that hold the same timer show the same time.
// A reading taken before `since` (a clock read a moment before the timer started, or a wall clock
// set back) counts nothing for that stretch: the time never goes below what was counted before.
export type Timer =
  | { readonly state: 'idle' | 'paused'; readonly acc: number; readonly since: null }
  | { readonly state: 'running'; readonly acc: number; readonly since: number }
export const IDLE: Timer = Object.freeze({ state: 'idle', acc: 0, since: null })

export const elapsed = (t: Timer, now: number) => t.acc + (t.state === 'running' ? Math.max(0, now - t.since) : 0)
export const start = (t: Timer, now: number): Timer => (t.state === 'running' ? t : { state: 'running', acc: t.acc, since: now })
export const pause = (t: Timer, now: number): Timer => (t.state === 'running' ? { state: 'paused', acc: elapsed(t, now), since: null } : t)
export const toggle = (t: Timer, now: number): Timer => (t.state === 'running' ? pause(t, now) : start(t, now))

// Deck(duration="…") → ms, or null when it is none of these (or not above zero):
//   a number of minutes   90, "90", "7.5"
//   units                 "45m", "45min", "1h30m", "1h 30m", "1h30" (minutes after h), "90s"
//   a clock, as shown     "45:00" (m:ss), "1:30:00" (h:mm:ss); so "1:30" is 1 min 30 s
const UNITS = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?\s*(?:(\d+)\s*s)?$/
const HOURS_MINUTES = /^(\d+)\s*h\s*(\d+)$/
const CLOCK = /^(\d+)(?::([0-5]\d))?:([0-5]\d)$/
export function parseDuration(v: unknown): number | null {
  const s = typeof v === 'number' ? null : String(v ?? '').trim().toLowerCase()
  let ms: number | null = null
  let m
  if (s == null) ms = (v as number) * 60000
  else if (/^\d+(\.\d+)?$/.test(s)) ms = Number(s) * 60000
  else if ((m = s.match(CLOCK))) {
    const [h, min] = m[2] == null ? [0, m[1]] : [m[1], m[2]]
    ms = ((Number(h) * 60 + Number(min)) * 60 + Number(m[3])) * 1000
  } else if ((m = s.match(HOURS_MINUTES))) ms = (Number(m[1]) * 60 + Number(m[2])) * 60000
  else if ((m = s.match(UNITS)) && (m[1] || m[2] || m[3])) {
    ms = ((Number(m[1] || 0) * 60 + Number(m[2] || 0)) * 60 + Number(m[3] || 0)) * 1000
  }
  // NaN, Infinity (a number, or digits too long for one) and zero are no length
  return ms != null && Number.isFinite(ms) && ms > 0 ? ms : null
}

// A talk's length worth counting down: from 1 minute to 24 hours, both included. The presenter's
// field takes nothing else; a deck's duration out of them still counts (it only warns).
export const MIN_DURATION = 60000
export const MAX_DURATION = 24 * 3600000
export const withinBounds = (ms: number) => ms >= MIN_DURATION && ms <= MAX_DURATION

// How the time left looks: 'over' past the duration; 'low' in the last 10 % of it, but never
// earlier than 5 minutes before the end; 'ok' otherwise.
export function phase(left: number, duration: number): 'over' | 'low' | 'ok' {
  if (left < 0) return 'over'
  return left <= Math.min(duration * 0.1, 5 * 60000) ? 'low' : 'ok'
}

// 75000 → "1:15"; 3725000 → "1:02:05". Whole seconds, rounded down (the absolute value).
export function clock(ms: number) {
  const t = Math.floor(Math.abs(ms) / 1000)
  const h = Math.floor(t / 3600)
  const m = Math.floor(t / 60) % 60
  const s = String(t % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

// ---- the state: one timer per Deck ----------------------------------------------------------

// The talk's timer and its length, one per Deck, kept by every window of the deck (useDeckSync
// shares the timer and the length the presenter set).
//   const timer = createTimer({ duration, warn })   in createDeck: duration, the deck's duration
//                                                    prop (a getter, ref or value); warn: false
//                                                    in a thumbnail (it says nothing of the
//                                                    prop). Provides the controls (useTimer) and
//                                                    returns them with the internals the sync needs
//   useTimer()                                       the controls, for the presenter view's bar
// The length is the deck's (its duration prop, in ms, or null; a value that is no length warns,
// and so does one outside 1 min – 24 h, which still counts; once per value) unless the
// presenter set another: override, in ms, or null. setDuration(ms) sets it; null, or the deck's
// own value, goes back to the deck's (no override left).
// An override wins until it is reset, even over a new duration prop (an edit of the deck, HMR).
// One equal to the deck's value is dropped, as setting the deck's own value would be: when an
// edit of the deck reaches it, or when a window an edit remounted takes it back from
// sessionStorage (the drop is a change like any other: the other windows follow).
// The controls (useTimer), a frozen object:
//   timer               read-only ref of the timer (below): { state, acc, since }
//   duration            the length in effect, in ms, or null: the presenter's, else the deck's
//   deckDuration        the deck's own (its duration prop), in ms, or null
//   setDuration(ms)     sets the presenter's length; null goes back to the deck's
//   start(), pause(), toggle(), reset()   start (or resume), pause, either, back to idle
// Internals (on what createTimer returns, for useDeckSync): setTimer(t), which replaces the
// timer as another window sends it; override, setOverride(ms), the presenter's length as sent.
export interface TimerControls {
  readonly timer: Readonly<Ref<DeepReadonly<Timer>>>
  readonly duration: ComputedRef<number | null>
  readonly deckDuration: ComputedRef<number | null>
  setDuration(ms: number | null): void
  start(): void
  pause(): void
  toggle(): void
  reset(): void
}
const KEY: InjectionKey<TimerControls> = Symbol('arao-timer')

export function createTimer({ duration: prop, warn = true }: { duration: MaybeRefOrGetter<string | number | null | undefined>; warn?: boolean }) {
  const timer = shallowRef<Timer>(IDLE)
  const setTimer = (t: Timer) => { timer.value = t }
  const deckDuration = computed(() => parseDuration(toValue(prop)))
  const override = shallowRef<number | null>(null)
  // anything but a length (a value kept by another version, say) is no override
  const setOverride = (ms: unknown) => { override.value = typeof ms === 'number' && Number.isFinite(ms) && ms > 0 ? ms : null }
  const setDuration = (ms: number | null) => setOverride(ms === deckDuration.value ? null : ms)
  const duration = computed(() => override.value ?? deckDuration.value)
  // (said where the deck is shown, not by each thumbnail of it)
  if (warn) {
    watch(() => toValue(prop), (v) => {
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

  const controls: TimerControls = Object.freeze({
    timer: readonly(timer),
    duration,
    deckDuration,
    setDuration,
    start: () => setTimer(start(timer.value, Date.now())),
    pause: () => setTimer(pause(timer.value, Date.now())),
    toggle: () => setTimer(toggle(timer.value, Date.now())),
    reset: () => setTimer(IDLE),
  })
  provide(KEY, controls)
  return { ...controls, timer, setTimer, override, setOverride }
}

export function useTimer(): TimerControls {
  const timer = inject(KEY, null)
  if (!timer) throw new Error('[arao] useTimer() must be used inside <Deck>')
  return timer
}
