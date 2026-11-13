// The engine's own UI text (controls, presenter view, list of decks, notes pages…) in the reader's
// language: the first of the browser's languages (navigator.languages, in its order of
// preference) that has a catalogue here, else English. Read once, when the engine loads; there is
// no option and no switcher. What a deck says is its author's, never translated.
//   t(key, ...values)   the message: a catalogue's string, or its function called with the values
//   lang                the language the messages are in (a BCP 47 tag), for the lang attribute
// One catalogue per language, each with every key of en.ts (the library build checks it:
// vite.config.js). A language is matched by its own subtag (es-MX → es); Chinese by its script:
// zh, zh-CN, zh-SG and zh-Hans are zh-Hans, while zh-TW and zh-Hant, which have no catalogue, go
// on to the next language of the list.
import en, { type Catalogue } from './en'
import es from './es'
import de from './de'
import fr from './fr'
import it from './it'
import pl from './pl'
import ja from './ja'
import zhHans from './zh-Hans'

export const catalogues: Record<string, Catalogue> = { en, es, de, fr, it, pl, ja, 'zh-Hans': zhHans }
export type MessageKey = keyof Catalogue
// the values a message takes: none for a string, a function's parameters otherwise
type Values<K extends MessageKey> = Catalogue[K] extends (...a: infer P) => string ? P : []

// the first tag of the list with a catalogue, else 'en'
export function pickLanguage(tags: readonly string[]) {
  for (const tag of tags) {
    let locale
    try {
      locale = new Intl.Locale(tag).maximize()
    } catch {
      continue // not a language tag
    }
    const { language, script } = locale
    if (language === 'zh') {
      if (script === 'Hans') return 'zh-Hans'
    } else if (Object.hasOwn(catalogues, language)) return language
  }
  return 'en'
}

const browser = typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language].filter(Boolean)
export const lang = pickLanguage(browser)
const messages = catalogues[lang]

export function t<K extends MessageKey>(key: K, ...values: Values<K>): string {
  const message: string | ((...a: never[]) => string) | undefined = messages[key] ?? en[key]
  if (message == null) return key
  return typeof message === 'function' ? (message as (...a: Values<K>) => string)(...values) : message
}
