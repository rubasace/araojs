// The deck's key map: which key runs which command. Pure: no DOM, no Vue.
// A map is key → command. The engine's defaults (DEFAULT_SHORTCUTS) and the project's file
// (src/shortcuts.ts or .js, through the Vite plugin) are merged with a spread, the project's last:
//   a key the defaults have, set to another command    remaps it
//   a key the defaults have, set to null (or '')       turns it off: the key is the browser's again
//   a key the defaults lack                            adds it
// Several keys may run one command. Entries left with no command are dropped from the built map,
// so a lookup finds only live keys.
// A key is written as KeyboardEvent.key ('g', 'ArrowRight', 'MediaTrackNext') or as
// KeyboardEvent.code ('KeyG', 'Numpad6'): a press is looked up by its code first, then by its key.
// A single letter matches both cases (g and G, with Shift or Caps Lock); 'Space' stands for ' '.
// Reserved, never in the map: Escape (closes whatever is open) and the digits 0-9 (typing a slide
// number, composables/useSlideNumber.ts), by key or by code (Digit0-9, Numpad0-9). A project that
// maps one fails when the deck starts, as does one that names no command there is (TypeScript
// already refuses both in a file written with defineShortcuts).
export const COMMANDS = ['next', 'prev', 'first', 'last', 'theme', 'fullscreen', 'presenter', 'menu'] as const
export type Command = (typeof COMMANDS)[number]

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
// keys a project cannot map (written as a key or as a code)
export type ReservedKey = 'Escape' | Digit | `Digit${Digit}` | `Numpad${Digit}`
// what a project's file holds: key → command, or null to turn a key off
export type ShortcutMap = { [key: string]: Command | null | undefined } & { [K in ReservedKey]?: never }

// The engine's keys
export const DEFAULT_SHORTCUTS: Readonly<Record<string, Command>> = Object.freeze({
  ArrowRight: 'next', ArrowDown: 'next', PageDown: 'next', ' ': 'next', Enter: 'next',
  ArrowLeft: 'prev', ArrowUp: 'prev', PageUp: 'prev', Backspace: 'prev',
  Home: 'first', End: 'last',
  t: 'theme', f: 'fullscreen', p: 'presenter', g: 'menu',
})

// For a project's src/shortcuts.ts: types the map (commands, reserved keys) and returns it as is.
export function defineShortcuts<const T extends ShortcutMap>(map: T): T {
  return map
}

const DIGITS = '0123456789'.split('')
const RESERVED = new Set(['Escape', ...DIGITS, ...DIGITS.map((d) => `Digit${d}`), ...DIGITS.map((d) => `Numpad${d}`)])
export const isReserved = (key: string) => RESERVED.has(key)

// how a key is written in the map: 'Space' → ' ', a single letter → lower case
export function normalizeKey(key: string): string {
  if (key === 'Space') return ' '
  return key.length === 1 ? key.toLowerCase() : key
}

const isCommand = (v: unknown): v is Command => (COMMANDS as readonly unknown[]).includes(v)

// The map in effect: the defaults, then the project's entries. Throws on a reserved key or a value
// that is no command (with the list of commands), so a mistake shows when the deck starts.
export function buildShortcuts(project: Record<string, unknown> = {}): ReadonlyMap<string, Command> {
  const merged: Record<string, unknown> = { ...DEFAULT_SHORTCUTS }
  for (const [raw, command] of Object.entries(project ?? {})) {
    const key = normalizeKey(raw)
    if (isReserved(key)) {
      throw new Error(`[arao] shortcuts: "${raw}" is reserved (Escape closes what is open; the digits type a slide number) and cannot be mapped`)
    }
    if (command != null && command !== '' && !isCommand(command)) {
      throw new Error(`[arao] shortcuts: "${raw}" → ${JSON.stringify(command)} is no command (there are: ${COMMANDS.join(', ')}; null turns a key off)`)
    }
    merged[key] = command
  }
  const map = new Map<string, Command>()
  for (const [key, command] of Object.entries(merged)) {
    if (isCommand(command)) map.set(key, command)
  }
  return map
}

// The command a press runs, or null: its code first, then its key
export function commandFor(map: ReadonlyMap<string, Command>, e: Pick<KeyboardEvent, 'key' | 'code'>): Command | null {
  return (e.code && map.get(e.code)) || map.get(normalizeKey(e.key)) || null
}
