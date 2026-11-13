// The rules of the deck's key map, pure (no DOM, no Vue, no Node): one source for the Vite plugin,
// which checks and builds the map when it starts (vite/shortcuts.js), and for the engine, which
// reads presses against it (src/core/shortcuts.ts).
// A map is key → command. The engine's defaults (DEFAULT_SHORTCUTS) and the project's file
// (src/shortcuts.ts or .js) are merged key by key, the project's last:
//   a key the defaults have, set to another command    remaps it
//   a key the defaults have, set to null (or '')       turns it off: the key is the browser's again
//   a key the defaults lack                            adds it
// Several keys may run one command. Entries left with no command are dropped from the built map.
// A key is written as KeyboardEvent.key ('g', 'ArrowRight', 'MediaTrackNext') or as
// KeyboardEvent.code ('KeyG', 'NumpadAdd'): a press is looked up by its code first, then by its
// key. A single letter matches both cases (g and G); 'Space' stands for ' '.
// Reserved, never in the map: Escape (closes whatever is open) and the digits 0-9 (typing a slide
// number), by key or by code (Digit0-9, Numpad0-9). A reserved key, a value that is no command, or
// two spellings of one key ('Space' and ' ', 'G' and 'g') are errors.

export const COMMANDS = /** @type {const} */ (['next', 'prev', 'first', 'last', 'theme', 'fullscreen', 'presenter', 'menu'])

/** @typedef {(typeof COMMANDS)[number]} Command */

/** @type {Readonly<Record<string, Command>>} */
export const DEFAULT_SHORTCUTS = Object.freeze({
  ArrowRight: 'next', ArrowDown: 'next', PageDown: 'next', ' ': 'next', Enter: 'next',
  ArrowLeft: 'prev', ArrowUp: 'prev', PageUp: 'prev', Backspace: 'prev',
  Home: 'first', End: 'last',
  t: 'theme', f: 'fullscreen', p: 'presenter', g: 'menu',
})

const DIGITS = '0123456789'.split('')
const RESERVED = new Set(['Escape', ...DIGITS, ...DIGITS.map((d) => `Digit${d}`), ...DIGITS.map((d) => `Numpad${d}`)])

/** @param {string} key */
export const isReserved = (key) => RESERVED.has(key)

/**
 * How a key is written in the map: 'Space' → ' ', a single letter → lower case.
 * @param {string} key
 */
export function normalizeKey(key) {
  if (key === 'Space') return ' '
  return key.length === 1 ? key.toLowerCase() : key
}

/**
 * @param {unknown} v
 * @returns {v is Command}
 */
export const isCommand = (v) => /** @type {readonly unknown[]} */ (COMMANDS).includes(v)

/**
 * The map in effect: the defaults, then the project's entries, as a plain object (key → command).
 * Throws (its message naming `where`) on a reserved key, a value that is no command, or two
 * spellings of one key.
 * @param {unknown} project the project file's default export (an object), or undefined
 * @param {string} [where] how to name the file in an error
 * @returns {Record<string, Command>}
 */
export function buildShortcuts(project, where = 'shortcuts') {
  if (project != null && (typeof project !== 'object' || Array.isArray(project))) {
    throw new Error(`[arao] ${where}: the default export must be an object (key → command), got ${Array.isArray(project) ? 'an array' : typeof project}`)
  }
  /** @type {Record<string, unknown>} */
  const merged = { ...DEFAULT_SHORTCUTS }
  /** @type {Map<string, string>} */
  const spelled = new Map()
  for (const [raw, command] of Object.entries(project ?? {})) {
    const key = normalizeKey(raw)
    if (isReserved(key)) {
      throw new Error(`[arao] ${where}: "${raw}" is reserved (Escape closes what is open; the digits type a slide number) and cannot be mapped`)
    }
    if (spelled.has(key)) {
      throw new Error(`[arao] ${where}: "${spelled.get(key)}" and "${raw}" are the same key; write it once`)
    }
    spelled.set(key, raw)
    if (command != null && command !== '' && !isCommand(command)) {
      throw new Error(`[arao] ${where}: "${raw}" → ${JSON.stringify(command)} is no command (there are: ${COMMANDS.join(', ')}; null turns a key off)`)
    }
    merged[key] = command
  }
  /** @type {Record<string, Command>} */
  const map = {}
  for (const [key, command] of Object.entries(merged)) {
    if (isCommand(command)) map[key] = command
  }
  return map
}
