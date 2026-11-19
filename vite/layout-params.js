// A layout's parameters: the attributes Slide takes for it. A layout is a CSS file (the package's
// layouts/, the project's src/layouts); its parameters are the public tokens of its own that the
// file declares or reads, --ar-layout-<name>-<thing> (outside its comments; the private --_ar-…
// are not), each one an attribute of Slide(layout="<name>") named <thing>, whose value the slide
// sets as that token, verbatim, in its own style:
//   Slide(layout="image-right" columns="2fr 1fr")   →   --ar-layout-image-right-columns: 2fr 1fr
// This file alone says what a parameter is. Slide (src/components/Slide.vue) sets them from the
// Vite plugin's virtual:arao/layout-tokens (index.js); the types say which attributes each layout
// takes: the library's are built into its types (scripts/layout-types.mjs, checked again by
// scripts/bundle-types.mjs), the project's go in the declaration file the plugin writes
// (src/arao-layouts.d.ts).
// A <thing> is no attribute when it is not written in lower case, kebab-case (letters, digits and
// -, a letter first: an attribute's name in any template, and one Vue turns into camelCase and
// back the same), or when an attribute of that name already means something on a slide
// (notAnAttribute): the token still works, set in style or a theme, and the plugin says so.

// Attribute names a slide already has a meaning for: HTML's global attributes (and ARIA's role),
// Vue's own (key, ref, is) and Slide's prop; and, by how they start, event handlers (on…, which
// Vue also reads as listeners), data-… and aria-… attributes, and Vue's directives (v-…)
const HTML = ['accesskey', 'autocapitalize', 'autocorrect', 'autofocus', 'class', 'contenteditable', 'dir', 'draggable',
  'enterkeyhint', 'exportparts', 'hidden', 'id', 'inert', 'inputmode', 'is', 'itemid', 'itemprop', 'itemref', 'itemscope',
  'itemtype', 'lang', 'nonce', 'part', 'popover', 'role', 'slot', 'spellcheck', 'style', 'tabindex', 'title', 'translate',
  'writingsuggestions']
/** @type {[RegExp, string][]} */
const RESERVED = [
  [new RegExp(`^(?:${HTML.join('|')})$`), 'an HTML attribute already'],
  [/^(?:key|ref)$/, "Vue's"],
  [/^layout$/, "Slide's own prop"],
  [/^on/, 'an event handler (on…)'],
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
 * A layout's tokens, --ar-layout-<name>-<thing>, that its CSS declares or reads: its parameters
 * (the things that are attributes) and the things that are not, each with why; sorted, once each.
 * @param {string} css
 * @param {string} name
 * @returns {{ params: string[], skipped: { thing: string, why: string }[] }}
 */
export function layoutParams(css, name) {
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '')
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

/**
 * A layout's parameters as an object type: one optional string member per parameter, under its
 * camelCase name (Volar checks an attribute written footer-bg as footerBg, as it does any prop's),
 * the token it sets as its doc; {} for none. indent: the line's indent where the type starts.
 * @param {string} name
 * @param {string[]} params
 * @param {string} indent
 */
export function paramsType(name, params, indent) {
  if (!params.length) return '{}'
  return `{\n${params.map((t) => `${indent}  /** --ar-layout-${name}-${t} */\n${indent}  ${camelize(t)}?: string\n`).join('')}${indent}}`
}
