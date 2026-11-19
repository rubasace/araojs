// A layout's parameters: the attributes Slide takes for it. A layout is a CSS file (the package's
// layouts/, the project's src/layouts); its parameters are the public tokens of its own that the
// file declares or reads, --ar-layout-<name>-<thing> (in its code: not in a comment or a string;
// the private --_ar-… are not), each one an attribute of Slide(layout="<name>") named <thing>,
// whose value the slide sets as that token, verbatim, in its own style:
//   Slide(layout="image-right" columns="2fr 1fr")   →   --ar-layout-image-right-columns: 2fr 1fr
// A token is the file's layout's by its prefix alone: a layout named image whose file reads
// --ar-layout-image-right-columns has a parameter right-columns (image-right's own file is
// another layout's, with its own parameters).
// This file alone says what a parameter is. Slide (src/components/Slide.vue) sets them from the
// Vite plugin's virtual:arao/layout-tokens (index.js); the types say which attributes each layout
// takes (layout-docs.js writes them, with what the layout's doc block says of each): the library's
// are built into its types (scripts/layout-types.mjs; CI checks the committed file is what it
// writes), the project's go in the declaration file the plugin writes (src/arao-layouts.d.ts).
// A <thing> is no attribute when it is not written in lower case, kebab-case (letters, digits and
// -, a letter first: an attribute's name in any template, and one Vue turns into camelCase and
// back the same), or when an attribute of that name already means something on a slide
// (notAnAttribute): the token still works, set in style or a theme, and the plugin says so.

// Attribute names a slide already has a meaning for: HTML's global attributes (and ARIA's role),
// Vue's own (key, ref, is) and Slide's prop; and, by how they start, what Vue reads as a listener
// (on, or on followed by anything but a lower-case letter: on-…; onset and one-col are fine),
// data-… and aria-… attributes, and Vue's directives (v-…)
const HTML = ['accesskey', 'autocapitalize', 'autocorrect', 'autofocus', 'class', 'contenteditable', 'dir', 'draggable',
  'enterkeyhint', 'exportparts', 'hidden', 'id', 'inert', 'inputmode', 'is', 'itemid', 'itemprop', 'itemref', 'itemscope',
  'itemtype', 'lang', 'nonce', 'part', 'popover', 'role', 'slot', 'spellcheck', 'style', 'tabindex', 'title', 'translate',
  'writingsuggestions']
/** @type {[RegExp, string][]} */
const RESERVED = [
  [new RegExp(`^(?:${HTML.join('|')})$`), 'an HTML attribute already'],
  [/^(?:key|ref)$/, "Vue's"],
  [/^layout$/, "Slide's own prop"],
  [/^on(?![a-z])/, 'a listener to Vue (on, on-…)'],
  [/^(?:data|aria)-/, "the page's own (data-…, aria-…)"],
  [/^v-/, 'a Vue directive (v-…)'],
]
const THING = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

/**
 * Why a token's <thing> is no attribute of Slide, or null when it is one.
 * @param {string} thing
 * @returns {string | null}
 */
export function notAnAttribute(thing) {
  if (!THING.test(thing)) return `"${thing}" is not written in lower case, kebab-case (letters, digits and -, a letter first)`
  const hit = RESERVED.find(([re]) => re.test(thing))
  return hit ? `"${thing}" is ${hit[1]}` : null
}

/**
 * A stylesheet read in one pass: its code, with its comments and its strings ("…" or '…', escapes
 * included; one a line break ends unclosed, as CSS does) each turned into a space, so that a token
 * named in either is no token, and a /* in a string or a quote in a comment hides nothing; and its
 * comments, each where it starts and ends in the text (an unclosed one ends with it).
 * @param {string} css
 * @returns {{ code: string, comments: { start: number, end: number }[] }}
 */
export function scanCss(css) {
  let out = ''
  /** @type {{ start: number, end: number }[]} */
  const comments = []
  let i = 0
  while (i < css.length) {
    const c = css[i]
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      comments.push({ start: i, end: end < 0 ? css.length : end + 2 })
      i = end < 0 ? css.length : end + 2
      out += ' '
    } else if (c === '"' || c === "'") {
      let j = i + 1
      while (j < css.length && css[j] !== c && css[j] !== '\n') j += css[j] === '\\' ? 2 : 1
      i = j + 1
      out += ' '
    } else {
      out += c
      i++
    }
  }
  return { code: out, comments }
}

/**
 * A stylesheet's code: scanCss's, its comments and strings each a space.
 * @param {string} css
 */
export const cssCode = (css) => scanCss(css).code

/**
 * A layout's tokens, --ar-layout-<name>-<thing>, that its CSS declares or reads: its parameters
 * (the things that are attributes) and the things that are not, each with why; sorted, once each.
 * @param {string} css
 * @param {string} name
 * @returns {{ params: string[], skipped: { thing: string, why: string }[] }}
 */
export function layoutParams(css, name) {
  const code = cssCode(css)
  const token = new RegExp(`(?<![\\w-])--ar-layout-${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-([\\w-]+)`, 'g')
  const things = [...new Set([...code.matchAll(token)].map((m) => m[1]))].sort()
  /** @type {string[]} */
  const params = []
  /** @type {{ thing: string, why: string }[]} */
  const skipped = []
  for (const thing of things) {
    const why = notAnAttribute(thing)
    if (why) skipped.push({ thing, why })
    else params.push(thing)
  }
  return { params, skipped }
}

/**
 * A <thing> as Vue names a prop written <thing> in a template: camelCase (footer-bg → footerBg).
 * @param {string} thing
 */
export const camelize = (thing) => thing.replace(/-(\w)/g, (_, c) => c.toUpperCase())
