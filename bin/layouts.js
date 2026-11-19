// arao layouts: every layout a slide of the project can name, run in a slides project (the
// current directory), with what each one is: what it is for, an example, its zones (the named
// templates it places) and its parameters (attributes of the slide), each described; and then
// the utility classes a deck writes inside a slide, by group, each described:
//   arao layouts            for a person: a block per layout, then a block per group of classes
//   arao layouts --json     for a program (an agent): { version, layouts: [...], classes: [...],
//                           classGroups: [...] }
// Run by bin/arao.js: its options are what follows the command.
// The classes are the library's, as its stylesheet documents them (src/styles/utilities.css, in
// the package; read by vite/class-docs.js): a project adds none.
// The layouts are the project's Vite config's arao() plugin's (project.js: the same options, its
// layouts folder among them, as arao export and the app's build see): default (a Slide without a
// layout), the library's (but those a project file replaces), then every file of the project's
// folder, each by name (one whose name is no layout's too: no slide can name it, and it says so). What
// each says is the doc block its CSS file starts with, read by vite/layout-docs.js (which the
// types are written from too); its parameters are the tokens its CSS reads, its zones its @zone
// tags and the .ar-zone-<name> its CSS styles. A project layout's problems (a doc block that names
// a token it does not read, a token that is no attribute, a name that is no layout's, a file that
// styles no slide) are listed with it. Reads, and writes nothing; what the project's Vite config
// prints as it loads goes to stderr (project.js), so the JSON is all there is on stdout.
import { readFileSync } from 'node:fs'
import { isAbsolute, relative } from 'node:path'
import { parseArgs } from 'node:util'
import { describeClasses } from '../vite/class-docs.js'
import { wrap } from '../vite/layout-docs.js'
import { projectPlugin } from './project.js'

const HELP = `Usage: arao layouts [--json]     (in a project: npx arao layouts)

  --json      the same as JSON, for a program: { "version" (araojs's), "layouts": [{ name,
              source, file, replaces, validName, documented, summary, description, example,
              zones: [{ name, description }], params: [{ name, token, description }],
              problems }], "classes": [{ name, group, description }], "classGroups": [{ name,
              summary, description, example }] }
  -h, --help  this help

Run it in the slides project: its folder is the current directory, its layouts the ones its Vite
config's arao() plugin has: default, the library's, and the project's folder's (src/layouts by
default), one of which replaces the library's of its name.
What each layout says of itself is the /** … */ doc block its CSS file starts with: a line saying
what it is for, more lines if need be, then @example (a slide of it, in Pug), @zone <name>
<description> per named template it places and @param <thing> <description> per token it reads.
After the layouts: the utility classes, the library's classes a deck writes on an element of a
slide (p.muted, .cols), by group, as their stylesheet says them.`

// the utility classes, by group: the stylesheet of the araojs that prints them, in its package
const UTILITIES = new URL('../src/styles/utilities.css', import.meta.url)
const classGroups = describeClasses(readFileSync(UTILITIES, 'utf8')).groups

const root = process.cwd()
/** @type {{ json: boolean, help: boolean }} */
let args
try {
  args = parseArgs({
    args: process.argv.slice(3),
    options: {
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  }).values
} catch (e) {
  console.error(`layouts: ${/** @type {Error} */ (e).message}\n\n${HELP}`)
  process.exit(1)
}
if (args.help) {
  console.log(HELP)
  process.exit(0)
}

const layouts = (await projectPlugin('layouts', root)).layouts()
// a file as the project sees it: from its folder, or where it is when it is outside
/** @param {string | null} file */
const where = (file) => {
  if (file == null) return null
  const rel = relative(root, file)
  return rel.startsWith('..') || isAbsolute(rel) ? file : rel.split('\\').join('/')
}

if (args.json) {
  const out = layouts.map((l) => ({
    name: l.name,
    source: l.source,
    file: where(l.file),
    replaces: l.replaces,
    validName: l.validName,
    documented: l.documented,
    summary: l.summary,
    description: l.description,
    example: l.example,
    zones: l.zones.map((z) => ({ name: z.name, description: z.description })),
    params: l.params.map((p) => ({ name: p.thing, token: `--ar-layout-${l.name}-${p.thing}`, description: p.description })),
    problems: l.problems,
  }))
  // the classes, one entry per class of each group (a class two groups document is in both), and
  // what each group says of its classes
  const classes = classGroups.flatMap((g) => g.classes.map((c) => ({ name: c.name, group: g.name, description: c.description })))
  const groups = classGroups.map((g) => ({ name: g.name, summary: g.summary, description: g.description, example: g.example }))
  // the araojs that printed it: its package.json, next to this folder
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  console.log(JSON.stringify({ version, layouts: out, classes, classGroups: groups }, null, 2))
  process.exit(0)
}

const WIDTH = 100
/** @param {string} text @param {string} indent */
const block = (text, indent) => text.split('\n').map((l) => (l ? `${indent}${l}` : '')).join('\n')
// name, then its description wrapped beside it (lined up with the others')
/** @param {{ name: string, description: string }[]} items */
const table = (items) => {
  const col = Math.max(...items.map((i) => i.name.length)) + 2
  return items.map((i) => {
    if (!i.description) return `    ${i.name}`
    const [first, ...rest] = wrap(i.description, WIDTH - 4 - col)
    return [`    ${i.name.padEnd(col)}${first}`, ...rest.map((r) => `    ${' '.repeat(col)}${r}`)].join('\n')
  }).join('\n')
}
const from = (/** @type {typeof layouts[number]} */ l) =>
  l.source === 'engine' ? "the engine's: a Slide without a layout"
    : l.source === 'library' ? 'library'
      : `project, ${where(l.file)}${l.replaces ? ", replaces the library's" : ''}${l.validName ? '' : ', no slide can name it'}`

console.log(wrap('The layouts of this project, each named by Slide(layout="<name>"). Every slide takes the default '
  + 'slot (its title, the h1 or h2 it starts with, and its subtitle, a heading right after it of '
  + 'another tag, then its body) and #title (a header of its own '
  + "instead); a layout's zones are the other named templates it places, template(#<zone>); its "
  + 'parameters are attributes of the slide, each one setting the token --ar-layout-<name>-<parameter> '
  + 'on it.', WIDTH).join('\n'))
for (const l of layouts) {
  const out = ['', `${l.name} (${from(l)})`]
  if (!l.documented) out.push('  No doc block: a /** … */ comment its CSS file starts with says what it is for (arao layouts --help).')
  if (l.summary) out.push(`  ${l.summary}`)
  if (l.description) out.push(block(l.description, '  '))
  if (l.example) out.push('', '  Example:', block(l.example, '    '))
  if (l.documented || l.zones.length || l.params.length) out.push('')
  out.push(l.zones.length ? `  Zones:\n${table(l.zones.map((z) => ({ name: `#${z.name}`, description: z.description })))}` : '  Zones: none')
  out.push(l.params.length ? `  Parameters:\n${table(l.params.map((p) => ({ name: p.thing, description: p.description })))}` : '  Parameters: none')
  if (l.problems.length) out.push('  Problems:', ...l.problems.map((p) => wrap(p, WIDTH - 6).map((line, i) => `${i ? '      ' : '    - '}${line}`).join('\n')))
  console.log(out.join('\n'))
}

// the utility classes, a block per group
console.log(['', '', ...wrap('Utility classes: the classes a deck writes on an element of a slide (p.muted, .cols.grow), '
  + "which read the theme's tokens. They arrange and mark what is inside a block "
  + "(the body, a side of split, a block of grid, a zone); the slide's structure is its layout's.", WIDTH)].join('\n'))
for (const g of classGroups) {
  const out = ['', `${g.name}: ${g.summary}`]
  if (g.description) out.push(block(g.description, '  '))
  if (g.example) out.push('', '  Example:', block(g.example, '    '))
  out.push('', `  Classes:\n${table(g.classes)}`)
  console.log(out.join('\n'))
}
