// The utility classes, as their stylesheet says them (src/styles/utilities.css): the classes a
// deck writes on an element of a slide, grouped, each with what it does. `arao layouts` prints
// them after the layouts (and lists them in its --json), so that an agent learns them where it
// learns the layouts; the library build checks the stylesheet against its own docs
// (vite.config.js).
//
// Every /** … */ comment of the file documents a group of classes (/*** … and /**/ are ordinary
// comments, as are /* … */ ones), each line written after a * as in JSDoc:
//   /**
//    * Placement: arrange a block's children.
//    * Optional longer description lines.
//    * @example
//    * .cols
//    *   p One
//    * @class cols    columns side by side, one per child
//    * @class cols-2  two equal columns, filled row by row
//    */
//   - the lines before the first tag: the first is "<Group>: <summary>", the group's name and what
//     its classes do; the rest the description (as written: their line breaks kept, their common
//     indent removed);
//   - @example: Pug, on the lines after it, as written (its common indent removed); a second
//     @example is added to the first, after a blank line. Inside it a line is a tag only if it is
//     @example or @class, not indented: a Pug line starting with @ is the example's;
//   - @class <name> <description>: a class of the group; its description goes on until the next
//     tag. A class may be in two groups (center: on a block, and on a Slide).
// The classes are the stylesheet's own: every class a rule of it names (in its selectors; but the
// engine's, ar-…) is documented in a group, and every documented one is named by a rule; what does
// not match is a problem, and so is what a group gets wrong (no summary, an unknown tag…).
import { scanCss, cssCode } from './layout-params.js'
import { dedent } from './layout-docs.js'

/**
 * @typedef {{ name: string, description: string }} ClassDoc
 * @typedef {{ name: string, summary: string, description: string, example: string,
 *   classes: ClassDoc[] }} ClassGroup
 */

const TAGS = ['example', 'class']
// a class's name, as CSS writes one (no escapes)
const CLASS = /^-?[A-Za-z_][\w-]*$/
// a doc comment: /** and then neither * nor / (/*** … and /**/ are ordinary comments)
const DOC_COMMENT = /^\/\*\*(?![*/])/
// a tag inside @example: one of the two, not indented (a Pug line may start with @)
const EXAMPLE_TAG = new RegExp(`^@(${TAGS.join('|')})(?:\\s+(.*))?$`)
// a tag anywhere else: any, so that one that is none is said
const ANY_TAG = /^\s*@([\w-]+)(?:\s+(.*))?$/
// the engine's own classes, which a utility rule may name (.ar-slide .cols): no utility class
const ENGINE = /^ar-/

/**
 * A group's doc comment read (see the top).
 * @param {string} text the comment, without its /** and its *\/
 * @returns {{ group: ClassGroup, problems: string[] }}
 */
function readGroup(text) {
  // each line without what starts it: white space, a *, and one space or tab after it
  const lines = text.split(/\r?\n/).map((l) => l.replace(/^\s*\*(?:[ \t]|$)/, ''))
  /** @type {{ tag: string | null, first: string, lines: string[] }[]} */
  const sections = [{ tag: null, first: '', lines: [] }]
  for (const line of lines) {
    const tag = line.match(sections[sections.length - 1].tag === 'example' ? EXAMPLE_TAG : ANY_TAG)
    if (tag) sections.push({ tag: tag[1], first: tag[2] ?? '', lines: [] })
    else sections[sections.length - 1].lines.push(line)
  }
  /** @type {ClassGroup} */
  const group = { name: '', summary: '', description: '', example: '', classes: [] }
  /** @type {string[]} */
  const problems = []
  const [said, ...tagged] = sections
  const prose = dedent([said.lines[0]?.trim() ?? '', ...said.lines.slice(1)])
  const head = prose[0]?.trim().match(/^([^:]+?):\s*(\S.*)$/)
  if (head) {
    group.name = head[1].trim()
    group.summary = head[2].trim()
    group.description = dedent(prose.slice(1)).join('\n')
  } else problems.push(`a group's doc comment starts with no line "<Group>: <what its classes do>"${prose[0] ? ` ("${prose[0].trim()}")` : ''}`)
  const where = group.name ? `${group.name}: ` : ''
  for (const { tag, first, lines: rest } of tagged) {
    if (tag === 'example') {
      const example = dedent(first.trim() ? [first, ...rest] : rest).join('\n')
      group.example = group.example && example ? `${group.example}\n\n${example}` : group.example || example
      continue
    }
    if (tag !== 'class') {
      problems.push(`${where}@${tag} is no tag of a class group's doc comment (${TAGS.map((t) => `@${t}`).join(', ')})`)
      continue
    }
    const [, name = '', text = ''] = first.match(/^(\S*)\s*(.*)$/) ?? []
    const description = [text, ...rest].map((l) => l.trim()).filter(Boolean).join(' ')
    if (!name) problems.push(`${where}@class with no name: @class <name> <description>`)
    else if (!CLASS.test(name)) problems.push(`${where}@class ${name}: a class's name is letters, digits, - and _`)
    else if (group.classes.some((c) => c.name === name)) problems.push(`${where}@class ${name} is in the group twice`)
    else group.classes.push({ name, description })
  }
  return { group, problems }
}

/**
 * The classes a stylesheet's rules name in their selectors, but the engine's own (ar-…).
 * @param {string} css
 */
function ruleClasses(css) {
  /** @type {Set<string>} */
  const names = new Set()
  // a rule's selector list: what comes before its {, from the }, { or ; before that (no nesting)
  for (const [, list] of cssCode(css).matchAll(/([^{};]*)\{/g)) {
    if (list.trim().startsWith('@')) continue // an at-rule's prelude (@property --ar-cols)
    for (const m of list.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) if (!ENGINE.test(m[1])) names.add(m[1])
  }
  return names
}

/**
 * The utility classes a stylesheet documents, by group, in the order written, and what is wrong:
 * a group's problems, a class a rule names that no group documents, and one documented that no
 * rule names.
 * @param {string} css
 * @returns {{ groups: ClassGroup[], problems: string[] }}
 */
export function describeClasses(css) {
  /** @type {ClassGroup[]} */
  const groups = []
  /** @type {string[]} */
  const problems = []
  for (const { start, end } of scanCss(css).comments) {
    const text = css.slice(start, end)
    if (!DOC_COMMENT.test(text)) continue
    if (!text.endsWith('*/')) {
      problems.push(`the /** comment at line ${css.slice(0, start).split('\n').length} is not closed`)
      continue
    }
    const read = readGroup(text.slice(3, -2))
    groups.push(read.group)
    problems.push(...read.problems)
  }
  const documented = new Set(groups.flatMap((g) => g.classes.map((c) => c.name)))
  const ruled = ruleClasses(css)
  for (const name of ruled) if (!documented.has(name)) problems.push(`.${name} is in a rule, and in no group's @class`)
  for (const name of documented) if (!ruled.has(name)) problems.push(`@class ${name} is in no rule`)
  return { groups, problems }
}
