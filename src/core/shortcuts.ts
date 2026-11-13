// The deck's key map, as the engine reads it: the commands, the type of a project's shortcuts file,
// and which command a press runs. The rules (defaults, reserved keys, merging, errors) are
// vite/shortcut-rules.js: the Vite plugin checks the project's src/shortcuts.ts or .js with them
// when it starts and hands the engine the built map (virtual:arao/shortcuts), so a mistake in the
// file fails `vite`, `vite build` and `arao export`, not the talk.
import { COMMANDS, normalizeKey } from '../../vite/shortcut-rules.js'

export { COMMANDS }
export type Command = (typeof COMMANDS)[number]

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
// keys a project cannot map (written as a key or as a code)
export type ReservedKey = 'Escape' | Digit | `Digit${Digit}` | `Numpad${Digit}`
// what a project's file holds: key → command, or null to turn a key off
export type ShortcutMap = { [key: string]: Command | null | undefined } & { [K in ReservedKey]?: never }

// For a project's src/shortcuts.ts: types the map (commands, reserved keys) and returns it as is.
//   export default defineShortcuts({ MediaTrackNext: 'next', t: null })
export function defineShortcuts<const T extends ShortcutMap>(map: T): T {
  return map
}

// The command a press runs, or null: its code first, then its key
export function commandFor(map: Readonly<Record<string, Command>>, e: Pick<KeyboardEvent, 'key' | 'code'>): Command | null {
  return (e.code && Object.hasOwn(map, e.code) ? map[e.code] : null) ?? (Object.hasOwn(map, normalizeKey(e.key)) ? map[normalizeKey(e.key)] : null)
}
