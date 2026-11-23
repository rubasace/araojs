// The layout values check (vite/layout-literals.js), against a table of cases: what it must flag
// as a literal colour or a fixed length, and what it must leave alone (names, selectors, at-rules'
// preludes, tokens' channels…). `npm test` runs it, and `npm run build` runs that first, so CI
// does too; it exits 1 at the first table that disagrees, listing every case that did.
//   node scripts/layout-literals-test.mjs
import { literalFindings, literalProblems } from '../vite/layout-literals.js'

// a declaration (or several) in a rule of a layout
const rule = (/** @type {string} */ declarations) => `.layout-x { ${declarations} }`

/**
 * Each case: what it is, its CSS, and what it must find: per declaration that writes a literal,
 * its property, its literal colours and its fixed lengths (as written, once each), in order.
 * @type {[string, string, [string, string[], string[]][]][]}
 */
const CASES = [
  // names, not values
  ['url() with px and a hex-like text in a data URI', rule('background: url(data:image/svg+xml;utf8,<svg width=10px fill=%23fff>) no-repeat'), []],
  ['url(#id), and a quoted url', rule('mask: url(#cafe); background: url("a-10px-#fff.png")'), []],
  ['#id in a value: no colour', rule('--_ar-x-ref: #id'), []],
  ['counter() and counters(): names and styles', rule('content: counter(red, lower-roman) " " counters(white, ".")'), []],
  ['grid-area: red', rule('grid-area: red'), []],
  ['animation-name: white', rule('animation-name: white'), []],
  ['page: navy', rule('page: navy'), []],
  ['font-family with a colour word', rule('font-family: Lime, serif'), []],
  ['grid line names', rule('grid-template-columns: [red] 1fr [white] 2fr'), []],
  ['a string', rule('content: "#fff 10px"'), []],
  ['a comment', `/* #fff 10px */ ${rule('color: currentColor /* white */')}`, []],

  // selectors and at-rules' preludes are not read; the declarations inside them are
  ['a hex-like #id in a selector', '#cafe .x, .layout-x > #fff { color: currentColor }', []],
  [':nth-child(2n+1)', '.layout-x > :nth-child(2n+1) { margin: 0 }', []],
  ['@media prelude', '@media (min-width: 600px) { .layout-x { color: inherit } }', []],
  ['@container style query prelude', '@container style(--ar-layout-x-p: 10px) { .layout-x > * { padding: 0 } }', []],
  ['a declaration inside @media', '@media (min-width: 600px) { .layout-x { padding: 10px } }', [['padding', [], ['10px']]]],
  ['a nested rule', '.layout-x { &:hover { color: red } }', [['color', ['red'], []]]],

  // colours
  ['#FFF', rule('color: #FFF'), [['color', ['#FFF'], []]]],
  ['#rrggbbaa in a parameter default', rule('--_ar-x-c: var(--ar-layout-x-c, #ABCDEF80)'), [['--_ar-x-c', ['#ABCDEF80'], []]]],
  ['rgb() in a var() fallback', rule('color: var(--ar-layout-x-c, rgb(0 0 0 / .5))'), [['color', ['rgb(0 0 0 / .5)'], []]]],
  ['a token in a var() fallback', rule('color: var(--ar-layout-x-c, var(--ar-accent))'), []],
  ['rgb() of literal channels', rule('color: rgb(0 0 0)'), [['color', ['rgb(0 0 0)'], []]]],
  ['hsl() in a gradient', rule('background: linear-gradient(red, hsl(0 0% 0%))'), [['background', ['red', 'hsl(0 0% 0%)'], []]]],
  ['transparent and currentColor in a gradient', rule('background: linear-gradient(currentColor, transparent 40%)'), []],
  ['color-mix() over tokens', rule('color: color-mix(in srgb, var(--ar-fg) 15%, transparent)'), []],
  ['rgb(from white …): from a literal', rule('color: rgb(from white r g b / .5)'), [['color', ['white'], []]]],
  ['rgb(from var(--ar-accent) …): from a token', rule('color: rgb(from var(--ar-accent) r g b / .5)'), []],
  ['rgb(var(--x-rgb) / .5): tokens\' channels', rule('color: rgb(var(--x-rgb) / .5)'), []],
  ['hsl(var(--h) 50% 50%)', rule('color: hsl(var(--h) 50% 50%)'), []],
  ['rgba(var(--rgb), .5), with commas', rule('color: rgba(var(--rgb), .5)'), []],
  ['rgb() with calc() of a token', rule('color: rgb(var(--r) 0 0 / calc(var(--a) * .5))'), []],
  ['color(srgb var() …)', rule('color: color(srgb var(--r) var(--g) var(--b))'), []],
  ['tokens\' channels with a literal fallback', rule('color: rgb(var(--x, #000) / .5)'), [['color', ['#000'], []]]],
  ['a named colour', rule('border-color: white'), [['border-color', ['white'], []]]],
  ['a system colour', rule('color: CanvasText'), [['color', ['CanvasText'], []]]],
  ['a mask in black is a literal', rule('mask: linear-gradient(black, transparent)'), [['mask', ['black'], []]]],
  ['a mask in currentColor', rule('mask: linear-gradient(currentColor, transparent)'), []],

  // lengths
  ['0.5px', rule('border-width: 0.5px'), [['border-width', [], ['0.5px']]]],
  ['-1px', rule('margin: -1px'), [['margin', [], ['-1px']]]],
  ['1e3px', rule('width: 1e3px'), [['width', [], ['1e3px']]]],
  ['PX in upper case', rule('width: 12PX'), [['width', [], ['12PX']]]],
  ['zero in any unit', rule('margin: 0 0px 0.0em -0px'), []],
  ['rem and the window\'s units', rule('padding: 2rem 3vw 4dvh'), [['padding', [], ['2rem', '3vw', '4dvh']]]],
  ['relative units', rule('width: 50%; height: 2em; flex: 1fr; inline-size: 10cqi; gap: 1ch'), []],
  ['!important', rule('margin: 12px !important'), [['margin', [], ['12px']]]],
  ['a length and a colour in one declaration', rule('border: 1px solid #ccc'), [['border', ['#ccc'], ['1px']]]],

  // as written
  ['durations, angles, unitless numbers, keywords', rule('transition: opacity .3s; transform: rotate(45deg); opacity: .5; z-index: 999; line-height: 1.2; font-weight: 700; display: none'), []],
]

const wrong = []
const show = (/** @type {[string, string[], string[]][]} */ list) => JSON.stringify(list)
for (const [what, css, want] of CASES) {
  const got = literalFindings(css).map((f) => [f.property, f.colours, f.lengths])
  if (show(got) !== show(want)) wrong.push(`${what}: ${css}\n      found ${show(got)}, not ${show(want)}`)
}

// each finding at its declaration's line, and said as a problem: one for its colours, one for its
// lengths
const css = '/**\n * doc\n */\n.layout-x {\n  margin: 0;\n  border: 1px solid #ccc;\n}\n'
const lines = literalFindings(css).map((f) => f.line)
if (show(/** @type {any} */ (lines)) !== '[6]') wrong.push(`the line of border in ${JSON.stringify(css)}: ${lines}, not 6`)
const problems = literalProblems(css)
if (problems.length !== 2 || !problems[0].startsWith('line 6, border: #ccc is a literal colour; ') || !problems[1].startsWith('line 6, border: 1px is a fixed length; '))
  wrong.push(`the problems of ${JSON.stringify(css)}: ${JSON.stringify(problems)}`)

if (wrong.length) {
  console.error(`[arao] the layout values check (vite/layout-literals.js) disagrees with ${wrong.length} case(s):\n${wrong.map((w) => `  - ${w}`).join('\n')}`)
  process.exit(1)
}
console.log(`[arao] layout values check: ${CASES.length + 2} cases`)
