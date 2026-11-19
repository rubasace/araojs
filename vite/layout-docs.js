// What a layout is, read from its CSS file: what it says of itself (its doc block, below), its
// parameters (the tokens it reads: layout-params.js) and its zones; and that, as the TypeScript
// Slide is typed with (the library's layouts: scripts/layout-types.mjs; the project's: the
// declaration file the Vite plugin writes) and as the arao layouts command prints it.
//
// The doc block: a /** … */ comment the file starts with (white space and ordinary /* … */
// comments before it aside, a licence header say; /*** … and /**/ are ordinary), each line written
// after a * as in JSDoc:
//   /**
//    * One line: what the layout is for.
//    * Optional longer description lines.
//    * @example
//    * Slide(layout="image-right")
//    *   h2 Title
//    *   template(#image)
//    *     Img(file="photo.jpg")
//    * @zone image  the picture's side, full height
//    * @param columns  the two sides' widths, as CSS grid columns (default 1fr 1fr)
//    */
//   - the lines before the first tag: the first is the summary, the rest the description (as
//     written: their line breaks kept, their common indent removed);
//   - @example: the Pug of a slide of the layout, on the lines after it, as written (its common
//     indent removed); a second @example is added to the first, after a blank line. Inside it, a
//     line is a tag only if it is one of the three, not indented: a Pug line starting with @ is
//     the example's;
//   - @zone <name> <description>: a named template the layout places, template(#<name>); its
//     description goes on until the next tag;
//   - @param <thing> <description>: describes the parameter <thing>, the token
//     --ar-layout-<name>-<thing>. The parameters are the tokens the CSS reads, whatever the block
//     says: @param only describes one, and one naming no token is a problem.
// A file with no doc block is a layout all the same, with nothing said of it.
// Its zones: those its @zone tags name, in their order, then any other its CSS styles,
// .ar-zone-<name> (in its code: not in a comment or a string), by name: in a selector that names
// its layout, .layout-<name>, or no layout at all (.layout-split .ar-zone-caption in cards.css is
// split's, not cards'). default and title are every slide's slots (the content and the header), no
// zone's.
// What a block gets wrong (an unknown tag, a zone named twice, a @param naming no token…) is a
// problem, and so is a /** … */ comment that is not the doc block (after code, or after the doc
// block): the plugin warns about a project's, the build of the library stops on its own.
import { camelize, cssCode, layoutParams, scanCss } from './layout-params.js'

/**
 * @typedef {{ name: string, description: string }} ZoneDoc
 * @typedef {{ thing: string, description: string }} ParamDoc
 * @typedef {{ summary: string, description: string, example: string, zones: ZoneDoc[],
 *   params: ParamDoc[], problems: string[] }} DocBlock
 * What a layout is: whether its file has a doc block (documented), what that says, its zones, its
 * parameters (the attributes) each with its description, the tokens of its own that are no
 * attribute (skipped, layout-params.js), and the problems of its doc block.
 * @typedef {{ name: string, documented: boolean, summary: string, description: string,
 *   example: string, zones: ZoneDoc[], params: ParamDoc[],
 *   skipped: { thing: string, why: string, description: string }[], problems: string[] }} LayoutInfo
 */

const TAGS = ['example', 'zone', 'param']
// a zone's name: a slot's, and a class's, ar-zone-<name>
const ZONE = /^[A-Za-z_][\w-]*$/
// the slots every slide has, which are no zone (Slide.vue)
const SLOTS = ['default', 'title']

/**
 * The default layout: a Slide without one (Slide.vue's own CSS: no file), described here.
 * @type {LayoutInfo}
 */
export const DEFAULT_LAYOUT = {
  name: 'default',
  documented: true,
  summary: 'A content slide: the layout of a Slide without one.',
  description: [
    'Its title (the h1 or h2 its content starts with) in the header, then the body under it,',
    "filling the rest of the slide, from the top; the deck's footer shown. A layout's name with no",
    'CSS behind it is this layout too.',
  ].join('\n'),
  example: ['Slide', '  h2 Three pillars', '  ul', '    li Fast', '    li Simple'].join('\n'),
  zones: [],
  params: [],
  skipped: [],
  problems: [],
}

/**
 * Lines without the indent they all have (blank lines aside), and without blank lines at either
 * end.
 * @param {string[]} lines
 */
function dedent(lines) {
  let from = 0
  let to = lines.length
  while (from < to && !lines[from].trim()) from++
  while (to > from && !lines[to - 1].trim()) to--
  const kept = lines.slice(from, to).map((l) => l.replace(/\s+$/, ''))
  const indent = Math.min(...kept.filter((l) => l).map((l) => l.match(/^\s*/)?.[0].length ?? 0))
  return kept.map((l) => l.slice(Number.isFinite(indent) ? indent : 0))
}

// a doc comment: /** and then neither * nor / (/*** … and /**/ are ordinary comments)
const DOC_COMMENT = /^\/\*\*(?![*/])/
// a tag inside @example: one of the three, not indented (a Pug line may start with @)
const EXAMPLE_TAG = new RegExp(`^@(${TAGS.join('|')})(?:\\s+(.*))?$`)
// a tag anywhere else: any, so that one that is none is said
const ANY_TAG = /^\s*@([\w-]+)(?:\s+(.*))?$/

/**
 * A layout's CSS's doc comments: the doc block (the text between the /** and the end of the first
 * one, when only white space and ordinary comments come before it, and it is closed), and the line
 * of every other one, which is not read.
 * @param {string} css
 * @returns {{ block: string | null, stray: number[] }}
 */
function docComments(css) {
  /** @type {string | null} */
  let block = null
  /** @type {number[]} */
  const stray = []
  let clear = true // nothing but white space (a BOM too: trim takes it) and ordinary comments yet
  let at = 0
  for (const { start, end } of scanCss(css).comments) {
    if (css.slice(at, start).trim()) clear = false
    at = end
    const text = css.slice(start, end)
    if (!DOC_COMMENT.test(text)) continue
    if (clear && block == null && text.endsWith('*/')) block = text.slice(3, -2)
    else stray.push(css.slice(0, start).split('\n').length)
  }
  return { block, stray }
}

/**
 * A doc block's text read (see the top).
 * @param {string} block
 * @returns {DocBlock}
 */
function readDoc(block) {
  // each line without what starts it: white space, a *, and one space or tab after it
  const lines = block.split(/\r?\n/).map((l) => l.replace(/^\s*\*(?:[ \t]|$)/, ''))
  /** @type {{ tag: string | null, first: string, lines: string[] }[]} */
  const sections = [{ tag: null, first: '', lines: [] }]
  for (const line of lines) {
    const tag = line.match(sections[sections.length - 1].tag === 'example' ? EXAMPLE_TAG : ANY_TAG)
    if (tag) sections.push({ tag: tag[1], first: tag[2] ?? '', lines: [] })
    else sections[sections.length - 1].lines.push(line)
  }
  /** @type {DocBlock} */
  const doc = { summary: '', description: '', example: '', zones: [], params: [], problems: [] }
  const [text, ...tagged] = sections
  // the first line of the block (the one after /**, when it has text) is no indent to keep
  const said = dedent([text.lines[0]?.trim() ?? '', ...text.lines.slice(1)])
  if (said.length) {
    doc.summary = said[0].trim()
    doc.description = dedent(said.slice(1)).join('\n')
  } else doc.problems.push('its doc block has no line saying what the layout is for (the first line, before any tag)')
  for (const { tag, first, lines: rest } of tagged) {
    if (tag === 'example') {
      const example = dedent(first.trim() ? [first, ...rest] : rest).join('\n')
      doc.example = doc.example && example ? `${doc.example}\n\n${example}` : doc.example || example
      continue
    }
    if (tag !== 'zone' && tag !== 'param') {
      doc.problems.push(`@${tag} is no tag of a layout's doc block (${TAGS.map((t) => `@${t}`).join(', ')})`)
      continue
    }
    const [, name = '', head = ''] = first.match(/^(\S*)\s*(.*)$/) ?? []
    const description = [head, ...rest].map((l) => l.trim()).filter(Boolean).join(' ')
    if (!name) {
      doc.problems.push(`@${tag} with no name: @${tag} <${tag === 'zone' ? 'name' : 'thing'}> <description>`)
    } else if (tag === 'zone') {
      if (!ZONE.test(name)) doc.problems.push(`@zone ${name}: a zone's name is letters, digits, - and _, a letter or _ first`)
      else if (SLOTS.includes(name)) doc.problems.push(`@zone ${name}: ${SLOTS.join(' and ')} are every slide's slots, no zone`)
      else if (doc.zones.some((z) => z.name === name)) doc.problems.push(`@zone ${name} is in the doc block twice`)
      else doc.zones.push({ name, description })
    } else if (doc.params.some((p) => p.thing === name)) doc.problems.push(`@param ${name} is in the doc block twice`)
    else doc.params.push({ thing: name, description })
  }
  return doc
}

/**
 * The doc block a layout's CSS starts with, read; null when it starts with none.
 * @param {string} css
 * @returns {DocBlock | null}
 */
export function docBlock(css) {
  const { block } = docComments(css)
  return block == null ? null : readDoc(block)
}

/**
 * A selector list's selectors: split at its commas outside parentheses (:is(.a, .b) is one).
 * @param {string} list
 */
function selectors(list) {
  const out = []
  let depth = 0
  let from = 0
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++
    else if (list[i] === ')') depth = Math.max(0, depth - 1)
    else if (list[i] === ',' && !depth) {
      out.push(list.slice(from, i))
      from = i + 1
    }
  }
  return [...out, list.slice(from)]
}

/**
 * The zones a layout's CSS styles: each .ar-zone-<name> in a selector of its code that names the
 * layout (.layout-<name>) or no layout at all, by name (default and title aside: no zones).
 * @param {string} css
 * @param {string} name the layout's
 */
export function cssZones(css, name) {
  const own = new RegExp(`\\.layout-${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`)
  /** @type {Set<string>} */
  const zones = new Set()
  // a rule's selector list: what comes before its {, from the }, { or ; before that
  for (const [, list] of cssCode(css).matchAll(/([^{};]*)\{/g)) {
    for (const selector of selectors(list)) {
      if (/\.layout-[\w-]/.test(selector) && !own.test(selector)) continue
      for (const m of selector.matchAll(/\.ar-zone-([A-Za-z_][\w-]*)/g)) if (!SLOTS.includes(m[1])) zones.add(m[1])
    }
  }
  return [...zones].sort()
}

/**
 * What a layout is, from its CSS file's text (see the top).
 * @param {string} css
 * @param {string} name
 * @returns {LayoutInfo}
 */
export function describeLayout(css, name) {
  const { params, skipped } = layoutParams(css, name)
  const { block, stray } = docComments(css)
  const doc = block == null ? null : readDoc(block)
  const problems = [...(doc?.problems ?? [])]
  const described = new Map((doc?.params ?? []).map((p) => [p.thing, p.description]))
  for (const thing of described.keys()) {
    if (!params.includes(thing) && !skipped.some((s) => s.thing === thing))
      problems.push(`@param ${thing} names no token of the layout: its CSS reads no --ar-layout-${name}-${thing}${params.length ? ` (its parameters: ${params.join(', ')})` : ''}`)
  }
  for (const line of stray)
    problems.push(`the /** comment at line ${line} is not its doc block, and is not read: the doc block is the first one, before any code (only white space and plain /* comments before it)`)
  const zones = [...(doc?.zones ?? [])]
  for (const z of cssZones(css, name)) if (!zones.some((d) => d.name === z)) zones.push({ name: z, description: '' })
  return {
    name,
    documented: !!doc,
    summary: doc?.summary ?? '',
    description: doc?.description ?? '',
    example: doc?.example ?? '',
    zones,
    params: params.map((thing) => ({ thing, description: described.get(thing) ?? '' })),
    skipped: skipped.map((s) => ({ ...s, description: described.get(s.thing) ?? '' })),
    problems,
  }
}

// ---- as TypeScript --------------------------------------------------------------------------

// a member's name, quoted unless it is an identifier; a layout's, always (a layout's name has no
// quote in it: letters, digits, - and _)
/** @param {string} name */
const key = (name) => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : `'${name}'`)
/** @param {string} name */
const layoutKey = (name) => `'${name}'`

/**
 * A JSDoc comment of these lines (the end of a comment in them escaped), at an indent; nothing
 * for none.
 * @param {string[]} lines
 * @param {string} indent
 */
function jsdoc(lines, indent) {
  const safe = dedent(lines).map((l) => l.replace(/\*\//g, '*\\/'))
  if (!safe.length) return ''
  if (safe.length === 1) return `${indent}/** ${safe[0]} */\n`
  return `${indent}/**\n${safe.map((l) => `${indent} *${l ? ` ${l}` : ''}\n`).join('')}${indent} */\n`
}

/**
 * A text as lines of at most width characters (but a word longer than that), the lines after the
 * first one indented by hang.
 * @param {string} text
 * @param {number} width
 * @param {string} [hang]
 */
export function wrap(text, width, hang = '') {
  const lines = ['']
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const line = lines[lines.length - 1]
    if (line.trim() && line.length + 1 + word.length > width) lines.push(`${hang}${word}`)
    else lines[lines.length - 1] = line ? `${line} ${word}` : word
  }
  return lines
}

// the width of a doc comment's lines (as the source's), less its indent
const DOC_WIDTH = 92

/**
 * What a layout's doc comment says (in TypeScript, on its entry and on its layout member, which an
 * editor shows on hovering layout="…"): its summary and description, its zones and its parameters
 * each with its description, and its example, as Pug.
 * @param {LayoutInfo} info
 */
function layoutDoc(info) {
  const lines = []
  if (info.summary) lines.push(info.summary)
  if (info.description) lines.push('', ...info.description.split('\n'))
  const item = (/** @type {string} */ name, /** @type {string} */ description) =>
    wrap(`- \`${name}\`${description ? `: ${description}` : ''}`, DOC_WIDTH, '  ')
  if (info.zones.length) lines.push('', 'Zones (named templates):', ...info.zones.flatMap((z) => item(`#${z.name}`, z.description)))
  if (info.params.length) lines.push('', 'Parameters (attributes):', ...info.params.flatMap((p) => item(p.thing, p.description)))
  if (info.example) lines.push('', '@example', '```pug', ...info.example.split('\n'), '```')
  return lines
}

/**
 * A layout's entry in an interface of layouts (LibraryLayouts, ProjectLayouts): its name, its doc
 * comment, and its members: layout, its name, with the same doc comment (what an editor shows on
 * hovering layout="…" on a slide: a string has no doc of its own), and one optional string per
 * parameter, under its camelCase name (Volar checks an attribute written footer-bg as footerBg, as
 * it does any prop's), its description and its token as its doc. indent: the entry's.
 * @param {LayoutInfo} info
 * @param {string} indent
 */
export function layoutEntry(info, indent) {
  const doc = layoutDoc(info)
  const members = [
    `${jsdoc(doc, `${indent}  `)}${indent}  layout?: '${info.name}'\n`,
    ...info.params.map((p) => {
      const token = `--ar-layout-${info.name}-${p.thing}`
      return `${jsdoc(p.description ? [...wrap(p.description, DOC_WIDTH), '', `\`${token}\``] : [token], `${indent}  `)}${indent}  ${camelize(p.thing)}?: string\n`
    }),
  ]
  return `${jsdoc(doc, indent)}${indent}${layoutKey(info.name)}: {\n${members.join('')}${indent}}\n`
}

/**
 * A layout's entry in an interface of zones (LibraryLayoutZones, ProjectLayoutZones): one member
 * per zone, its description as its doc (Slide's types make each one a slot: what the member is
 * does not matter), or {} for none. indent: the entry's.
 * @param {LayoutInfo} info
 * @param {string} indent
 */
export function zonesEntry(info, indent) {
  if (!info.zones.length) return `${indent}${layoutKey(info.name)}: {}\n`
  const members = info.zones.map((z) => `${jsdoc(wrap(z.description, DOC_WIDTH).filter(Boolean), `${indent}  `)}${indent}  ${key(z.name)}: true\n`)
  return `${indent}${layoutKey(info.name)}: {\n${members.join('')}${indent}}\n`
}
