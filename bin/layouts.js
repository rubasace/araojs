// arao layouts: every layout a slide of the project can name, run in a slides project (the
// current directory), with what each one is: what it is for, an example, its zones (the named
// templates it places) and its parameters (attributes of the slide), each described:
//   arao layouts            for a person: a block per layout
//   arao layouts --json     for a program (an agent): { layouts: [...] }
// Run by bin/arao.js: its options are what follows the command.
// The layouts are the project's Vite config's arao() plugin's (project.js: the same options, its
// layouts folder among them, as arao export and the app's build see): default (a Slide without a
// layout), the library's (but those a project file replaces), then the project's, each by name. What
// each says is the doc block its CSS file starts with, read by vite/layout-docs.js (which the
// types are written from too); its parameters are the tokens its CSS reads, its zones its @zone
// tags and the .ar-zone-<name> its CSS styles. A project layout's problems (a doc block that names
// a token it does not read, a token that is no attribute, a file that styles no slide) are listed
// with it. Reads, and writes nothing.
import { isAbsolute, relative } from 'node:path'
import { parseArgs } from 'node:util'
import { wrap } from '../vite/layout-docs.js'
import { projectPlugin } from './project.js'

const HELP = `Usage: arao layouts [--json]     (in a project: npx arao layouts)

  --json      the same as JSON, for a program: { "layouts": [{ name, source, file, replaces,
              documented, summary, description, example, zones: [{ name, description }],
              params: [{ name, token, description }], problems }] }
  -h, --help  this help

Run it in the slides project: its folder is the current directory, its layouts the ones its Vite
config's arao() plugin has: default, the library's, and the project's folder's (src/layouts by
default), one of which replaces the library's of its name.
What each layout says of itself is the /** … */ doc block its CSS file starts with: a line saying
what it is for, more lines if need be, then @example (a slide of it, in Pug), @zone <name>
<description> per named template it places and @param <thing> <description> per token it reads.`

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
    documented: l.documented,
    summary: l.summary,
    description: l.description,
    example: l.example,
    zones: l.zones.map((z) => ({ name: z.name, description: z.description })),
    params: l.params.map((p) => ({ name: p.thing, token: `--ar-layout-${l.name}-${p.thing}`, description: p.description })),
    problems: l.problems,
  }))
  console.log(JSON.stringify({ layouts: out }, null, 2))
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
      : `project, ${where(l.file)}${l.replaces ? ", replaces the library's" : ''}`

console.log(wrap('The layouts of this project, each named by Slide(layout="<name>"). Every slide takes the default '
  + 'slot (its title, the h1 or h2 it starts with, then its body) and #title (a header of its own '
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
